
'use server';

/**
 * @fileOverview Ingests and analyzes threat intelligence feeds.
 *
 * - threatIntelligence - A function that processes threat intelligence data.
 * - ThreatIntelligenceInput - The input type for the threatIntelligence function.
 * - ThreatIntelligenceOutput - The return type for the threatIntelligence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThreatIntelligenceInputSchema = z.object({
  feedUrl: z.string().url().describe('The URL of the threat intelligence feed (e.g., STIX/TAXII, MISP).'),
  feedType: z.enum(['stix', 'misp', 'csv']).describe('The format of the threat intelligence feed.'),
});
export type ThreatIntelligenceInput = z.infer<typeof ThreatIntelligenceInputSchema>;

const ThreatIntelligenceOutputSchema = z.object({
  processedIndicators: z.number().describe('The number of indicators processed from the feed.'),
  newIocs: z.number().describe('The number of new Indicators of Compromise (IoCs) identified.'),
  summary: z.string().describe('A summary of the threat intelligence data, including key threats and trends.'),
});
export type ThreatIntelligenceOutput = z.infer<typeof ThreatIntelligenceOutputSchema>;

export async function threatIntelligence(input: ThreatIntelligenceInput): Promise<ThreatIntelligenceOutput> {
  return threatIntelligenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'threatIntelligencePrompt',
  input: {schema: ThreatIntelligenceInputSchema},
  output: {schema: ThreatIntelligenceOutputSchema},
  prompt: `You are a threat intelligence analyst. You will ingest and analyze a threat intelligence feed from the provided URL.

Feed URL: {{{feedUrl}}}
Feed Type: {{{feedType}}}

You will process the feed, identify new Indicators of Compromise (IoCs), and provide a summary of the key threats and trends found in the data. Your response should be structured according to the output schema.
`,
});

const threatIntelligenceFlow = ai.defineFlow(
  {
    name: 'threatIntelligenceFlow',
    inputSchema: ThreatIntelligenceInputSchema,
    outputSchema: ThreatIntelligenceOutputSchema,
  },
  async input => {
    // In a real application, you would fetch the data from the URL and parse it.
    // For this mock, we will just return some static data.
    console.log(`Ingesting threat intelligence from ${input.feedUrl} of type ${input.feedType}`);
    
    const {output} = await prompt(input);
    
    // This is a placeholder response.
    return output || {
      processedIndicators: Math.floor(Math.random() * 500) + 100,
      newIocs: Math.floor(Math.random() * 50),
      summary: 'The feed contained information about a new phishing campaign targeting financial institutions. Key indicators include several malicious domains and file hashes associated with the Emotet trojan.',
    };
  }
);
