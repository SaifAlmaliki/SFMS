
import { config } from 'dotenv';
config();

import '@/ai/flows/nlp-chatbot-assistance.ts';
import '@/ai/flows/ai-manage-retrain-evaluate-version.ts';
import '@/ai/flows/self-healing-misconfigurations.ts';
import '@/ai/flows/summarize-security-events.ts';
import '@/ai/flows/generate-firewall-policy.ts';
import '@/ai/flows/detect-admin-anomalies.ts';
import '@/ai/flows/threat-intelligence.ts';
