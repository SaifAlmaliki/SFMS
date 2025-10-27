/**
 * Inngest API route handler
 */

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { monitorLogs } from '@/inngest/functions/monitor-logs';
import { detectAnomalies } from '@/inngest/functions/detect-anomalies';
import { deployPolicyToFirewall } from '@/inngest/functions/deploy-policy';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    monitorLogs,
    detectAnomalies,
    deployPolicyToFirewall,
  ],
});

