/**
 * Deployment utilities for firewall policy deployment with FortiGate support
 * 
 * NOTE: This file is server-only and should only be imported in server actions or API routes
 * It uses Prisma and FortiGate client which are server-only dependencies
 */

import { PrismaClient } from '../generated/prisma';
import { FortiGateClient, FortiGateDevice } from './fortigate';
import { convertPolicyToFortiGate } from './fortigate-policy-converter';
import type { Policy } from './data';

const prisma = new PrismaClient();

export interface DeploymentRequest {
  policyId: string;
  ticketId?: string;
  deployedBy: string;
  targetDevice: string;
  scheduledFor?: Date;
}

/**
 * Ensure address object exists in FortiGate, create if needed
 */
async function ensureAddressObject(
  apiClient: FortiGateClient,
  address: string,
  isIpAddress: boolean
): Promise<string> {
  // If it's not an IP address (e.g., "all", "any", or an existing address object name), use as-is
  if (!isIpAddress || address === 'all' || address === 'any') {
    return address;
  }

  // Generate a safe name for the address object (replace dots with underscores)
  const addressName = `ADDR_${address.replace(/\./g, '_')}`;

  try {
    // Check if address object already exists
    const existing = await apiClient.firewall.getAddress(addressName);
    if (existing.success && existing.data) {
      console.log(`Address object ${addressName} already exists, reusing it`);
      return addressName;
    }
    // If we get here, address doesn't exist (404 is expected and not an error)
    console.log(`Address object ${addressName} does not exist, creating it`);
  } catch (error) {
    // 404 is expected when address doesn't exist, not a real error
    // Other errors will be caught and handled below
    console.log(`Address object ${addressName} does not exist (404 expected), creating it`);
  }

  // Create the address object
  // For single IP address, use subnet format: "IP MASK" (e.g., "10.1.1.5 255.255.255.255")
  const addressData = {
    name: addressName,
    subnet: `${address} 255.255.255.255`, // Single IP with full mask
    type: 'ipmask',
  };

  console.log(`Creating address object: ${JSON.stringify(addressData, null, 2)}`);
  const createResult = await apiClient.firewall.createAddress(addressData);
  
  if (createResult.success) {
    console.log(`Successfully created address object ${addressName}`);
    return addressName;
  } else {
    // Check if error is because it already exists (error -2)
    if (createResult.error?.includes('-2') || createResult.error?.includes('already exists')) {
      console.log(`Address object ${addressName} already exists (created concurrently), reusing it`);
      return addressName;
    }
    
    // If creation fails for another reason, log and return the name anyway
    // The policy creation will fail with a clearer error if the address doesn't exist
    console.warn(`Failed to create address object ${addressName}: ${createResult.error}`);
    return addressName;
  }
}

/**
 * Deploy policy to FortiGate device using REST API
 */
async function deployToFortiGate(deviceName: string, policy: Policy): Promise<{ success: boolean; message?: string; vendorId?: string }> {
  try {
    // Get device information from database
    const device = await prisma.device.findFirst({
      where: { 
        name: deviceName,
        vendor: 'fortigate',
        status: 'Active'
      }
    });

    if (!device) {
      // Try exact match as fallback
      const exactDevice = await prisma.device.findFirst({
        where: { 
          name: deviceName,
          vendor: 'fortigate',
        }
      });
      
      if (exactDevice) {
        return {
          success: false,
          message: `FortiGate device '${deviceName}' found but status is '${exactDevice.status}', not 'Active'`,
        };
      }
      
      // List available devices for debugging
      const allDevices = await prisma.device.findMany({
        where: { vendor: 'fortigate' },
        select: { name: true, status: true },
      });
      
      return {
        success: false,
        message: `FortiGate device '${deviceName}' not found. Available devices: ${allDevices.map(d => `${d.name} (${d.status})`).join(', ') || 'none'}`,
      };
    }

    if (!device.apiKey) {
      return {
        success: false,
        message: `API key not configured for device '${deviceName}'`,
      };
    }

    // Create FortiGate API client
    const fortigateDevice: FortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version || undefined,
    };

    const apiClient = new FortiGateClient(fortigateDevice);

    // Test connection first
    const connectionTest = await apiClient.testConnection();
    if (!connectionTest.success) {
      return {
        success: false,
        message: `Connection failed: ${connectionTest.error}`,
      };
    }

    // Convert policy to FortiGate format
    let fortigatePolicy = convertPolicyToFortiGate(policy);
    
    // When deploying, always enable the policy since deployment only happens after approval
    fortigatePolicy.status = 'enable';
    
    // Ensure address objects exist before creating policy
    // Extract IP addresses from srcaddr and dstaddr arrays
    const srcIp = Array.isArray(fortigatePolicy.srcaddr) && fortigatePolicy.srcaddr.length > 0
      ? fortigatePolicy.srcaddr[0].name
      : null;
    const dstIp = Array.isArray(fortigatePolicy.dstaddr) && fortigatePolicy.dstaddr.length > 0
      ? fortigatePolicy.dstaddr[0].name
      : null;

    // Check if they look like IP addresses (simple regex check)
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    const srcIsIp = srcIp && ipRegex.test(srcIp);
    const dstIsIp = dstIp && ipRegex.test(dstIp);

    // Ensure address objects exist
    if (srcIsIp) {
      const srcAddrName = await ensureAddressObject(apiClient, srcIp, true);
      fortigatePolicy.srcaddr = [{ name: srcAddrName }];
    }

    if (dstIsIp) {
      const dstAddrName = await ensureAddressObject(apiClient, dstIp, true);
      fortigatePolicy.dstaddr = [{ name: dstAddrName }];
    }
    
    // Log the policy being deployed for debugging
    console.log('Deploying policy to FortiGate:', JSON.stringify(fortigatePolicy, null, 2));

    // Deploy the policy using the firewall client
    const deployResult = await apiClient.firewall.createPolicy(fortigatePolicy);
    
    // Log the deployment result for debugging
    console.log('FortiGate deployment result:', {
      success: deployResult.success,
      error: deployResult.error,
      data: deployResult.data,
      status: deployResult.status,
    });
    
    if (deployResult.success) {
      // Extract policy ID from FortiGate response
      // FortiGate returns the policy in results, and policyid is usually in the response
      const policyId = deployResult.data?.policyid || deployResult.data?.id || 'unknown';
      
      return {
        success: true,
        message: 'Policy deployed successfully to FortiGate',
        vendorId: policyId.toString(),
      };
    } else {
      // Provide more detailed error information
      let errorMsg = deployResult.error || 'Unknown deployment error';
      
      // Check if addresses need to be created first
      if (errorMsg.includes('-3') || errorMsg.includes('Invalid value')) {
        errorMsg += '\n\n💡 Tip: The source or destination address might not exist in FortiGate. You may need to create address objects first, or use existing address object names instead of IP addresses.';
      }
      
      return {
        success: false,
        message: `Deployment failed: ${errorMsg}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Deployment error: ${error.message}`,
    };
  }
}

/**
 * Deploy policy to firewall
 */
export async function deployPolicy(request: DeploymentRequest): Promise<string> {
  // Get the policy details
  const policy = await prisma.policy.findUnique({
    where: { id: request.policyId },
  });

  if (!policy) {
    throw new Error(`Policy ${request.policyId} not found`);
  }

  // Create deployment record
  const deployment = await prisma.policyDeployment.create({
    data: {
      policyId: request.policyId,
      ticketId: request.ticketId,
      deployedBy: request.deployedBy,
      targetDevice: request.targetDevice,
      status: 'InProgress',
    },
  });

  try {
    // Deploy to FortiGate
    const result = await deployToFortiGate(request.targetDevice, policy);

    if (result.success) {
      // Update deployment status
      await prisma.policyDeployment.update({
        where: { id: deployment.id },
        data: {
          status: 'Success',
          deployedAt: new Date(),
        },
      });

      // Update policy with vendor ID
      await prisma.policy.update({
        where: { id: request.policyId },
        data: { 
          status: 'Active',
          vendorId: result.vendorId,
        },
      });

      // Update ticket status if exists
      if (request.ticketId) {
        await prisma.changeTicket.update({
          where: { id: request.ticketId },
          data: {
            status: 'Deployed',
            deployedAt: new Date(),
          },
        });
      }

      return deployment.id;
    } else {
      // Deployment failed
      await prisma.policyDeployment.update({
        where: { id: deployment.id },
        data: {
          status: 'Failed',
          errorMessage: result.message,
        },
      });

      if (request.ticketId) {
        await prisma.changeTicket.update({
          where: { id: request.ticketId },
          data: {
            status: 'Failed',
          },
        });
      }

      throw new Error(result.message);
    }
  } catch (error: any) {
    // Update deployment status
    await prisma.policyDeployment.update({
      where: { id: deployment.id },
      data: {
        status: 'Failed',
        errorMessage: error.message,
      },
    });

    throw error;
  }
}

/**
 * Rollback a failed deployment
 */
export async function rollbackDeployment(deploymentId: string): Promise<void> {
  const deployment = await prisma.policyDeployment.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  if (deployment.status !== 'Failed' && deployment.status !== 'Success') {
    throw new Error('Can only rollback failed or successful deployments');
  }

  // Create rollback deployment
  await prisma.policyDeployment.create({
    data: {
      policyId: deployment.policyId,
      ticketId: deployment.ticketId,
      deployedBy: deployment.deployedBy,
      targetDevice: deployment.targetDevice,
      status: 'RolledBack',
      rollbackId: deployment.id,
    },
  });

  // Update ticket status
  if (deployment.ticketId) {
    await prisma.changeTicket.update({
      where: { id: deployment.ticketId },
      data: {
        status: 'Failed',
      },
    });
  }

  // Revert policy status
  await prisma.policy.update({
    where: { id: deployment.policyId },
    data: { status: 'Inactive' },
  });
}

/**
 * Get deployment history for a policy
 */
export async function getDeploymentHistory(policyId: string) {
  return await prisma.policyDeployment.findMany({
    where: { policyId },
    orderBy: { deployedAt: 'desc' },
  });
}

