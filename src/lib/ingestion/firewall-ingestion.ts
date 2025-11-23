/**
 * Firewall Log Ingestion Service
 * Fetches logs from FortiGate devices and stores them in the database
 */

import 'server-only';
import { PrismaClient } from '../../generated/prisma';
import { FortiGateClient, FortiGateDevice } from '../fortigate';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface IngestionResult {
  success: boolean;
  itemsIngested: number;
  errors: string[];
  lastCursor?: string;
}

/**
 * Ingest traffic logs from a FortiGate device
 */
export async function ingestTrafficLogs(deviceId: string): Promise<IngestionResult> {
  const errors: string[] = [];
  let itemsIngested = 0;

  try {
    // Get device from database
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });

    if (!device || !device.apiKey) {
      return {
        success: false,
        itemsIngested: 0,
        errors: [`Device ${deviceId} not found or API key missing`]
      };
    }

    // Create ingestion run record
    const ingestionRun = await prisma.ingestionRun.create({
      data: {
        jobType: 'TrafficLog',
        deviceId: device.id,
        status: 'Running'
      }
    });

    try {
      // Create FortiGate client
      const fortigateDevice: FortiGateDevice = {
        id: device.id,
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        version: device.version || undefined,
      };

      const client = new FortiGateClient(fortigateDevice);

      // Test connection first
      const connectionTest = await client.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error}`);
      }

      // Get recent traffic logs (FortiGate monitor endpoint)
      const logsResult = await client.monitor.getFirewallSessions();
      
      if (!logsResult.success || !logsResult.data) {
        throw new Error(`Failed to fetch logs: ${logsResult.error || 'No data returned'}`);
      }

      // Process and store logs
      const logs = Array.isArray(logsResult.data) ? logsResult.data : [logsResult.data];
      
      for (const log of logs) {
        try {
          // Create a hash for deduplication
          const logString = JSON.stringify(log);
          const hash = crypto.createHash('sha256').update(logString).digest('hex');

          // Check if we already have this log
          const existingEvent = await prisma.firewallEvent.findUnique({
            where: { hash }
          });

          if (existingEvent) {
            continue; // Skip duplicate
          }

          // Determine severity based on log content
          let severity: 'Info' | 'Low' | 'Medium' | 'High' | 'Critical' = 'Info';
          if (log.action === 'deny' || log.action === 'block') {
            severity = 'Medium';
          }
          if (log.attack || log.threat) {
            severity = 'High';
          }

          // Store the event
          await prisma.firewallEvent.create({
            data: {
              deviceId: device.id,
              sourceEndpoint: '/monitor/firewall/session',
              severity,
              eventTime: log.timestamp ? new Date(log.timestamp * 1000) : new Date(),
              payload: log,
              hash
            }
          });

          itemsIngested++;
        } catch (error: any) {
          errors.push(`Error processing log: ${error.message}`);
        }
      }

      // Update ingestion run as successful
      await prisma.ingestionRun.update({
        where: { id: ingestionRun.id },
        data: {
          status: 'Success',
          completedAt: new Date(),
          itemsFetched: itemsIngested
        }
      });

      return {
        success: errors.length === 0,
        itemsIngested,
        errors
      };

    } catch (error: any) {
      // Update ingestion run as failed
      await prisma.ingestionRun.update({
        where: { id: ingestionRun.id },
        data: {
          status: 'Failed',
          completedAt: new Date(),
          error: error.message,
          itemsFetched: itemsIngested
        }
      });

      throw error;
    }

  } catch (error: any) {
    return {
      success: false,
      itemsIngested,
      errors: [`Ingestion failed: ${error.message}`]
    };
  }
}

/**
 * Ingest configuration snapshots from a FortiGate device
 */
export async function ingestConfigSnapshot(deviceId: string): Promise<IngestionResult> {
  const errors: string[] = [];
  let itemsIngested = 0;

  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });

    if (!device || !device.apiKey) {
      return {
        success: false,
        itemsIngested: 0,
        errors: [`Device ${deviceId} not found or API key missing`]
      };
    }

    const ingestionRun = await prisma.ingestionRun.create({
      data: {
        jobType: 'ConfigSnapshot',
        deviceId: device.id,
        status: 'Running'
      }
    });

    try {
      const fortigateDevice: FortiGateDevice = {
        id: device.id,
        name: device.name,
        ip: device.ip,
        apiKey: device.apiKey,
        version: device.version || undefined,
      };

      const client = new FortiGateClient(fortigateDevice);

      // Get global system configuration
      const globalConfigResult = await client.system.getGlobal();
      
      if (globalConfigResult.success && globalConfigResult.data) {
        await prisma.firewallSnapshot.create({
          data: {
            deviceId: device.id,
            snapshotType: 'ConfigGlobal',
            version: globalConfigResult.data.version || 'unknown',
            payload: globalConfigResult.data
          }
        });
        itemsIngested++;
      }

      // Get firewall policies
      const policiesResult = await client.firewall.getPolicies();
      
      if (policiesResult.success && policiesResult.data) {
        await prisma.firewallSnapshot.create({
          data: {
            deviceId: device.id,
            snapshotType: 'ConfigPolicy',
            payload: policiesResult.data
          }
        });
        itemsIngested++;
      }

      await prisma.ingestionRun.update({
        where: { id: ingestionRun.id },
        data: {
          status: 'Success',
          completedAt: new Date(),
          itemsFetched: itemsIngested
        }
      });

      return {
        success: true,
        itemsIngested,
        errors
      };

    } catch (error: any) {
      await prisma.ingestionRun.update({
        where: { id: ingestionRun.id },
        data: {
          status: 'Failed',
          completedAt: new Date(),
          error: error.message,
          itemsFetched: itemsIngested
        }
      });

      throw error;
    }

  } catch (error: any) {
    return {
      success: false,
      itemsIngested,
      errors: [`Config snapshot failed: ${error.message}`]
    };
  }
}

/**
 * Run ingestion for all active devices
 */
export async function runFullIngestion(): Promise<{
  devicesProcessed: number;
  totalItemsIngested: number;
  errors: string[];
}> {
  const devices = await prisma.device.findMany({
    where: { 
      status: 'Active',
      vendor: 'fortigate'
    }
  });

  let totalItemsIngested = 0;
  const allErrors: string[] = [];

  for (const device of devices) {
    try {
      // Ingest traffic logs
      const trafficResult = await ingestTrafficLogs(device.id);
      totalItemsIngested += trafficResult.itemsIngested;
      allErrors.push(...trafficResult.errors);

      // Ingest config snapshot
      const configResult = await ingestConfigSnapshot(device.id);
      totalItemsIngested += configResult.itemsIngested;
      allErrors.push(...configResult.errors);

    } catch (error: any) {
      allErrors.push(`Device ${device.name}: ${error.message}`);
    }
  }

  return {
    devicesProcessed: devices.length,
    totalItemsIngested,
    errors: allErrors
  };
}
