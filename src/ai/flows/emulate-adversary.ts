'use server';

/**
 * @fileOverview Simulates an adversary's attack pattern against the firewall.
 *
 * - emulateAdversary - A function that simulates an adversary's attack.
 * - EmulateAdversaryInput - The input type for the emulateAdversary function.
 * - EmulateAdversaryOutput - The return type for the emulateAdversary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmulateAdversaryInputSchema = z.object({
  policySet: z.string().describe('The set of firewall policies in YAML or JSON format.'),
  attackTechniqueId: z.string().describe('The MITRE ATT&CK technique ID to simulate (e.g., "T1566").'),
});
export type EmulateAdversaryInput = z.infer<typeof EmulateAdversaryInputSchema>;

const EmulateAdversaryOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the emulation result, indicating likely success or failure of the attack.'),
  affectedRules: z.array(z.string()).describe('A list of policy rule IDs that were relevant to the simulated attack path.'),
  recommendations: z.string().describe('Recommendations for policy changes to mitigate this type of attack.'),
});
export type EmulateAdversaryOutput = z.infer<typeof EmulateAdversaryOutputSchema>;

export async function emulateAdversary(input: EmulateAdversaryInput): Promise<EmulateAdversaryOutput> {
  return emulateAdversaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emulateAdversaryPrompt',
  input: {schema: EmulateAdversaryInputSchema},
  output: {schema: EmulateAdversaryOutputSchema},
  prompt: `You are a cybersecurity expert specializing in adversary tactics and firewall rule analysis.
  
You will simulate an attack based on the provided MITRE ATT&CK technique ID against the given set of firewall policies.

Analyze the policies to determine how they would handle the simulated attack. Identify which rules would be hit, whether the attack would be blocked or allowed, and what the likely outcome would be.

Based on your analysis, provide a summary, list the relevant rule IDs, and give clear recommendations for how to strengthen the policies against this attack vector.

MITRE ATT&CK Technique: {{{attackTechniqueId}}}

Policy Set:
\`\`\`yaml
{{{policySet}}}
\`\`\`
`,
});

const emulateAdversaryFlow = ai.defineFlow(
  {
    name: 'emulateAdversaryFlow',
    inputSchema: EmulateAdversaryInputSchema,
    outputSchema: EmulateAdversaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
