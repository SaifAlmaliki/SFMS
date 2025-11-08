/**
 * FortiGate Policy Sync
 * Syncs policies between FortiGate firewall and database
 */

import { PrismaClient } from '../generated/prisma';
import { FortiGateClient, FortiGateDevice } from './fortigate';
import { convertFortiGateToPolicy } from './fortigate-policy-converter';
import type { Policy } from './data';

const prisma = new PrismaClient();

/**
 * Fetch all policies from FortiGate device and sync with database
 */
export async function syncPoliciesFromFortiGate(deviceName: string): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Get device from database
    const device = await prisma.device.findFirst({
      where: {
        name: deviceName,
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    if (!device || !device.apiKey) {
      return {
        success: false,
        synced: 0,
        errors: [`Device '${deviceName}' not found or API key not configured`],
      };
    }

    // Create FortiGate client
    const fortigateDevice: FortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version || undefined,
    };

    const client = new FortiGateClient(fortigateDevice);

    // Test connection
    const connectionTest = await client.testConnection();
    if (!connectionTest.success) {
      return {
        success: false,
        synced: 0,
        errors: [`Connection failed: ${connectionTest.error}`],
      };
    }

    // Fetch policies from FortiGate
    const policiesResult = await client.firewall.getPolicies();

    if (!policiesResult.success || !policiesResult.data) {
      return {
        success: false,
        synced: 0,
        errors: [`Failed to fetch policies: ${policiesResult.error || 'Unknown error'}`],
      };
    }

    // FortiGate returns policies in results array
    // Handle different response formats
    let fortigatePolicies: any[] = [];
    
    if (Array.isArray(policiesResult.data)) {
      fortigatePolicies = policiesResult.data;
    } else if (policiesResult.data && typeof policiesResult.data === 'object') {
      // Check if results is an array
      if (Array.isArray(policiesResult.data.results)) {
        fortigatePolicies = policiesResult.data.results;
      } else if (policiesResult.data.results && typeof policiesResult.data.results === 'object') {
        // If results is an object, it might be a single policy or an object with policy IDs as keys
        if (policiesResult.data.results.policyid !== undefined) {
          // Single policy object
          fortigatePolicies = [policiesResult.data.results];
        } else {
          // Object with policy IDs as keys (common FortiGate format)
          fortigatePolicies = Object.values(policiesResult.data.results);
        }
      }
    }

    // Sync each policy
    for (const fgPolicy of fortigatePolicies) {
      try {
        // Convert to database format
        const policyData = convertFortiGateToPolicy(fgPolicy, deviceName);

        // Check if policy already exists by vendorId
        const existingPolicy = fgPolicy.policyid
          ? await prisma.policy.findFirst({
              where: {
                vendorId: fgPolicy.policyid.toString(),
                targetDevice: deviceName,
              },
            })
          : null;

        if (existingPolicy) {
          // Update existing policy
          await prisma.policy.update({
            where: { id: existingPolicy.id },
            data: {
              ...policyData,
              updatedAt: new Date(),
            } as any,
          });
          synced++;
        } else {
          // Create new policy
          const policyId = `POL-FG-${fgPolicy.policyid || Date.now()}`;
          await prisma.policy.create({
            data: {
              id: policyId,
              ...policyData,
              vendor: 'fortigate',
              vendorId: fgPolicy.policyid?.toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
          });
          synced++;
        }
      } catch (error: any) {
        errors.push(`Error syncing policy ${fgPolicy.policyid || 'unknown'}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      synced,
      errors: [`Sync failed: ${error.message}`],
    };
  }
}

/**
 * Sync policies from all active FortiGate devices
 */
export async function syncAllFortiGatePolicies(): Promise<{
  success: boolean;
  totalSynced: number;
  deviceResults: Record<string, { synced: number; errors: string[] }>;
}> {
  const devices = await prisma.device.findMany({
    where: {
      vendor: 'fortigate',
      status: 'Active',
    },
  });

  const deviceResults: Record<string, { synced: number; errors: string[] }> = {};
  let totalSynced = 0;

  for (const device of devices) {
    const result = await syncPoliciesFromFortiGate(device.name);
    deviceResults[device.name] = {
      synced: result.synced,
      errors: result.errors,
    };
    totalSynced += result.synced;
  }

  return {
    success: true,
    totalSynced,
    deviceResults,
  };
}

