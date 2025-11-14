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
        addPolicy(validatedFields.data);
        revalidatePath('/policies');
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
        deletePolicy(id);
        revalidatePath('/policies');
        return { success: true };
    } catch (e) {
        return {
            error: 'Failed to delete policy. Please try again.',
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
});

export async function chatAction(_prevState: any, formData: FormData) {
    const validatedFields = chatSchema.safeParse({
        query: formData.get('query'),
        userId: formData.get('userId') as string || 'user-001',
        conversationId: formData.get('conversationId') as string,
        vendor: formData.get('vendor') as string || 'fortigate',
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
export async function approveTicketAction(ticketId: string, comment?: string) {
  const { inngest } = await import('@/inngest/client');
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

    // If ticket has a policy, trigger deployment
    if (ticket.policy) {
      // Check if Inngest is configured
      if (!process.env.INNGEST_EVENT_KEY) {
        console.warn('INNGEST_EVENT_KEY not configured. Skipping policy deployment via Inngest.');
        console.warn('Please set INNGEST_EVENT_KEY in your .env file. See docs/INNGEST_SETUP.md for instructions.');
        // Ticket is still approved, but deployment won't be triggered
        return { 
          success: true, 
          warning: 'Ticket approved, but policy deployment skipped due to missing Inngest configuration. See docs/INNGEST_SETUP.md for setup instructions.' 
        };
      }

      try {
        await inngest.send({
          name: 'firewall/policy.deploy',
          data: {
            policyId: ticket.policyId!,
            ticketId: ticketId,
            deployedBy: 'admin@company.com',
            targetDevice: ticket.policy.targetDevice || 'FW-Primary-DC1',
          },
        });
      } catch (inngestError) {
        // Log the error but don't fail the approval
        console.error('Failed to send deployment event to Inngest:', inngestError);
        if (inngestError instanceof Error && inngestError.message.includes('Event key not found')) {
          return { 
            success: true, 
            warning: 'Ticket approved, but Inngest event key is invalid. Please check your INNGEST_EVENT_KEY in .env file. See docs/INNGEST_SETUP.md for setup instructions.' 
          };
        }
        throw inngestError; // Re-throw if it's a different error
      }
    }

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
      
      return {
        success: false,
        error: result.error || `Connection failed (HTTP ${result.httpStatus || result.status || 'unknown'})`,
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
    
    return {
      success: false,
      error: errorMessage || 'Unknown error occurred. Check server logs for details.',
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
      // Get specific device by name
      device = await prisma.device.findFirst({
        where: {
          name: deviceName,
          vendor: 'fortigate',
        },
      });
    } else {
      // Get first active FortiGate device
      device = await prisma.device.findFirst({
        where: {
          vendor: 'fortigate',
          status: 'Active',
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
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
 * Get device health status for all connected FortiGate devices
 */
export async function getDeviceHealthAction() {
  try {
    const { PrismaClient } = await import('../generated/prisma');
    const prisma = new PrismaClient();

    // Get all active FortiGate devices
    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const healthData = await Promise.allSettled(
      devices.map(async (device) => {
        if (!device.apiKey) {
          return {
            name: device.name,
            ip: device.ip,
            status: 'Offline' as const,
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
            // Handle different response formats
            const cpu = data.cpu?.usage ?? data.cpu_usage ?? data.cpu ?? 0;
            const memory = data.memory?.usage ?? data.mem_usage ?? data.memory ?? 0;
            const disk = data.disk?.usage ?? data.disk_usage ?? data.disk ?? 0;

            return {
              deviceName: device.name,
              success: true,
              data: {
                cpu: typeof cpu === 'number' ? cpu : 0,
                memory: typeof memory === 'number' ? memory : 0,
                disk: typeof disk === 'number' ? disk : 0,
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

          return {
            deviceName: device.name,
            success: false,
            error: result.error || 'Failed to fetch sessions',
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

      