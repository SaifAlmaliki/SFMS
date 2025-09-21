'use server';

import { generateFirewallPolicy } from '@/ai/flows/generate-firewall-policy';
import { nlpChatbotAssistance } from '@/ai/flows/nlp-chatbot-assistance';
import { selfHealingMisconfigurations } from '@/ai/flows/self-healing-misconfigurations';
import { detectAdminAnomalies } from '@/ai/flows/detect-admin-anomalies';
import { manageRetrainEvaluateVersion } from '@/ai/flows/ai-manage-retrain-evaluate-version';
import { z } from 'zod';

const policySchema = z.object({
  description: z.string().min(10, 'Please provide a more detailed description.'),
});

export async function generatePolicyAction(prevState: any, formData: FormData) {
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


const chatSchema = z.object({
  query: z.string().min(1, 'Message cannot be empty.'),
});

export async function chatAction(prevState: any, formData: FormData) {
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

export async function selfHealingAction(prevState: any, formData: FormData) {
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

const anomalyDetectionSchema = z.object({
    adminActions: z.string().min(1, 'Admin actions log cannot be empty.'),
    accessPatterns: z.string().min(1, 'Access patterns log cannot be empty.'),
});

export async function anomalyDetectionAction(prevState: any, formData: FormData) {
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

const modelManagementSchema = z.object({
    modelName: z.string().min(1, 'Model name cannot be empty.'),
    retrain: z.boolean(),
    evaluate: z.boolean(),
    version: z.boolean(),
});

export async function modelManagementAction(prevState: any, formData: FormData) {
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
        const result = await manageRetrainEvaluateVersion(validatedFields.data);
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: { _server: ['Failed to run model management task. Please try again.'] },
        };
    }
}
