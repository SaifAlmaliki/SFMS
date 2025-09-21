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
});

export async function chatAction(_prevState: any, formData: FormData) {
    const validatedFields = chatSchema.safeParse({
        query: formData.get('query'),
    });

    if (!validatedFields.success) {
        return {
            error: "Message cannot be empty."
        };
    }

    try {
        const result = await nlpChatbotAssistance({ query: validatedFields.data.query });
        return {
            response: result.response,
        };
    } catch (e) {
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

    