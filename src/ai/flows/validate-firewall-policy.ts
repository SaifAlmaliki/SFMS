'use server';

/**
 * @fileOverview Validates a firewall policy against security best practices, including conflict detection.
 *
 * - validateFirewallPolicy - A function to validate a firewall policy.
 * - ValidateFirewallPolicyInput - The input type for the validateFirewallPolicy function.
 * - ValidateFirewallPolicyOutput - The return type for the validateFirewallPolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateFirewallPolicyInputSchema = z.object({
  policy: z.string().describe('The firewall policy in YAML or JSON format.'),
});
export type ValidateFirewallPolicyInput = z.infer<typeof ValidateFirewallPolicyInputSchema>;

const ValidateFirewallPolicyOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the policy is valid according to best practices.'),
  findings: z.array(z.object({
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Info']),
    message: z.string(),
    type: z.enum(['Conflict', 'Security', 'Best Practice', 'General']),
  })).describe('A list of findings, including severity, a descriptive message, and the type of finding.'),
});
export type ValidateFirewallPolicyOutput = z.infer<typeof ValidateFirewallPolicyOutputSchema>;

export async function validateFirewallPolicy(
  input: ValidateFirewallPolicyInput
): Promise<ValidateFirewallPolicyOutput> {
  return validateFirewallPolicyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateFirewallPolicyPrompt',
  input: {schema: ValidateFirewallPolicyInputSchema},
  output: {schema: ValidateFirewallPolicyOutputSchema},
  prompt: `You are a firewall security expert.
  
Analyze the provided firewall policy for any security issues, conflicts, or violations of best practices. Specifically check for the following:

- Conflict Detection:
  - Shadowing: A rule that is completely covered by a preceding, more general rule, making it unreachable.
  - Overlap/Redundancy: Two or more rules that apply to the same traffic, which may be unintentional.
  - Generalization: A rule that is a more general version of another rule.

- Security Best Practices:
  - Least Privilege: Rules should be as specific as possible. Avoid 'any' or broad ranges in sources, destinations, and services.
  - Deny-by-default: Ensure there isn't an implicit allow.
  - Risky Services: Flag the use of insecure protocols like telnet, ftp, etc.
  - Logging: Ensure logging is enabled for important rules, especially deny rules.

For each issue found, classify its type as 'Conflict', 'Security', or 'Best Practice'.

Return your findings in the specified output format. If no issues are found, return an empty findings array and set isValid to true.

Policy to Validate:
\`\`\`yaml
{{{policy}}}
\`\`\`
`,
});

const validateFirewallPolicyFlow = ai.defineFlow(
  {
    name: 'validateFirewallPolicyFlow',
    inputSchema: ValidateFirewallPolicyInputSchema,
    outputSchema: ValidateFirewallPolicyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
