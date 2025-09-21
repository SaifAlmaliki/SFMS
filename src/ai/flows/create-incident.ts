'use server';

/**
 * @fileOverview Creates a structured incident report from a natural language description of a security event.
 *
 * - createIncident - A function that creates an incident.
 * - CreateIncidentInput - The input type for the createIncident function.
 * - CreateIncidentOutput - The return type for the createIncident function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateIncidentInputSchema = z.object({
  eventDescription: z.string().describe('A natural language description of the security event, alert, or observation.'),
});
export type CreateIncidentInput = z.infer<typeof CreateIncidentInputSchema>;

const CreateIncidentOutputSchema = z.object({
  incidentId: z.string().describe('A unique identifier for the newly created incident (e.g., "INC-2024-0123").'),
  title: z.string().describe('A concise, descriptive title for the incident.'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Info']).describe('The assessed severity of the incident.'),
  summary: z.string().describe('A summary of the event, including the what, when, and where.'),
  recommendedActions: z.string().describe('A list of immediate recommended actions for the response team (e.g., "Isolate host 10.1.2.3", "Block IP 203.0.113.55").'),
});
export type CreateIncidentOutput = z.infer<typeof CreateIncidentOutputSchema>;

export async function createIncident(input: CreateIncidentInput): Promise<CreateIncidentOutput> {
  return createIncidentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createIncidentPrompt',
  input: {schema: CreateIncidentInputSchema},
  output: {schema: CreateIncidentOutputSchema},
  prompt: `You are an expert incident response coordinator. Your task is to take a description of a security event and create a formal, structured incident report.

Generate a unique incident ID in the format "INC-YYYY-NNNN".
Assess the event and assign a severity level from the available options.
Write a clear title and a summary of the incident.
Provide a set of concrete, actionable next steps for the security team.

Event Description:
"{{{eventDescription}}}"
`,
});

const createIncidentFlow = ai.defineFlow(
  {
    name: 'createIncidentFlow',
    inputSchema: CreateIncidentInputSchema,
    outputSchema: CreateIncidentOutputSchema,
  },
  async (input) => {
    const incidentId = `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    const {output} = await prompt(input);

    return {
        ...output!,
        incidentId,
    };
  }
);
