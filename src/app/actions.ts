'use server';

import { generateFirewallPolicy } from '@/ai/flows/generate-firewall-policy';
import { nlpChatbotAssistance } from '@/ai/flows/nlp-chatbot-assistance';
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
