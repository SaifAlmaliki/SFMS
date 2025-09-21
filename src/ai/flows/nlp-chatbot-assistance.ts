'use server';

/**
 * @fileOverview Provides an NLP chatbot interface for firewall configuration queries and guided assistance.
 *
 * - nlpChatbotAssistance - A function that processes natural language queries related to firewall configurations.
 * - NlpChatbotAssistanceInput - The input type for the nlpChatbotAssistance function.
 * - NlpChatbotAssistanceOutput - The return type for the nlpChatbotAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NlpChatbotAssistanceInputSchema = z.object({
  query: z.string().describe('The natural language query about the firewall configuration or operational tasks.'),
});
export type NlpChatbotAssistanceInput = z.infer<typeof NlpChatbotAssistanceInputSchema>;

const NlpChatbotAssistanceOutputSchema = z.object({
  response: z.string().describe('The response from the chatbot, providing information, summaries, or guided assistance.'),
});
export type NlpChatbotAssistanceOutput = z.infer<typeof NlpChatbotAssistanceOutputSchema>;

export async function nlpChatbotAssistance(input: NlpChatbotAssistanceInput): Promise<NlpChatbotAssistanceOutput> {
  return nlpChatbotAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nlpChatbotAssistancePrompt',
  input: {schema: NlpChatbotAssistanceInputSchema},
  output: {schema: NlpChatbotAssistanceOutputSchema},
  prompt: `You are a helpful NLP chatbot designed to assist network engineers with firewall configuration queries and operational tasks.
  Your goal is to provide clear, concise, and accurate information based on the user's query.
  If the query asks for a summary of complex settings, provide a summarized explanation.
  If the query asks for guided assistance on operational tasks, provide step-by-step instructions.

  User Query: {{{query}}}
  `,
});

const nlpChatbotAssistanceFlow = ai.defineFlow(
  {
    name: 'nlpChatbotAssistanceFlow',
    inputSchema: NlpChatbotAssistanceInputSchema,
    outputSchema: NlpChatbotAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
