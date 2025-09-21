'use server';

/**
 * @fileOverview Simulates the impact of a firewall policy on a given traffic flow.
 *
 * - simulatePolicy - A function to simulate a firewall policy.
 * - SimulatePolicyInput - The input type for the simulatePolicy function.
 * - SimulatePolicyOutput - The return type for the simulatePolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulatePolicyInputSchema = z.object({
  policySet: z.string().describe('The set of firewall policies in YAML or JSON format.'),
  trafficFlow: z.string().describe('A natural language description of the traffic to simulate, e.g., "Traffic from 10.0.1.5 to 8.8.8.8 on TCP port 443".'),
});
export type SimulatePolicyInput = z.infer<typeof SimulatePolicyInputSchema>;

const SimulatePolicyOutputSchema = z.object({
  matchedRule: z.string().describe('The ID or name of the rule that the traffic matched.'),
  action: z.enum(['Allow', 'Deny', 'None']).describe('The action that would be taken (Allow, Deny, or None if no rule matched).'),
  explanation: z.string().describe('An explanation of why the action was taken.'),
});
export type SimulatePolicyOutput = z.infer<typeof SimulatePolicyOutputSchema>;

export async function simulatePolicy(input: SimulatePolicyInput): Promise<SimulatePolicyOutput> {
  return simulatePolicyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulatePolicyPrompt',
  input: {schema: SimulatePolicyInputSchema},
  output: {schema: SimulatePolicyOutputSchema},
  prompt: `You are a firewall policy simulation engine.
  
You will analyze the provided traffic flow against the given set of firewall policies.
Determine which rule the traffic would match, what action would be taken, and provide a clear explanation.

If no rule matches, the action should be "None".

Policy Set:
\`\`\`yaml
{{{policySet}}}
\`\`\`

Simulated Traffic Flow:
"{{{trafficFlow}}}"
`,
});

const simulatePolicyFlow = ai.defineFlow(
  {
    name: 'simulatePolicyFlow',
    inputSchema: SimulatePolicyInputSchema,
    outputSchema: SimulatePolicyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
