import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'ai-firewall-agent',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export const inngestConfig = {
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002',
};

