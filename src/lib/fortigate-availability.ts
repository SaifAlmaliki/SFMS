/**
 * FortiGate Availability Checker
 * Utility functions to check firewall availability before performing actions
 */

import { PrismaClient } from '../generated/prisma';
import { FortiGateClient, FortiGateDevice } from './fortigate';

const prisma = new PrismaClient();

export interface AvailabilityCheckResult {
  available: boolean;
  deviceName?: string;
  error?: string;
  version?: string;
  serial?: string;
}

/**
 * Check if any FortiGate device is available and connected
 * @returns Availability check result
 */
export async function checkFortiGateAvailability(): Promise<AvailabilityCheckResult> {
  try {
    // Get all active FortiGate devices
    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
      orderBy: {
        updatedAt: 'desc', // Try most recently updated devices first
      },
    });

    console.log(`[FortiGate Availability] Found ${devices.length} active FortiGate device(s):`);
    devices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.name} - IP: ${device.ip}, Updated: ${device.updatedAt}`);
    });

    if (devices.length === 0) {
      return {
        available: false,
        error: 'No FortiGate devices are configured. Please add a device in Settings.',
      };
    }

    // Try to connect to each device
    for (const device of devices) {
      if (!device.apiKey) {
        console.log(`[FortiGate Availability] Skipping device ${device.name}: No API key configured`);
        continue;
      }

      try {
        console.log(`[FortiGate Availability] Attempting connection to device: ${device.name} (IP: ${device.ip})`);
        console.log(`[FortiGate Availability] API Key (first 10 chars): ${device.apiKey.substring(0, 10)}...`);
        
        const fortigateDevice: FortiGateDevice = {
          id: device.id,
          name: device.name,
          ip: device.ip,
          apiKey: device.apiKey,
          version: device.version || undefined,
        };

        const client = new FortiGateClient(fortigateDevice);
        const connectionTest = await client.testConnection();
        
        console.log(`[FortiGate Availability] Connection test result for ${device.name}:`, {
          success: connectionTest.success,
          error: connectionTest.error,
        });

        if (connectionTest.success) {
          console.log(`[FortiGate Availability] Successfully connected to device: ${device.name}`);
          return {
            available: true,
            deviceName: device.name,
            version: connectionTest.version,
            serial: connectionTest.serial,
          };
        } else {
          console.warn(`[FortiGate Availability] Connection test failed for ${device.name}:`, connectionTest.error);
        }
      } catch (error: any) {
        // Continue to next device
        console.error(`[FortiGate Availability] Error checking device ${device.name} (IP: ${device.ip}):`, {
          message: error.message,
          name: error.name,
          code: error.code,
        });
      }
    }

    // No devices were reachable
    return {
      available: false,
      error: 'All FortiGate devices are unreachable. Please check your firewall connection.',
    };
  } catch (error: any) {
    return {
      available: false,
      error: `Error checking availability: ${error.message}`,
    };
  }
}

/**
 * Check if a specific FortiGate device is available
 * @param deviceName - Name of the device to check
 * @returns Availability check result
 */
export async function checkSpecificFortiGateDevice(deviceName: string): Promise<AvailabilityCheckResult> {
  try {
    const device = await prisma.device.findFirst({
      where: {
        name: deviceName,
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    if (!device) {
      return {
        available: false,
        error: `Device '${deviceName}' not found or not active.`,
      };
    }

    if (!device.apiKey) {
      return {
        available: false,
        error: `Device '${deviceName}' has no API key configured.`,
      };
    }

    const fortigateDevice: FortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version || undefined,
    };

    const client = new FortiGateClient(fortigateDevice);
    const connectionTest = await client.testConnection();

    if (connectionTest.success) {
      return {
        available: true,
        deviceName: device.name,
        version: connectionTest.version,
        serial: connectionTest.serial,
      };
    } else {
      return {
        available: false,
        deviceName: device.name,
        error: connectionTest.error || 'Connection test failed',
      };
    }
  } catch (error: any) {
    return {
      available: false,
      error: `Error checking device: ${error.message}`,
    };
  }
}

/**
 * Get all available FortiGate devices
 * @returns Array of available device names
 */
export async function getAvailableFortiGateDevices(): Promise<string[]> {
  try {
    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const availableDevices: string[] = [];

    for (const device of devices) {
      if (!device.apiKey) {
        continue;
      }

      try {
        const fortigateDevice: FortiGateDevice = {
          id: device.id,
          name: device.name,
          ip: device.ip,
          apiKey: device.apiKey,
          version: device.version || undefined,
        };

        const client = new FortiGateClient(fortigateDevice);
        const connectionTest = await client.testConnection();

        if (connectionTest.success) {
          availableDevices.push(device.name);
        }
      } catch (error) {
        // Skip unavailable devices
      }
    }

    return availableDevices;
  } catch (error) {
    console.error('Error getting available devices:', error);
    return [];
  }
}

