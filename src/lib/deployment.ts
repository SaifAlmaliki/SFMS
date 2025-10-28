/**
 * Deployment utilities for firewall policy deployment with FortiGate support
 */

import { PrismaClient } from '../generated/prisma';
import { MockFortiGateApiClient, FortiGateDevice } from './fortigate-api';
import { FORTIGATE_VENDOR } from './firewall-vendors';

const prisma = new PrismaClient();

export interface DeploymentRequest {
  policyId: string;
  ticketId?: string;
  deployedBy: string;
  targetDevice: string;
  scheduledFor?: Date;
}

/**
 * Deploy policy to FortiGate device using REST API
 */
async function deployToFortiGate(deviceName: string, policy: any): Promise<{ success: boolean; message?: string; vendorId?: string }> {
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
      return {
        success: false,
        message: `FortiGate device '${deviceName}' not found or inactive`,
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

    const apiClient = new MockFortiGateApiClient(fortigateDevice); // Use MockFortiGateApiClient for now

    // Test connection first
    const connectionTest = await apiClient.testConnection();
    if (!connectionTest.success) {
      return {
        success: false,
        message: `Connection failed: ${connectionTest.error}`,
      };
    }

    // Deploy the policy
    const deployResult = await apiClient.createPolicy(policy.rawConfig || policy);
    
    if (deployResult.success) {
      return {
        success: true,
        message: 'Policy deployed successfully to FortiGate',
        vendorId: deployResult.data?.id || 'unknown',
      };
    } else {
      return {
        success: false,
        message: `Deployment failed: ${deployResult.error}`,
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

