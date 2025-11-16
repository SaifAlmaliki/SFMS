'use server';

import { generateFirewallPolicy } from '@/ai/flows/generate-firewall-policy';
import { nlpChatbotAssistance } from '@/ai/flows/nlp-chatbot-assistance';
import { selfHealingMisconfigurations } from '@/ai/flows/self-healing-misconfigurations';
import { manageRetrainEvaluateVersion } from '@/ai/flows/ai-manage-retrain-evaluate-version';
import type { ManageRetrainEvaluateVersionInput } from '@/ai/flows/ai-manage-retrain-evaluate-version';
import { detectAdminAnomalies } from '@/ai/flows/detect-admin-anomalies';
import { addPolicy, deletePolicy, updatePolicy, rollbackSnapshot } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateFirewallPolicy } from '@/ai/flows/validate-firewall-policy';
import { simulatePolicy } from '@/ai/flows/simulate-policy';
import { emulateAdversary } from '@/ai/flows/emulate-adversary';
import { createIncident } from '@/ai/flows/create-incident';
import { FortiGateClient, FortiGateDevice } from '@/lib/fortigate';
import { PrismaClient } from '@/generated/prisma';
import { deployPolicy, type DeploymentRequest } from '@/lib/deployment';

const prisma = new PrismaClient();

const policySchema = z.object({
  description: z.string().min(10, 'Please provide a more detailed description.'),
});

export async function generatePolicyAction(_prevState: any, formData: FormData) {
  const validatedFields = policySchema.safeParse({
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateFirewallPolicy({ description: validatedFields.data.description });
    return {
      data: result.policy,
    };
  } catch (e) {
    return {
      error: { _server: ['Failed to generate policy. Please try again.'] },
    };
  }
}

const newPolicySchema = z.object({
    name: z.string().min(1, 'Policy name is required.'),
    source: z.string().min(1, 'Source is required.'),
    destination: z.string().min(1, 'Destination is required.'),
    action: z.enum(['Allow', 'Deny']),
    status: z.enum(['Active', 'Inactive', 'Pending Approval']),
});

export async function createPolicyAction(_prevState: any, formData: FormData) {
    const validatedFields = newPolicySchema.safeParse({
        name: formData.get('name'),
        source: formData.get('source'),
        destination: formData.get('destination'),
        action: formData.get('action'),
        // For now, let's assume a non-admin user is creating policies.
        // In a real app, you'd check the user's role.
        status: 'Pending Approval',
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const policy = await addPolicy(validatedFields.data);
        
        // Create a ticket for the new policy
        const ticketCount = await prisma.changeTicket.count();
        const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;
        
        await prisma.changeTicket.create({
            data: {
                ticketNumber,
                policyId: policy[0].id, // addPolicy returns array of policies
                requestedBy: 'user@company.com', // In real app, get from auth
                title: `Firewall Policy Request: ${validatedFields.data.name}`,
                description: `Request to create firewall policy: ${validatedFields.data.name}\n\nSource: ${validatedFields.data.source}\nDestination: ${validatedFields.data.destination}\nAction: ${validatedFields.data.action}`,
                status: 'PendingApproval',
                priority: 'Medium',
            },
        });
        
        revalidatePath('/policies');
        revalidatePath('/admin/approvals');
        return {
            success: true,
        };
    } catch (e) {
        return {
            errors: { _server: ['Failed to create policy. Please try again.'] },
        };
    }
}

const updatePolicySchema = newPolicySchema.extend({
    id: z.string(),
});

export async function updatePolicyAction(_prevState: any, formData: FormData) {
    const validatedFields = updatePolicySchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        source: formData.get('source'),
        destination: formData.get('destination'),
        action: formData.get('action'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        updatePolicy(validatedFields.data);
        revalidatePath('/policies');
        return {
            success: true,
        };
    } catch (e) {
        return {
            errors: { _server: ['Failed to update policy. Please try again.'] },
        };
    }
}

export async function deletePolicyAction(prevState: any, formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) {
        return { error: 'Policy ID is required.' };
    }

    try {
        // Get policy information
        // Since we're fetching from FortiGate directly, we need to get policy info from there
        // For now, we'll create a ticket with the policy ID and let the approval process handle deletion
        
        // Check if a deletion ticket already exists for this policy
        // Since we're using FortiGate IDs (POL-FG-*), check by title/description
        const existingTicket = await prisma.changeTicket.findFirst({
            where: {
                title: {
                    contains: id,
                },
                status: 'PendingApproval',
                category: 'Policy Deletion',
            },
        });

        if (existingTicket) {
            return { error: 'A deletion ticket already exists for this policy and is pending approval.' };
        }

        // Create a deletion ticket
        const ticketCount = await prisma.changeTicket.count();
        const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;
        
        // Note: policyId is optional in the schema, but we'll use it to track which policy to delete
        // We'll store the policy ID in the description since policyId field might conflict with existing tickets
        const ticket = await prisma.changeTicket.create({
            data: {
                ticketNumber,
                requestedBy: 'user@company.com', // In real app, get from auth
                title: `Delete Firewall Policy: ${id}`,
                description: `Request to delete firewall policy ${id} from FortiGate firewall.\n\nThis will permanently remove the policy from the firewall. Please review and approve this deletion request.`,
                status: 'PendingApproval',
                priority: 'Medium',
                ticketType: 'FirewallPolicy',
                category: 'Policy Deletion',
                keywords: ['delete', 'policy', 'removal'],
                isNetworkRelated: true,
                // Don't set policyId to avoid unique constraint - we'll handle deletion in approval
            },
        });

        // Store the policy ID to delete in a comment or use the description
        // We'll parse it from the ticket when approving
        
        revalidatePath('/policies');
        revalidatePath('/admin/approvals');
        return { 
            success: true,
            message: 'Deletion ticket created. Waiting for admin approval.',
            ticketId: ticket.id,
        };
    } catch (e: any) {
        console.error('Error creating deletion ticket:', e);
        return {
            error: 'Failed to create deletion ticket. Please try again.',
        };
    }
}

const policyDecisionSchema = z.object({
    id: z.string(),
});

export async function approvePolicyAction(prevState: any, formData: FormData) {
    const validatedFields = policyDecisionSchema.safeParse({ id: formData.get('id') });
    if (!validatedFields.success) {
        return { error: 'Invalid Policy ID.' };
    }
    try {
        const policy = updatePolicy({ id: validatedFields.data.id, status: 'Active' });
        revalidatePath('/policies');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to approve policy.' };
    }
}


export async function rejectPolicyAction(prevState: any, formData: FormData) {
    const validatedFields = policyDecisionSchema.safeParse({ id: formData.get('id') });
    if (!validatedFields.success) {
        return { error: 'Invalid Policy ID.' };
    }
    try {
        // Here you might want to delete it or move it to a 'rejected' state.
        // For simplicity, we'll delete it.
        deletePolicy(validatedFields.data.id);
        revalidatePath('/policies');
        return { success: true };
    } catch (e) {
        return { error: 'Failed to reject policy.' };
    }
}


const chatSchema = z.object({
  query: z.string().min(1, 'Message cannot be empty.'),
  userId: z.string().optional(),
  conversationId: z.string().optional(),
  vendor: z.string().optional(),
  targetDevice: z.string().optional(), // Device name instead of just vendor
});

export async function chatAction(_prevState: any, formData: FormData) {
    const targetDevice = formData.get('targetDevice') as string;
    const vendorFromForm = formData.get('vendor') as string;
    
    // If targetDevice is provided, get vendor from device, otherwise use form vendor
    let vendor = vendorFromForm || 'fortigate';
    if (targetDevice) {
      const { PrismaClient } = await import('../generated/prisma');
      const prisma = new PrismaClient();
      const device = await prisma.device.findFirst({
        where: { name: targetDevice },
        select: { vendor: true },
      });
      if (device) {
        vendor = device.vendor || vendor;
      }
    }
    
    const validatedFields = chatSchema.safeParse({
        query: formData.get('query'),
        userId: formData.get('userId') as string || 'user-001',
        conversationId: formData.get('conversationId') as string,
        vendor: vendor,
        targetDevice: targetDevice,
    });

    if (!validatedFields.success) {
        return {
            error: "Message cannot be empty."
        };
    }

    try {
        // Try to use the AI-powered chat agent first
        let result;
        try {
            const { firewallChatAgent } = await import('@/ai/flows/firewall-chat-agent');
            result = await firewallChatAgent({
                query: validatedFields.data.query,
                userId: validatedFields.data.userId || 'user-001',
                conversationId: validatedFields.data.conversationId,
                vendor: validatedFields.data.vendor || 'fortigate',
                targetDevice: validatedFields.data.targetDevice, // Pass device name
                externalSystem: validatedFields.data.externalSystem,
            });
        } catch (aiError) {
            // Fallback to non-AI version if API key is not configured
            console.log('AI API not available, using simple chat agent');
            const { firewallChatAgent } = await import('@/ai/flows/firewall-chat-agent-simple');
            result = await firewallChatAgent({
                query: validatedFields.data.query,
                userId: validatedFields.data.userId || 'user-001',
                conversationId: validatedFields.data.conversationId,
                vendor: validatedFields.data.vendor || 'fortigate',
                targetDevice: validatedFields.data.targetDevice, // Pass device name
                externalSystem: validatedFields.data.externalSystem,
            });
        }
        
        return {
            response: result.response,
            conversationId: result.conversationId,
            ticketCreated: result.ticketCreated || false,
            ticketId: result.ticketId,
            vendor: result.vendor,
            cliConfig: result.cliConfig,
            externalTicketCreated: result.externalTicketCreated || false,
            externalTicketId: result.externalTicketId,
            externalTicketUrl: result.externalTicketUrl,
            duplicateFound: result.duplicateFound || false,
            matchedPolicies: result.matchedPolicies || [],
            missingJustification: result.missingJustification || false,
            parsedRequest: result.parsedRequest,
            ticketType: result.ticketType,
            ticketCategory: result.ticketCategory,
            isITSupport: result.isITSupport || false,
        };
    } catch (e) {
        console.error('Chat action error:', e);
        return {
            error: 'Failed to get response from assistant. Please try again.',
        };
    }
}

const selfHealingSchema = z.object({
    firewallConfiguration: z.string().min(1, 'Firewall configuration cannot be empty.'),
    guardrails: z.string().min(1, 'Guardrails cannot be empty.'),
    autoCorrect: z.boolean(),
});

export async function selfHealingAction(_prevState: any, formData: FormData) {
    const validatedFields = selfHealingSchema.safeParse({
        firewallConfiguration: formData.get('firewallConfiguration'),
        guardrails: formData.get('guardrails'),
        autoCorrect: formData.get('auto-correct') === 'on',
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await selfHealingMisconfigurations(validatedFields.data);
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: { _server: ['Failed to analyze configuration. Please try again.'] },
        };
    }
}

const modelManagementSchema = z.object({
    modelName: z.string().min(1, 'Model name cannot be empty.'),
    retrain: z.boolean(),
    evaluate: z.boolean(),
    version: z.boolean(),
  });
  
  export async function modelManagementAction(_prevState: any, formData: FormData) {
    const validatedFields = modelManagementSchema.safeParse({
      modelName: formData.get('modelName'),
      retrain: formData.get('retrain') === 'on',
      evaluate: formData.get('evaluate') === 'on',
      version: formData.get('version') === 'on',
    });
  
    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
      };
    }
  
    try {
      const result = await manageRetrainEvaluateVersion(validatedFields.data as ManageRetrainEvaluateVersionInput);
      return {
        data: result,
      };
    } catch (e) {
      return {
        error: { _server: ['Failed to run model management task. Please try again.'] },
      };
    }
  }

  const anomalyDetectionSchema = z.object({
    adminActions: z.string().min(1, 'Admin actions log cannot be empty.'),
    accessPatterns: z.string().min(1, 'Access patterns log cannot be empty.'),
  });
  
  export async function anomalyDetectionAction(_prevState: any, formData: FormData) {
    const validatedFields = anomalyDetectionSchema.safeParse({
      adminActions: formData.get('adminActions'),
      accessPatterns: formData.get('accessPatterns'),
    });
  
    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
      };
    }
  
    try {
      const result = await detectAdminAnomalies(validatedFields.data);
      return {
        data: result,
      };
    } catch (e) {
      return {
        error: { _server: ['Failed to detect anomalies. Please try again.'] },
      };
    }
  }

  export async function rollbackSnapshotAction(prevState: any, formData: FormData) {
    const version = formData.get('version') as string;
    if (!version) {
        return { error: 'Snapshot version is required.' };
    }

    try {
        rollbackSnapshot(version);
        revalidatePath('/configuration');
        return { success: true };
    } catch (e) {
        return {
            error: 'Failed to rollback snapshot. Please try again.',
        };
    }
}

const validatePolicySchema = z.object({
    policy: z.string().min(1, 'Policy cannot be empty.'),
});

export async function validatePolicyAction(_prevState: any, formData: FormData) {
    const validatedFields = validatePolicySchema.safeParse({
        policy: formData.get('policy'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await validateFirewallPolicy(validatedFields.data);
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: { _server: ['Failed to validate policy. Please try again.'] },
        };
    }
}

const simulatePolicySchema = z.object({
    policySet: z.string().min(1, 'Policy set cannot be empty.'),
    trafficFlow: z.string().min(1, 'Traffic flow cannot be empty.'),
});

export async function simulatePolicyAction(_prevState: any, formData: FormData) {
    const validatedFields = simulatePolicySchema.safeParse({
        policySet: formData.get('policySet'),
        trafficFlow: formData.get('trafficFlow'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await simulatePolicy(validatedFields.data);
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: { _server: ['Failed to simulate policy. Please try again.'] },
        };
    }
}

const emulateAdversarySchema = z.object({
    policySet: z.string().min(1, 'Policy set cannot be empty.'),
    attackTechniqueId: z.string().min(1, 'MITRE ATT&CK technique ID cannot be empty.'),
});

export async function emulateAdversaryAction(_prevState: any, formData: FormData) {
    const validatedFields = emulateAdversarySchema.safeParse({
        policySet: formData.get('policySet'),
        attackTechniqueId: formData.get('attackTechniqueId'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await emulateAdversary(validatedFields.data);
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: { _server: ['Failed to emulate adversary. Please try again.'] },
        };
    }
}

const createIncidentSchema = z.object({
    eventDescription: z.string().min(1, 'Event description cannot be empty.'),
});

export async function createIncidentAction(_prevState: any, formData: FormData) {
    const validatedFields = createIncidentSchema.safeParse({
        eventDescription: formData.get('eventDescription'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await createIncident(validatedFields.data);
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: { _server: ['Failed to create incident. Please try again.'] },
        };
    }
}

// Ticket Management Actions
export async function approveTicketAction(ticketId: string, comment?: string, targetDevice?: string) {
  const { PrismaClient } = await import('../generated/prisma');
  const prisma = new PrismaClient();

  try {
    const ticket = await prisma.changeTicket.findUnique({
      where: { id: ticketId },
      include: { policy: true },
    });

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    if (ticket.status !== 'PendingApproval') {
      return { success: false, error: 'Ticket is not pending approval' };
    }

    // Check if this is a deletion ticket
    const isDeletionTicket = ticket.category === 'Policy Deletion' || 
                             ticket.title.toLowerCase().includes('delete') ||
                             ticket.description.toLowerCase().includes('delete');

    if (isDeletionTicket) {
      // Extract policy ID from ticket title or description
      // Format: "Delete Firewall Policy: POL-FG-1" or similar
      const policyIdMatch = ticket.title.match(/POL-FG-(\d+)/) || 
                           ticket.description.match(/policy\s+([A-Z0-9-]+)/i);
      
      if (!policyIdMatch) {
        return { success: false, error: 'Could not determine policy ID from deletion ticket' };
      }

      // Fetch policy from FortiGate to get vendorId and targetDevice
      const devices = await prisma.device.findMany({
        where: {
          vendor: 'fortigate',
          status: 'Active',
        },
      });

      let policyFound = false;
      let deleteError: string | null = null;

      for (const device of devices) {
        if (!device.apiKey) continue;

        try {
          const { FortiGateClient, FortiGateDevice } = await import('../lib/fortigate');
          const fortigateDevice: FortiGateDevice = {
            id: device.id,
            name: device.name,
            ip: device.ip,
            apiKey: device.apiKey,
            version: device.version || undefined,
          };

          const client = new FortiGateClient(fortigateDevice);
          const policiesResult = await client.firewall.getPolicies();

          if (policiesResult.success && policiesResult.data) {
            let fortigatePolicies: any[] = [];
            
            if (Array.isArray(policiesResult.data)) {
              fortigatePolicies = policiesResult.data;
            } else if (policiesResult.data.results) {
              if (Array.isArray(policiesResult.data.results)) {
                fortigatePolicies = policiesResult.data.results;
              } else if (typeof policiesResult.data.results === 'object') {
                fortigatePolicies = Object.values(policiesResult.data.results);
              }
            }

            // Find the policy to delete
            const policyToDelete = fortigatePolicies.find((p: any) => 
              `POL-FG-${p.policyid}` === policyIdMatch[0] || 
              p.policyid?.toString() === policyIdMatch[1]
            );

            if (policyToDelete && policyToDelete.policyid) {
              // Delete from FortiGate
              const deleteResult = await client.firewall.deletePolicy(policyToDelete.policyid.toString());

              if (deleteResult.success) {
                policyFound = true;
                console.log(`Successfully deleted policy ${policyToDelete.policyid} from FortiGate device ${device.name}`);
                break;
              } else {
                deleteError = deleteResult.error || 'Failed to delete from FortiGate';
              }
            }
          }
        } catch (error: any) {
          console.error(`Error deleting policy from device ${device.name}:`, error);
          deleteError = error.message;
        }
      }

      if (!policyFound) {
        return { 
          success: false, 
          error: deleteError || 'Policy not found in FortiGate or deletion failed' 
        };
      }

      // Update ticket status
      await prisma.changeTicket.update({
        where: { id: ticketId },
        data: {
          status: 'Deployed', // Use Deployed status to indicate deletion completed
          approvedAt: new Date(),
          deployedAt: new Date(),
        },
      });

      // Add approval comment if provided
      if (comment) {
        await prisma.ticketComment.create({
          data: {
            ticketId: ticketId,
            author: 'admin@company.com',
            content: comment,
          },
        });
      }

      revalidatePath('/admin/approvals');
      revalidatePath('/policies');
      
      return { success: true, message: 'Policy deleted successfully from FortiGate' };
    }

    // Original deployment logic for non-deletion tickets
    // Update ticket status
    await prisma.changeTicket.update({
      where: { id: ticketId },
      data: {
        status: 'Approved',
        approvedAt: new Date(),
      },
    });

    // Add approval comment if provided
    if (comment) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticketId,
          author: 'admin@company.com', // Default admin user
          content: comment,
        },
      });
    }

    // If ticket has a policy, deploy it directly to the firewall
    if (ticket.policy) {
      try {
        const { deployPolicy } = await import('@/lib/deployment');
        
        // Determine target device - use provided targetDevice, policy's targetDevice, or get first active device
        let deploymentDevice = targetDevice || ticket.policy.targetDevice;
        
        // If no device specified, try to get the first active FortiGate device
        if (!deploymentDevice) {
          const firstDevice = await prisma.device.findFirst({
            where: {
              vendor: ticket.policy.vendor || 'fortigate',
              status: 'Active',
            },
            orderBy: {
              updatedAt: 'desc',
            },
          });
          
          if (firstDevice) {
            deploymentDevice = firstDevice.name;
            console.log(`No target device specified, using first active device: ${deploymentDevice}`);
          } else {
            throw new Error('No active FortiGate devices found. Please configure a device in Settings or select a device when approving.');
          }
        }
        
        // Verify the device exists and is active
        const device = await prisma.device.findFirst({
          where: { 
            name: deploymentDevice,
            vendor: ticket.policy.vendor || 'fortigate',
            status: 'Active' 
          },
        });
        
        if (!device) {
          throw new Error(`Device "${deploymentDevice}" not found or is not active. Please select a valid device.`);
        }
        
        if (!device.apiKey) {
          throw new Error(`Device "${deploymentDevice}" does not have an API key configured. Please configure the API key in Settings.`);
        }
        
        // Verify policy exists before deploying
        const policyToDeploy = await prisma.policy.findUnique({
          where: { id: ticket.policyId! },
        });
        
        if (!policyToDeploy) {
          throw new Error(`Policy ${ticket.policyId} not found in database. Cannot deploy.`);
        }
        
        console.log(`Deploying policy ${ticket.policyId} to ${deploymentDevice}:`, {
          action: policyToDeploy.action,
          source: policyToDeploy.source,
          destination: policyToDeploy.destination,
          port: policyToDeploy.destPort,
        });
        
        // Deploy the policy directly
        const deploymentId = await deployPolicy({
          policyId: ticket.policyId!,
          ticketId: ticketId,
          deployedBy: 'admin@company.com',
          targetDevice: deploymentDevice,
        });
        
        console.log(`Policy ${ticket.policyId} deployed successfully to ${deploymentDevice} (deployment ID: ${deploymentId})`);
      } catch (deployError: any) {
        // Log the full error for debugging
        console.error('Failed to deploy policy:', {
          error: deployError.message,
          stack: deployError.stack,
          policyId: ticket.policyId,
          targetDevice: targetDevice || ticket.policy.targetDevice,
        });
        
        // Return error instead of just warning - deployment failure should be visible
        return { 
          success: false, 
          error: `Policy deployment failed: ${deployError.message}. Please check the device configuration and try again.`
        };
      }
    } else {
      // Ticket doesn't have a policy linked - this shouldn't happen for policy creation tickets
      console.warn(`Ticket ${ticketId} does not have a linked policy. Cannot deploy.`);
      return {
        success: false,
        error: 'Ticket does not have a linked policy. Cannot deploy to firewall.',
      };
    }

    // Revalidate the approvals page to show updated ticket status
    revalidatePath('/admin/approvals');
    revalidatePath('/policies'); // Also revalidate policies page in case policy status changed
    
    return { success: true };
  } catch (e) {
    console.error('Failed to approve ticket:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function rejectTicketAction(ticketId: string, reason: string) {
  const { PrismaClient } = await import('../generated/prisma');
  const prisma = new PrismaClient();

  try {
    await prisma.changeTicket.update({
      where: { id: ticketId },
      data: {
        status: 'Rejected',
        updatedAt: new Date(),
      },
    });

    // Add rejection comment
    await prisma.ticketComment.create({
      data: {
        ticketId: ticketId,
        author: 'admin@company.com', // Default admin user
        content: `Rejected: ${reason}`,
      },
    });

    // If there's a policy, mark it as inactive
    const ticket = await prisma.changeTicket.findUnique({
      where: { id: ticketId },
      include: { policy: true },
    });

    if (ticket?.policyId) {
      await prisma.policy.update({
        where: { id: ticket.policyId },
        data: { status: 'Inactive' },
      });
    }

    return { success: true };
  } catch (e) {
    console.error('Failed to reject ticket:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Test FortiGate connection
 */
const fortigateConnectionSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required'),
  apiUsername: z.string().min(1, 'API username is required'),
  apiKey: z.string().min(1, 'API key is required'),
  deviceName: z.string().optional(), // Optional device name for auto-save
});

export async function testFortiGateConnection(input: z.infer<typeof fortigateConnectionSchema>) {
  try {
    const validated = fortigateConnectionSchema.parse(input);

    const device: FortiGateDevice = {
      name: validated.hostname,
      ip: validated.hostname,
      apiKey: validated.apiKey,
    };

    const client = new FortiGateClient(device);
    const result = await client.testConnection();

    if (result.success) {
      // Auto-save credentials if deviceName is provided
      if (validated.deviceName) {
        try {
          // Check if device with same name or IP already exists
          const existingDevice = await prisma.device.findFirst({
            where: {
              OR: [
                { name: validated.deviceName },
                { ip: validated.hostname },
              ],
            },
          });

          const deviceData = {
            name: validated.deviceName,
            ip: validated.hostname,
            vendor: 'fortigate',
            apiUsername: validated.apiUsername,
            apiKey: validated.apiKey,
            version: result.version,
            status: 'Active' as const,
            lastSync: new Date(),
          };

          if (existingDevice) {
            // Update existing device
            await prisma.device.update({
              where: { id: existingDevice.id },
              data: deviceData,
            });
          } else {
            // Create new device
            await prisma.device.create({
              data: deviceData,
            });
          }
        } catch (saveError) {
          // Log save error but don't fail the connection test
          console.error('Error auto-saving device credentials:', saveError);
        }
      }

      return {
        success: true,
        data: result.data,
        serial: result.serial,
        version: result.version,
        build: result.build,
        saved: validated.deviceName ? true : false,
      };
    } else {
      // Log detailed error for debugging
      console.error('FortiGate connection failed:', {
        error: result.error,
        status: result.status,
        httpStatus: result.httpStatus,
        url: `https://${validated.hostname}/api/v2/monitor/system/status`,
      });
      
      // Update device status to Inactive if device exists
      let deviceUpdated = false;
      if (validated.deviceName) {
        try {
          console.log('[Connection Test] Attempting to update device status for:', {
            deviceName: validated.deviceName,
            hostname: validated.hostname,
          });
          
          const existingDevice = await prisma.device.findFirst({
            where: {
              vendor: 'fortigate',
              OR: [
                { name: validated.deviceName },
                { ip: validated.hostname },
              ],
            },
          });

          if (existingDevice) {
            console.log('[Connection Test] Found existing device:', {
              id: existingDevice.id,
              name: existingDevice.name,
              ip: existingDevice.ip,
              currentStatus: existingDevice.status,
            });
            
            const updatedDevice = await prisma.device.update({
              where: { id: existingDevice.id },
              data: {
                status: 'Inactive',
                updatedAt: new Date(),
              },
            });
            
            console.log('[Connection Test] Device status updated to Inactive:', {
              id: updatedDevice.id,
              name: updatedDevice.name,
              newStatus: updatedDevice.status,
            });
            
            deviceUpdated = true;
            revalidatePath('/settings');
          } else {
            console.log('[Connection Test] No existing device found to update:', {
              searchedName: validated.deviceName,
              searchedIP: validated.hostname,
            });
          }
        } catch (updateError) {
          // Log update error but don't fail the connection test response
          console.error('[Connection Test] Error updating device status on connection failure:', updateError);
        }
      } else {
        console.log('[Connection Test] No deviceName provided, skipping status update');
      }
      
      return {
        success: false,
        error: result.error || `Connection failed (HTTP ${result.httpStatus || result.status || 'unknown'})`,
        deviceUpdated, // Indicate if device status was updated
      };
    }
  } catch (e) {
    // Log full error details
    console.error('FortiGate connection error:', e);
    
    if (e instanceof z.ZodError) {
      return {
        success: false,
        error: e.errors.map((err) => err.message).join(', '),
      };
    }
    
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : undefined;
    
    console.error('Full error details:', { errorMessage, errorStack });
    
    // Update device status to Inactive if device exists and connection failed
    // Only update if it's not a validation error (validation errors happen before connection attempt)
    let deviceUpdated = false;
    if (!(e instanceof z.ZodError)) {
      try {
        const validated = fortigateConnectionSchema.safeParse(input);
        
        if (validated.success && validated.data.deviceName) {
          console.log('[Connection Error] Attempting to update device status for:', {
            deviceName: validated.data.deviceName,
            hostname: validated.data.hostname,
          });
          
          const existingDevice = await prisma.device.findFirst({
            where: {
              vendor: 'fortigate',
              OR: [
                { name: validated.data.deviceName },
                { ip: validated.data.hostname },
              ],
            },
          });

          if (existingDevice) {
            console.log('[Connection Error] Found existing device:', {
              id: existingDevice.id,
              name: existingDevice.name,
              ip: existingDevice.ip,
              currentStatus: existingDevice.status,
            });
            
            const updatedDevice = await prisma.device.update({
              where: { id: existingDevice.id },
              data: {
                status: 'Inactive',
                updatedAt: new Date(),
              },
            });
            
            console.log('[Connection Error] Device status updated to Inactive:', {
              id: updatedDevice.id,
              name: updatedDevice.name,
              newStatus: updatedDevice.status,
            });
            
            deviceUpdated = true;
            revalidatePath('/settings');
          } else {
            console.log('[Connection Error] No existing device found to update:', {
              searchedName: validated.data.deviceName,
              searchedIP: validated.data.hostname,
            });
          }
        }
      } catch (updateError) {
        // Log update error but don't fail the error response
        console.error('[Connection Error] Error updating device status on connection error:', updateError);
      }
    }
    
    return {
      success: false,
      error: errorMessage || 'Unknown error occurred. Check server logs for details.',
      deviceUpdated, // Indicate if device status was updated
    };
  }
}

/**
 * Get saved FortiGate device configuration
 */
export async function getFortiGateDevice(deviceName?: string) {
  try {
    let device;
    
    if (deviceName) {
      // Get specific device by name (regardless of status)
      device = await prisma.device.findFirst({
        where: {
          name: deviceName,
          vendor: 'fortigate',
        },
      });
    } else {
      // First try to get the most recently updated active device
      device = await prisma.device.findFirst({
        where: {
          vendor: 'fortigate',
          status: 'Active',
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
      
      // If no active device found, get the most recently updated device regardless of status
      if (!device) {
        device = await prisma.device.findFirst({
          where: {
            vendor: 'fortigate',
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });
      }
    }

    if (!device) {
      return {
        success: false,
        error: 'No FortiGate device found',
      };
    }

    return {
      success: true,
      device: {
        name: device.name,
        hostname: device.ip,
        apiUsername: device.apiUsername || '',
        apiKey: device.apiKey || '',
        version: device.version,
        status: device.status,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to get device configuration',
    };
  }
}

/**
 * Save FortiGate device configuration
 */
const saveDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  apiUsername: z.string().min(1, 'API username is required'),
  apiKey: z.string().min(1, 'API key is required'),
  serial: z.string().optional(),
  version: z.string().optional(),
  build: z.number().optional(),
});

export async function saveFortiGateDevice(input: z.infer<typeof saveDeviceSchema>) {
  try {
    const validated = saveDeviceSchema.parse(input);

    // Check if device with same name or IP already exists
    const existingDevice = await prisma.device.findFirst({
      where: {
        OR: [
          { name: validated.name },
          { ip: validated.hostname },
        ],
      },
    });

    if (existingDevice) {
      // Update existing device
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          name: validated.name,
          ip: validated.hostname,
          vendor: 'fortigate',
          apiUsername: validated.apiUsername,
          apiKey: validated.apiKey,
          version: validated.version,
          status: 'Active',
          lastSync: new Date(),
        },
      });

      revalidatePath('/settings');
      return {
        success: true,
        message: 'Device updated successfully',
      };
    } else {
      // Create new device
      await prisma.device.create({
        data: {
          name: validated.name,
          ip: validated.hostname,
          vendor: 'fortigate',
          apiUsername: validated.apiUsername,
          apiKey: validated.apiKey,
          version: validated.version,
          status: 'Active',
          lastSync: new Date(),
        },
      });

      revalidatePath('/settings');
      return {
        success: true,
        message: 'Device saved successfully',
      };
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        success: false,
        error: e.errors.map((err) => err.message).join(', '),
      };
    }
    console.error('Failed to save device:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error occurred',
    };
  }
}

/**
 * Deploy policy to firewall device
 */
export async function deployPolicyAction(request: DeploymentRequest) {
  try {
    const deploymentId = await deployPolicy(request);
    return {
      success: true,
      deploymentId,
    };
  } catch (e) {
    console.error('Failed to deploy policy:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get all FortiGate devices
 */
export async function getAllFortiGateDevices() {
  try {
    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      success: true,
      devices: devices.map(device => ({
        id: device.id,
        name: device.name,
        ip: device.ip,
        status: device.status,
        version: device.version,
        updatedAt: device.updatedAt,
        hasApiKey: !!device.apiKey,
      })),
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to get devices',
      devices: [],
    };
  }
}

/**
 * Get active devices for a specific vendor
 */
export async function getActiveDevicesForVendor(vendor: string = 'fortigate') {
  try {
    const devices = await prisma.device.findMany({
      where: {
        vendor: vendor,
        status: 'Active',
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        ip: true,
        vendor: true,
        status: true,
        version: true,
      },
    });

    return {
      success: true,
      devices: devices,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to get devices',
      devices: [],
    };
  }
}

/**
 * Update device status (activate/deactivate)
 */
export async function updateDeviceStatus(deviceId: string, status: 'Active' | 'Inactive') {
  try {
    await prisma.device.update({
      where: { id: deviceId },
      data: { status },
    });

    revalidatePath('/settings');
    return {
      success: true,
      message: `Device ${status === 'Active' ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update device status',
    };
  }
}

/**
 * Delete a device
 */
export async function deleteDevice(deviceId: string) {
  try {
    await prisma.device.delete({
      where: { id: deviceId },
    });

    revalidatePath('/settings');
    return {
      success: true,
      message: 'Device deleted successfully',
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete device',
    };
  }
}

/**
 * Create a ticket for an existing policy
 */
export async function createTicketForPolicyAction(prevState: any, formData: FormData) {
  const policyId = formData.get('policyId') as string;
  if (!policyId) {
    return { error: 'Policy ID is required.' };
  }

  try {
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return { error: 'Policy not found.' };
    }

    // Check if ticket already exists for this policy
    const existingTicket = await prisma.changeTicket.findUnique({
      where: { policyId },
    });

    if (existingTicket) {
      return { error: 'A ticket already exists for this policy.' };
    }

    const ticketCount = await prisma.changeTicket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;
    
    const ticket = await prisma.changeTicket.create({
      data: {
        ticketNumber,
        policyId: policy.id,
        requestedBy: 'user@company.com', // In real app, get from auth
        title: `Firewall Policy Request: ${policy.name}`,
        description: `Request to create firewall policy: ${policy.name}\n\nSource: ${policy.source}\nDestination: ${policy.destination}${policy.destPort ? `:${policy.destPort}` : ''}\nAction: ${policy.action}\nBusiness Justification: ${policy.businessJustification || 'Not provided'}`,
        status: 'PendingApproval',
        priority: 'Medium',
      },
    });

    revalidatePath('/policies');
    revalidatePath('/admin/approvals');
    return { success: true, ticketId: ticket.id };
  } catch (e) {
    return {
      error: 'Failed to create ticket. Please try again.',
    };
  }
}

/**
 * Deactivate all mock/test devices (keep only real devices active)
 */
export async function deactivateMockDevices() {
  try {
    // Deactivate all devices except apiprod-01
    const result = await prisma.device.updateMany({
      where: {
        vendor: 'fortigate',
        name: {
          not: 'apiprod-01',
        },
      },
      data: {
        status: 'Inactive',
      },
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Deactivated ${result.count} mock device(s)`,
      count: result.count,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to deactivate mock devices',
    };
  }
}

/**
 * Get device health status for all connected FortiGate devices
 */
export async function getDeviceHealthAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    // Get ALL FortiGate devices (both Active and Inactive) to show their status
    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const healthData = await Promise.allSettled(
      devices.map(async (device) => {
        // If device is Inactive in database, mark as Offline without checking connection
        if (device.status === 'Inactive') {
          return {
            name: device.name,
            ip: device.ip,
            status: 'Offline' as const,
            dbStatus: 'Inactive' as const,
            error: 'Device is inactive',
            version: device.version || 'Unknown',
          };
        }

        if (!device.apiKey) {
          return {
            name: device.name,
            ip: device.ip,
            status: 'Offline' as const,
            dbStatus: device.status as 'Active' | 'Inactive',
            error: 'API key not configured',
            version: device.version || 'Unknown',
          };
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
          
          // Test connection with timeout handling
          // Use Promise.race to add an overall timeout for the entire health check
          const healthCheckPromise = (async () => {
            const statusResult = await client.testConnection();
            
            if (statusResult.success) {
              // Get resource usage to determine health (with shorter timeout)
              try {
                const resourceResult = await client.monitor.getResourceUsage();
                
                let healthStatus: 'Online' | 'Warning' | 'Offline' = 'Online';
                
                if (resourceResult.success && resourceResult.data) {
                  // Handle different FortiGate resource usage response formats
                  const data = resourceResult.data;
                  let cpu = 0;
                  let memory = 0;
                  
                  // Try different possible structures
                  if (data.cpu?.usage !== undefined) {
                    cpu = data.cpu.usage;
                  } else if (data.cpu_usage !== undefined) {
                    cpu = data.cpu_usage;
                  } else if (typeof data.cpu === 'number') {
                    cpu = data.cpu;
                  }
                  
                  if (data.memory?.usage !== undefined) {
                    memory = data.memory.usage;
                  } else if (data.mem_usage !== undefined) {
                    memory = data.mem_usage;
                  } else if (typeof data.memory === 'number') {
                    memory = data.memory;
                  }
                  
                  // Determine status based on resource usage
                  // CPU or memory > 90% = Warning
                  if (cpu > 90 || memory > 90) {
                    healthStatus = 'Warning';
                  }
                }
                
                return {
                  name: device.name,
                  ip: device.ip,
                  status: healthStatus,
                  dbStatus: device.status as 'Active' | 'Inactive',
                  version: statusResult.version || device.version || 'Unknown',
                  serial: statusResult.serial,
                  build: statusResult.build,
                };
              } catch (resourceError: any) {
                // If resource check fails, still mark as online if connection test passed
                return {
                  name: device.name,
                  ip: device.ip,
                  status: 'Online' as const,
                  dbStatus: device.status as 'Active' | 'Inactive',
                  version: statusResult.version || device.version || 'Unknown',
                  serial: statusResult.serial,
                  build: statusResult.build,
                };
              }
            } else {
              return {
                name: device.name,
                ip: device.ip,
                status: 'Offline' as const,
                dbStatus: device.status as 'Active' | 'Inactive',
                error: statusResult.error || 'Connection failed',
                version: device.version || 'Unknown',
              };
            }
          })();

          // Add overall timeout of 25 seconds for the entire health check
          const timeoutPromise = new Promise<{
            name: string;
            ip: string;
            status: 'Offline';
            error: string;
            version: string;
          }>((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), 25000);
          });

          return await Promise.race([healthCheckPromise, timeoutPromise]);
        } catch (error: any) {
          // Handle timeout and other errors
          const errorMessage = error.message || 'Unknown error';
          const isTimeout = errorMessage.includes('timeout') || 
                           errorMessage.includes('Timeout') ||
                           error.code === 'UND_ERR_CONNECT_TIMEOUT';
          
          return {
            name: device.name,
            ip: device.ip,
            status: 'Offline' as const,
            dbStatus: device.status as 'Active' | 'Inactive',
            error: isTimeout ? 'Connection timeout - device may be unreachable' : errorMessage,
            version: device.version || 'Unknown',
          };
        }
      })
    );

    // Extract successful results and handle failures
    const results = healthData.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // This shouldn't happen with Promise.allSettled, but handle it anyway
        return {
          name: 'Unknown',
          ip: 'Unknown',
          status: 'Offline' as const,
          error: result.reason?.message || 'Unknown error',
          version: 'Unknown',
        };
      }
    });

    return {
      success: true,
      devices: results,
    };
  } catch (e) {
    console.error('Failed to get device health:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error occurred',
      devices: [],
    };
  }
}

/**
 * Get system status for all FortiGate devices
 */
export async function getSystemStatusAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const statusData = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.apiKey) {
          return {
            deviceName: device.name,
            success: false,
            error: 'API key not configured',
          };
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
          const result = await client.monitor.getSystemStatus();

          if (result.success && result.data) {
            return {
              deviceName: device.name,
              success: true,
              data: {
                hostname: result.data.hostname || device.name,
                version: result.data.version || device.version || 'Unknown',
                serial: result.data.serial || result.serial,
                uptime: result.data.uptime || 0,
                model: result.data.model || 'Unknown',
              },
            };
          }

          return {
            deviceName: device.name,
            success: false,
            error: result.error || 'Failed to fetch system status',
          };
        } catch (error: any) {
          return {
            deviceName: device.name,
            success: false,
            error: error.message || 'Unknown error',
          };
        }
      })
    );

    const results = statusData.map((result) =>
      result.status === 'fulfilled' ? result.value : {
        deviceName: 'Unknown',
        success: false,
        error: 'Promise rejected',
      }
    );

    return {
      success: true,
      devices: results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch system status',
      devices: [],
    };
  }
}

/**
 * Get resource usage for all FortiGate devices
 */
export async function getResourceUsageAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const resourceData = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.apiKey) {
          return {
            deviceName: device.name,
            success: false,
            error: 'API key not configured',
          };
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
          const result = await client.monitor.getResourceUsage();

          if (result.success && result.data) {
            const data = result.data;
            
            // Helper function to extract current value from metric array
            const getCurrentValue = (metricArray: any[] | undefined): number => {
              if (Array.isArray(metricArray) && metricArray.length > 0) {
                return typeof metricArray[0]?.current === 'number' ? metricArray[0].current : 0;
              }
              return 0;
            };

            return {
              deviceName: device.name,
              success: true,
              data: {
                cpu: getCurrentValue(data.cpu),
                memory: getCurrentValue(data.mem),
                disk: getCurrentValue(data.disk),
                session: getCurrentValue(data.session),
                session6: getCurrentValue(data.session6),
                setuprate: getCurrentValue(data.setuprate),
                setuprate6: getCurrentValue(data.setuprate6),
                npu_session: getCurrentValue(data.npu_session),
                npu_session6: getCurrentValue(data.npu_session6),
                nturbo_session: getCurrentValue(data.nturbo_session),
                nturbo_session6: getCurrentValue(data.nturbo_session6),
                disk_lograte: getCurrentValue(data.disk_lograte),
                faz_lograte: getCurrentValue(data.faz_lograte),
                forticloud_lograte: getCurrentValue(data.forticloud_lograte),
                faz_cloud_lograte: getCurrentValue(data.faz_cloud_lograte),
              },
            };
          }

          return {
            deviceName: device.name,
            success: false,
            error: result.error || 'Failed to fetch resource usage',
          };
        } catch (error: any) {
          return {
            deviceName: device.name,
            success: false,
            error: error.message || 'Unknown error',
          };
        }
      })
    );

    const results = resourceData.map((result) =>
      result.status === 'fulfilled' ? result.value : {
        deviceName: 'Unknown',
        success: false,
        error: 'Promise rejected',
      }
    );

    return {
      success: true,
      devices: results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch resource usage',
      devices: [],
    };
  }
}

/**
 * Get active firewall sessions for all FortiGate devices
 */
export async function getActiveSessionsAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const sessionData = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.apiKey) {
          return {
            deviceName: device.name,
            success: false,
            error: 'API key not configured',
          };
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
          const result = await client.monitor.getFirewallSessions();

          if (result.success && result.data) {
            const data = result.data;
            // Handle different response formats
            const total = data.total ?? data.session_count ?? data.count ?? 0;
            const tcp = data.tcp ?? data.tcp_count ?? 0;
            const udp = data.udp ?? data.udp_count ?? 0;

            return {
              deviceName: device.name,
              success: true,
              data: {
                total: typeof total === 'number' ? total : 0,
                tcp: typeof tcp === 'number' ? tcp : 0,
                udp: typeof udp === 'number' ? udp : 0,
              },
            };
          }

          // Handle 424 error gracefully - this endpoint may not be available on all FortiGate devices
          const isUnsupportedEndpoint = result.httpStatus === 424 || 
                                       (result.error && result.error.includes('424'));
          
          return {
            deviceName: device.name,
            success: false,
            error: isUnsupportedEndpoint 
              ? 'Session endpoint not available on this device'
              : result.error || 'Failed to fetch sessions',
          };
        } catch (error: any) {
          // Suppress logging for 424 errors as they're expected on some devices
          const isUnsupportedEndpoint = error.message?.includes('424') || 
                                       error.code === 424;
          
          if (!isUnsupportedEndpoint) {
            console.error(`Error fetching sessions for ${device.name}:`, error);
          }
          
          return {
            deviceName: device.name,
            success: false,
            error: isUnsupportedEndpoint
              ? 'Session endpoint not available on this device'
              : error.message || 'Unknown error',
          };
        }
      })
    );

    const results = sessionData.map((result) =>
      result.status === 'fulfilled' ? result.value : {
        deviceName: 'Unknown',
        success: false,
        error: 'Promise rejected',
      }
    );

    return {
      success: true,
      devices: results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch active sessions',
      devices: [],
    };
  }
}

/**
 * Get interface statistics for all FortiGate devices
 */
export async function getInterfaceStatsAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const interfaceData = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.apiKey) {
          return {
            deviceName: device.name,
            success: false,
            error: 'API key not configured',
          };
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
          const result = await client.monitor.getInterfaceStats();

          if (result.success && result.data) {
            const interfaces = Array.isArray(result.data) 
              ? result.data 
              : (result.data.results || result.data.interfaces || []);

            return {
              deviceName: device.name,
              success: true,
              data: {
                interfaces: interfaces.map((iface: any) => ({
                  name: iface.name || iface.interface || 'Unknown',
                  status: iface.status || iface.link || 'down',
                  rxBytes: iface.rx_bytes ?? iface.rxBytes ?? 0,
                  txBytes: iface.tx_bytes ?? iface.txBytes ?? 0,
                  rxPackets: iface.rx_packets ?? iface.rxPackets ?? 0,
                  txPackets: iface.tx_packets ?? iface.txPackets ?? 0,
                  speed: iface.speed || 0,
                })),
              },
            };
          }

          return {
            deviceName: device.name,
            success: false,
            error: result.error || 'Failed to fetch interface stats',
          };
        } catch (error: any) {
          return {
            deviceName: device.name,
            success: false,
            error: error.message || 'Unknown error',
          };
        }
      })
    );

    const results = interfaceData.map((result) =>
      result.status === 'fulfilled' ? result.value : {
        deviceName: 'Unknown',
        success: false,
        error: 'Promise rejected',
      }
    );

    return {
      success: true,
      devices: results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch interface stats',
      devices: [],
    };
  }
}

/**
 * Get license status for all FortiGate devices
 */
export async function getLicenseStatusAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const licenseData = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.apiKey) {
          return {
            deviceName: device.name,
            success: false,
            error: 'API key not configured',
          };
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
          const result = await client.monitor.getLicenseStatus();

          if (result.success && result.data) {
            const data = result.data;
            const status = data.status || data.license_status || 'Unknown';
            const expiry = data.expiry || data.expiry_date || null;
            const contract = data.contract || data.contract_number || null;

            return {
              deviceName: device.name,
              success: true,
              data: {
                status,
                expiry,
                contract,
                vmQuota: data.vm_quota ?? data.vmQuota ?? null,
                vmUsed: data.vm_used ?? data.vmUsed ?? null,
              },
            };
          }

          return {
            deviceName: device.name,
            success: false,
            error: result.error || 'Failed to fetch license status',
          };
        } catch (error: any) {
          return {
            deviceName: device.name,
            success: false,
            error: error.message || 'Unknown error',
          };
        }
      })
    );

    const results = licenseData.map((result) =>
      result.status === 'fulfilled' ? result.value : {
        deviceName: 'Unknown',
        success: false,
        error: 'Promise rejected',
      }
    );

    return {
      success: true,
      devices: results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch license status',
      devices: [],
    };
  }
}

      