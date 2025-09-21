// src/ai/flows/self-healing-misconfigurations.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting and correcting firewall misconfigurations based on predefined guardrails.
 *
 * The flow takes a firewall configuration and a set of guardrails as input, analyzes the configuration for violations,
 * and suggests or automatically applies corrections to align the configuration with the guardrails.
 *
 * @exports {function} selfHealingMisconfigurations - The main function to trigger the self-healing process.
 * @exports {type} SelfHealingMisconfigurationsInput - The input type for the selfHealingMisconfigurations function.
 * @exports {type} SelfHealingMisconfigurationsOutput - The output type for the selfHealingMisconfigurations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the flow
const SelfHealingMisconfigurationsInputSchema = z.object({
  firewallConfiguration: z.string().describe('The current firewall configuration in JSON or YAML format.'),
  guardrails: z.string().describe('A set of predefined guardrails and best practices in JSON or YAML format.'),
  autoCorrect: z
    .boolean()
    .optional()
    .default(false) // Default to false if not provided
    .describe(
      'Whether to automatically apply the suggested corrections. If false, only suggestions are provided.'
    ),
});
export type SelfHealingMisconfigurationsInput = z.infer<
  typeof SelfHealingMisconfigurationsInputSchema
>;

// Define the output schema for the flow
const SelfHealingMisconfigurationsOutputSchema = z.object({
  misconfigurationsDetected: z
    .array(z.string())
    .describe('A list of misconfigurations detected in the firewall configuration.'),
  suggestedCorrections: z
    .array(z.string())
    .describe(
      'A list of suggested corrections to align the firewall configuration with the guardrails.'
    ),
  correctedConfiguration: z
    .string()
    .optional()
    .describe(
      'The corrected firewall configuration after applying the suggested corrections, only if autoCorrect is true.'
    ),
});
export type SelfHealingMisconfigurationsOutput = z.infer<
  typeof SelfHealingMisconfigurationsOutputSchema
>;

// Define the main function that calls the flow
export async function selfHealingMisconfigurations(
  input: SelfHealingMisconfigurationsInput
): Promise<SelfHealingMisconfigurationsOutput> {
  return selfHealingMisconfigurationsFlow(input);
}

// Define the prompt for analyzing misconfigurations and suggesting corrections
const selfHealingMisconfigurationsPrompt = ai.definePrompt({
  name: 'selfHealingMisconfigurationsPrompt',
  input: {schema: SelfHealingMisconfigurationsInputSchema},
  output: {schema: SelfHealingMisconfigurationsOutputSchema},
  prompt: `You are a security expert responsible for identifying and correcting misconfigurations in firewall policies.

  Analyze the provided firewall configuration against the defined guardrails and suggest corrections to ensure a secure and compliant configuration.

  Firewall Configuration:
  {{{firewallConfiguration}}}

  Guardrails:
  {{{guardrails}}}

  {{#if autoCorrect}}
  Automatically apply the suggested corrections to the firewall configuration.
  {{else}}
  Only provide a list of misconfigurations detected and suggested corrections without applying them.
  {{/if}}

  Misconfigurations Detected:
  [List the misconfigurations detected in the firewall configuration based on the guardrails]

  Suggested Corrections:
  [List the suggested corrections to address the identified misconfigurations]

  {{#if autoCorrect}}
  Corrected Configuration: [Provide the corrected firewall configuration after applying the suggestions]
  {{/if}}

  Ensure that the output is well-formatted and easy to understand.
  `,
});

// Define the Genkit flow
const selfHealingMisconfigurationsFlow = ai.defineFlow(
  {
    name: 'selfHealingMisconfigurationsFlow',
    inputSchema: SelfHealingMisconfigurationsInputSchema,
    outputSchema: SelfHealingMisconfigurationsOutputSchema,
  },
  async input => {
    const {output} = await selfHealingMisconfigurationsPrompt(input);
    return output!;
  }
);
