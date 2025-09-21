'use server';

/**
 * @fileOverview Detects anomalous admin actions and access patterns using AI.
 *
 * - detectAdminAnomalies - A function that detects admin anomalies.
 * - DetectAdminAnomaliesInput - The input type for the detectAdminAnomalies function.
 * - DetectAdminAnomaliesOutput - The return type for the detectAdminAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAdminAnomaliesInputSchema = z.object({
  adminActions: z
    .string()
    .describe(
      'A log of recent admin actions, including timestamps, user IDs, action types, and affected resources.'
    ),
  accessPatterns: z
    .string()
    .describe(
      'A record of admin access patterns, including login times, IP addresses, accessed resources, and duration of access.'
    ),
});
export type DetectAdminAnomaliesInput = z.infer<typeof DetectAdminAnomaliesInputSchema>;

const DetectAdminAnomaliesOutputSchema = z.object({
  anomalies: z
    .string()
    .describe(
      'A list of detected anomalies, including a description of the anomaly, the affected user ID, the severity level, and recommended actions.'
    ),
  riskScore: z
    .number()
    .describe(
      'A risk score indicating the overall risk level based on the detected anomalies.'
    ),
});
export type DetectAdminAnomaliesOutput = z.infer<typeof DetectAdminAnomaliesOutputSchema>;

export async function detectAdminAnomalies(
  input: DetectAdminAnomaliesInput
): Promise<DetectAdminAnomaliesOutput> {
  return detectAdminAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAdminAnomaliesPrompt',
  input: {schema: DetectAdminAnomaliesInputSchema},
  output: {schema: DetectAdminAnomaliesOutputSchema},
  prompt: `You are a security expert specializing in detecting insider threats and compromised accounts.

You will analyze the provided admin actions and access patterns to identify any unusual or suspicious activities.

Based on your analysis, you will generate a list of detected anomalies with descriptions, affected user IDs, severity levels, and recommended actions. You will also calculate a risk score indicating the overall risk level.

Admin Actions:
{{{adminActions}}}

Access Patterns:
{{{accessPatterns}}}`,
});

const detectAdminAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAdminAnomaliesFlow',
    inputSchema: DetectAdminAnomaliesInputSchema,
    outputSchema: DetectAdminAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
