/**
 * FortiGate Interface and Route Configuration Service
 * Handles interface and static route management with rollback, validation, and audit logging
 */

import 'server-only';
import { PrismaClient } from '../generated/prisma';
import { FortiGateClient, FortiGateDevice } from './fortigate';
import { isValidIpOrCidr, isValidIpv4 } from './ip-validation';
import { createFortiGateClientFromDevice } from './fortigate/client-factory';

const prisma = new PrismaClient();

export interface InterfaceConfig {
  name: string;
  type?: 'physical' | 'vlan' | 'loopback' | 'aggregate' | 'tunnel';
  ip?: string;
  mask?: string;
  vdom?: string;
  alias?: string;
  parentInterface?: string;
  vlanId?: number;
  allowaccess?: string[];
  status?: 'up' | 'down';
}

export interface RouteConfig {
  destination: string;
  gateway: string;
  device?: string;
  distance?: number;
  priority?: number;
  vdom?: string;
  comment?: string;
  blackhole?: boolean;
  weight?: number;
}

export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
  snapshotId?: string;
}

/**
 * Retry configuration
 */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Retry wrapper for API calls
 */
async function retryApiCall<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      // Check if error is retryable (403, 404, 500)
      const status = error.status || error.httpStatus || 0;
      if (status === 403 || status === 404 || status === 500) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return retryApiCall(fn, retries - 1);
      }
    }
    throw error;
  }
}

/**
 * Create configuration snapshot before operation
 */
async function createInterfaceSnapshot(
  deviceName: string,
  vdom: string | undefined,
  action: string,
  userId: string,
  interfaceName?: string
): Promise<string | null> {
  try {
    const device = await prisma.device.findUnique({
      where: { name: deviceName },
    });

    if (!device || !device.apiKey) {
      return null;
    }

    const fortigateClient = new FortiGateClient({
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      vdom: vdom || device.vdom || undefined,
    });

    // Fetch current interface configuration
    const response = await fortigateClient.system.getInterfaces({ vdom });
    
    if (response.success && response.data) {
      const snapshot = await prisma.interfaceConfigSnapshot.create({
        data: {
          deviceName,
          vdom: vdom || null,
          snapshot: response.data,
          createdBy: userId,
          action,
          interfaceName: interfaceName || null,
        },
      });
      return snapshot.id;
    }
  } catch (error) {
    console.error('Failed to create interface snapshot:', error);
  }
  return null;
}

async function createRouteSnapshot(
  deviceName: string,
  vdom: string | undefined,
  action: string,
  userId: string,
  routeSeqNum?: number
): Promise<string | null> {
  try {
    const device = await prisma.device.findUnique({
      where: { name: deviceName },
    });

    if (!device || !device.apiKey) {
      return null;
    }

    const fortigateClient = new FortiGateClient({
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      vdom: vdom || device.vdom || undefined,
    });

    // Fetch current route configuration
    const response = await fortigateClient.router.getStaticRoutes({ vdom });
    
    if (response.success && response.data) {
      const snapshot = await prisma.routeConfigSnapshot.create({
        data: {
          deviceName,
          vdom: vdom || null,
          snapshot: response.data,
          createdBy: userId,
          action,
          routeSeqNum: routeSeqNum || null,
        },
      });
      return snapshot.id;
    }
  } catch (error) {
    console.error('Failed to create route snapshot:', error);
  }
  return null;
}

/**
 * Log operation to audit log
 */
async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  details: any,
  success: boolean
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId || undefined,
        details: {
          ...details,
          success,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

/**
 * Interface Management Service
 */
export class FortiGateInterfaceService {
  /**
   * Get all interfaces
   */
  static async getInterfaces(deviceName: string, vdom?: string): Promise<OperationResult> {
    try {
      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: vdom || device.vdom || undefined,
      });

      const response = await retryApiCall(() =>
        fortigateClient.system.getInterfaces({ vdom })
      );

      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  /**
   * Create interface
   */
  static async createInterface(
    deviceName: string,
    config: InterfaceConfig,
    userId: string
  ): Promise<OperationResult> {
    let snapshotId: string | null = null;

    try {
      // Validate input
      if (!config.name) {
        return { success: false, error: 'Interface name is required' };
      }

      if (config.ip && !isValidIpv4(config.ip)) {
        return { success: false, error: `Invalid IP address: ${config.ip}` };
      }

      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      // Create snapshot before operation
      snapshotId = await createInterfaceSnapshot(
        deviceName,
        config.vdom,
        'create',
        userId,
        config.name
      );

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: config.vdom || device.vdom || undefined,
      });

      // Build API payload
      const payload: any = {
        name: config.name,
        type: config.type || 'physical',
        status: config.status || 'up',
      };

      if (config.ip && config.mask) {
        // Convert mask to CIDR if needed
        let ipAddress = config.ip;
        if (config.mask.startsWith('/')) {
          ipAddress = `${config.ip}${config.mask}`;
        } else {
          // Convert subnet mask to CIDR (simplified - assumes standard masks)
          const maskParts = config.mask.split('.');
          let cidr = 0;
          for (const part of maskParts) {
            const num = parseInt(part, 10);
            cidr += (num >>> 0).toString(2).split('1').length - 1;
          }
          ipAddress = `${config.ip}/${cidr}`;
        }
        payload.ip = ipAddress;
      }

      if (config.alias) payload.alias = config.alias;
      if (config.vdom) payload.vdom = config.vdom;
      if (config.parentInterface) payload.interface = config.parentInterface;
      if (config.vlanId) payload.vlanid = config.vlanId;
      if (config.allowaccess) payload.allowaccess = config.allowaccess;

      const response = await retryApiCall(() =>
        fortigateClient.system.createInterface(payload, { vdom: config.vdom })
      );

      // Log audit
      await logAudit(
        userId,
        'create_interface',
        'interface',
        config.name,
        { deviceName, config, snapshotId },
        response.success
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to create interface',
          snapshotId: snapshotId || undefined,
        };
      }

      return {
        success: true,
        data: response.data,
        snapshotId: snapshotId || undefined,
      };
    } catch (error: any) {
      await logAudit(
        userId,
        'create_interface',
        'interface',
        config.name,
        { deviceName, config, error: error.message },
        false
      );

      return {
        success: false,
        error: error.message || String(error),
        snapshotId: snapshotId || undefined,
      };
    }
  }

  /**
   * Update interface
   */
  static async updateInterface(
    deviceName: string,
    interfaceName: string,
    config: Partial<InterfaceConfig>,
    userId: string
  ): Promise<OperationResult> {
    let snapshotId: string | null = null;

    try {
      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      // Create snapshot before operation
      snapshotId = await createInterfaceSnapshot(
        deviceName,
        config.vdom,
        'update',
        userId,
        interfaceName
      );

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: config.vdom || device.vdom || undefined,
      });

      // Build update payload
      const payload: any = {};
      if (config.ip && config.mask) {
        let ipAddress = config.ip;
        if (config.mask.startsWith('/')) {
          ipAddress = `${config.ip}${config.mask}`;
        } else {
          const maskParts = config.mask.split('.');
          let cidr = 0;
          for (const part of maskParts) {
            const num = parseInt(part, 10);
            cidr += (num >>> 0).toString(2).split('1').length - 1;
          }
          ipAddress = `${config.ip}/${cidr}`;
        }
        payload.ip = ipAddress;
      }
      if (config.alias !== undefined) payload.alias = config.alias;
      if (config.status) payload.status = config.status;
      if (config.allowaccess) payload.allowaccess = config.allowaccess;

      const response = await retryApiCall(() =>
        fortigateClient.system.updateInterface(interfaceName, payload, { vdom: config.vdom })
      );

      await logAudit(
        userId,
        'update_interface',
        'interface',
        interfaceName,
        { deviceName, config, snapshotId },
        response.success
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to update interface',
          snapshotId: snapshotId || undefined,
        };
      }

      return {
        success: true,
        data: response.data,
        snapshotId: snapshotId || undefined,
      };
    } catch (error: any) {
      await logAudit(
        userId,
        'update_interface',
        'interface',
        interfaceName,
        { deviceName, config, error: error.message },
        false
      );

      return {
        success: false,
        error: error.message || String(error),
        snapshotId: snapshotId || undefined,
      };
    }
  }

  /**
   * Delete interface
   */
  static async deleteInterface(
    deviceName: string,
    interfaceName: string,
    vdom: string | undefined,
    userId: string
  ): Promise<OperationResult> {
    let snapshotId: string | null = null;

    try {
      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      // Create snapshot before operation
      snapshotId = await createInterfaceSnapshot(
        deviceName,
        vdom,
        'delete',
        userId,
        interfaceName
      );

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: vdom || device.vdom || undefined,
      });

      const response = await retryApiCall(() =>
        fortigateClient.system.deleteInterface(interfaceName, { vdom })
      );

      await logAudit(
        userId,
        'delete_interface',
        'interface',
        interfaceName,
        { deviceName, snapshotId },
        response.success
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to delete interface',
          snapshotId: snapshotId || undefined,
        };
      }

      return {
        success: true,
        data: response.data,
        snapshotId: snapshotId || undefined,
      };
    } catch (error: any) {
      await logAudit(
        userId,
        'delete_interface',
        'interface',
        interfaceName,
        { deviceName, error: error.message },
        false
      );

      return {
        success: false,
        error: error.message || String(error),
        snapshotId: snapshotId || undefined,
      };
    }
  }
}

/**
 * Route Management Service
 */
export class FortiGateRouteService {
  /**
   * Get all static routes
   */
  static async getStaticRoutes(deviceName: string, vdom?: string): Promise<OperationResult> {
    try {
      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: vdom || device.vdom || undefined,
      });

      const response = await retryApiCall(() =>
        fortigateClient.router.getStaticRoutes({ vdom })
      );

      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  /**
   * Get next available sequence number for static route
   */
  static async getNextSequenceNumber(deviceName: string, vdom?: string): Promise<number> {
    try {
      const result = await this.getStaticRoutes(deviceName, vdom);
      if (result.success && result.data) {
        const routes = Array.isArray(result.data) ? result.data : [];
        if (routes.length === 0) return 1;
        
        // Extract sequence numbers and find max
        const seqNums = routes
          .map((r: any) => {
            // FortiGate returns routes with seq_num field
            return r.seq_num || r['seq-num'] || 0;
          })
          .filter((n: number) => n > 0);
        
        return seqNums.length > 0 ? Math.max(...seqNums) + 1 : 1;
      }
    } catch (error) {
      console.error('Failed to get next sequence number:', error);
    }
    return 1;
  }

  /**
   * Create static route
   */
  static async createStaticRoute(
    deviceName: string,
    config: RouteConfig,
    userId: string
  ): Promise<OperationResult> {
    let snapshotId: string | null = null;

    try {
      // Validate input
      if (!config.destination || !isValidIpOrCidr(config.destination)) {
        return { success: false, error: 'Invalid destination CIDR' };
      }

      if (!config.gateway || !isValidIpv4(config.gateway)) {
        return { success: false, error: 'Invalid gateway IP address' };
      }

      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      // Create snapshot before operation
      snapshotId = await createRouteSnapshot(
        deviceName,
        config.vdom,
        'create',
        userId
      );

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: config.vdom || device.vdom || undefined,
      });

      // Get next sequence number
      const seqNum = await this.getNextSequenceNumber(deviceName, config.vdom);

      // Build API payload
      const payload: any = {
        seq_num: seqNum,
        dst: config.destination,
        gateway: config.gateway,
      };

      if (config.device) payload.device = config.device;
      if (config.distance !== undefined) payload.distance = config.distance;
      if (config.priority !== undefined) payload.priority = config.priority;
      if (config.comment) payload.comment = config.comment;
      if (config.blackhole) payload.blackhole = config.blackhole ? 'enable' : 'disable';
      if (config.weight !== undefined) payload.weight = config.weight;

      const response = await retryApiCall(() =>
        fortigateClient.router.createStaticRoute(payload, { vdom: config.vdom })
      );

      await logAudit(
        userId,
        'create_route',
        'static_route',
        seqNum.toString(),
        { deviceName, config, seqNum, snapshotId },
        response.success
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to create static route',
          snapshotId: snapshotId || undefined,
        };
      }

      return {
        success: true,
        data: { ...response.data, seqNum },
        snapshotId: snapshotId || undefined,
      };
    } catch (error: any) {
      await logAudit(
        userId,
        'create_route',
        'static_route',
        'unknown',
        { deviceName, config, error: error.message },
        false
      );

      return {
        success: false,
        error: error.message || String(error),
        snapshotId: snapshotId || undefined,
      };
    }
  }

  /**
   * Update static route
   */
  static async updateStaticRoute(
    deviceName: string,
    seqNum: number,
    config: Partial<RouteConfig>,
    userId: string
  ): Promise<OperationResult> {
    let snapshotId: string | null = null;

    try {
      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      // Create snapshot before operation
      snapshotId = await createRouteSnapshot(
        deviceName,
        config.vdom,
        'update',
        userId,
        seqNum
      );

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: config.vdom || device.vdom || undefined,
      });

      // Build update payload
      const payload: any = {};
      if (config.destination) payload.dst = config.destination;
      if (config.gateway) payload.gateway = config.gateway;
      if (config.device) payload.device = config.device;
      if (config.distance !== undefined) payload.distance = config.distance;
      if (config.priority !== undefined) payload.priority = config.priority;
      if (config.comment !== undefined) payload.comment = config.comment;
      if (config.blackhole !== undefined) payload.blackhole = config.blackhole ? 'enable' : 'disable';
      if (config.weight !== undefined) payload.weight = config.weight;

      const response = await retryApiCall(() =>
        fortigateClient.router.updateStaticRoute(seqNum, payload, { vdom: config.vdom })
      );

      await logAudit(
        userId,
        'update_route',
        'static_route',
        seqNum.toString(),
        { deviceName, config, seqNum, snapshotId },
        response.success
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to update static route',
          snapshotId: snapshotId || undefined,
        };
      }

      return {
        success: true,
        data: response.data,
        snapshotId: snapshotId || undefined,
      };
    } catch (error: any) {
      await logAudit(
        userId,
        'update_route',
        'static_route',
        seqNum.toString(),
        { deviceName, config, error: error.message },
        false
      );

      return {
        success: false,
        error: error.message || String(error),
        snapshotId: snapshotId || undefined,
      };
    }
  }

  /**
   * Delete static route
   */
  static async deleteStaticRoute(
    deviceName: string,
    seqNum: number,
    vdom: string | undefined,
    userId: string
  ): Promise<OperationResult> {
    let snapshotId: string | null = null;

    try {
      const device = await prisma.device.findUnique({
        where: { name: deviceName },
      });

      if (!device || !device.apiKey) {
        return {
          success: false,
          error: `Device ${deviceName} not found or API key not configured`,
        };
      }

      // Create snapshot before operation
      snapshotId = await createRouteSnapshot(
        deviceName,
        vdom,
        'delete',
        userId,
        seqNum
      );

      const fortigateClient = new FortiGateClient({
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        vdom: vdom || device.vdom || undefined,
      });

      const response = await retryApiCall(() =>
        fortigateClient.router.deleteStaticRoute(seqNum, { vdom })
      );

      await logAudit(
        userId,
        'delete_route',
        'static_route',
        seqNum.toString(),
        { deviceName, seqNum, snapshotId },
        response.success
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to delete static route',
          snapshotId: snapshotId || undefined,
        };
      }

      return {
        success: true,
        data: response.data,
        snapshotId: snapshotId || undefined,
      };
    } catch (error: any) {
      await logAudit(
        userId,
        'delete_route',
        'static_route',
        seqNum.toString(),
        { deviceName, error: error.message },
        false
      );

      return {
        success: false,
        error: error.message || String(error),
        snapshotId: snapshotId || undefined,
      };
    }
  }
}

