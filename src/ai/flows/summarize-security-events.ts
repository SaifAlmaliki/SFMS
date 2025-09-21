// Summarize Security Events Flow
'use server';
/**
 * @fileOverview A security event summarization AI agent.
 *
 * - summarizeSecurityEvents - A function that handles the summarization of security events.
 * - SummarizeSecurityEventsInput - The input type for the summarizeSecurityEvents function.
 * - SummarizeSecurityEventsOutput - The return type for the summarizeSecurityEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSecurityEventsInputSchema = z.object({
  securityEvents: z.string().describe('The security events to summarize.'),
});
export type SummarizeSecurityEventsInput = z.infer<typeof SummarizeSecurityEventsInputSchema>;

const SummarizeSecurityEventsOutputSchema = z.object({
  summary: z.string().describe('The summary of the security events.'),
});
export type SummarizeSecurityEventsOutput = z.infer<typeof SummarizeSecurityEventsOutputSchema>;

export async function summarizeSecurityEvents(input: SummarizeSecurityEventsInput): Promise<SummarizeSecurityEventsOutput> {
  return summarizeSecurityEventsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSecurityEventsPrompt',
  input: {schema: SummarizeSecurityEventsInputSchema},
  output: {schema: SummarizeSecurityEventsOutputSchema},
  prompt: `You are a security expert. Please summarize the following security events: {{{securityEvents}}}`,
});

const summarizeSecurityEventsFlow = ai.defineFlow(
  {
    name: 'summarizeSecurityEventsFlow',
    inputSchema: SummarizeSecurityEventsInputSchema,
    outputSchema: SummarizeSecurityEventsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
