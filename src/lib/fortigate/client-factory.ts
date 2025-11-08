/**
 * FortiGate Client Factory
 * Helper functions to create FortiGate API clients
 */

import { FortiGateClient, FortiGateDevice } from './index';
import { MockFortiGateClient } from './mock-client';

/**
 * Create a FortiGate API client
 * @param device Device configuration
 * @param useMock Whether to use mock client (defaults to false, or true in development)
 * @returns FortiGate API client instance
 */
export function createFortiGateClient(
  device: FortiGateDevice,
  useMock?: boolean
): FortiGateClient {
  // Use mock if explicitly requested or in development mode
  const shouldUseMock = useMock ?? (process.env.NODE_ENV === 'development');
  
  if (shouldUseMock) {
    return new MockFortiGateClient(device);
  }
  
  return new FortiGateClient(device);
}

/**
 * Create a FortiGate client from device database record
 */
export async function createFortiGateClientFromDevice(
  deviceName: string,
  useMock?: boolean
): Promise<FortiGateClient | null> {
  try {
    const { PrismaClient } = await import('../../generated/prisma');
    const prisma = new PrismaClient();
    
    const device = await prisma.device.findFirst({
      where: {
        name: deviceName,
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    if (!device || !device.apiKey) {
      return null;
    }

    const fortigateDevice: FortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version || undefined,
      vdom: undefined, // Can be added to device model if needed
    };

    return createFortiGateClient(fortigateDevice, useMock);
  } catch (error) {
    console.error('Error creating FortiGate client from device:', error);
    return null;
  }
}

