// src/ai/flows/generate-firewall-policy.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating firewall policies from natural language descriptions.
 *
 * generateFirewallPolicy - A function that generates a firewall policy based on a natural language description.
 * GenerateFirewallPolicyInput - The input type for the generateFirewallPolicy function.
 * GenerateFirewallPolicyOutput - The return type for the generateFirewallPolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFirewallPolicyInputSchema = z.object({
  description: z
    .string()
    .describe(
      'A natural language description of the desired firewall policy, e.g., \'Allow HTTPS traffic from the internal network to the DMZ.\''
    ),
});
export type GenerateFirewallPolicyInput = z.infer<
  typeof GenerateFirewallPolicyInputSchema
>;

const GenerateFirewallPolicyOutputSchema = z.object({
  policy: z
    .string()
    .describe(
      'The generated firewall policy in a structured format (e.g., YAML or JSON).'
    ),
});
export type GenerateFirewallPolicyOutput = z.infer<
  typeof GenerateFirewallPolicyOutputSchema
>;

export async function generateFirewallPolicy(
  input: GenerateFirewallPolicyInput
): Promise<GenerateFirewallPolicyOutput> {
  return generateFirewallPolicyFlow(input);
}

const generateFirewallPolicyPrompt = ai.definePrompt({
  name: 'generateFirewallPolicyPrompt',
  input: {schema: GenerateFirewallPolicyInputSchema},
  output: {schema: GenerateFirewallPolicyOutputSchema},
  prompt: `You are an expert firewall administrator. You will generate a firewall policy based on the user's natural language description.

Description: {{{description}}}

Generate the firewall policy in YAML format:
`,
});

const generateFirewallPolicyFlow = ai.defineFlow(
  {
    name: 'generateFirewallPolicyFlow',
    inputSchema: GenerateFirewallPolicyInputSchema,
    outputSchema: GenerateFirewallPolicyOutputSchema,
  },
  async input => {
    const {output} = await generateFirewallPolicyPrompt(input);
    return output!;
  }
);
