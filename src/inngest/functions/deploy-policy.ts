/**
 * Inngest function to deploy policies to firewalls
 */

import { inngest } from '../client';
import { deployPolicy } from '@/lib/deployment';
import { sendDeploymentNotification } from '@/lib/email';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

interface DeploymentRequest {
  policyId: string;
  ticketId?: string;
  deployedBy: string;
  targetDevice: string;
  scheduledFor?: Date;
}

export const deployPolicyToFirewall = inngest.createFunction(
  {
    id: 'deploy-firewall-policy',
    name: 'Deploy Firewall Policy',
    retries: 2,
  },
  { event: 'firewall/policy.deploy' },
  async ({ event, step }) => {
    const request = event.data as DeploymentRequest;

    const deploymentId = await step.run('Deploy Policy', async () => {
      return await deployPolicy(request);
    });

    await step.run('Send Notification', async () => {
      const policy = await prisma.policy.findUnique({
        where: { id: request.policyId },
      });

      // Get user email from request.deployedBy (in real system, look up user)
      const recipientEmail = `${request.deployedBy}@ai-firewall.local`;
      
      await sendDeploymentNotification(recipientEmail, {
        policyName: policy?.name || 'Unknown Policy',
        status: 'Success',
        device: request.targetDevice,
      });

      return { notificationSent: true };
    });

    return { deploymentId, timestamp: new Date() };
  }
);

