/**
 * Inngest function to continuously monitor firewall logs and detect anomalies
 */

import { inngest } from '../client';
import { generateAndStoreLogs } from '@/lib/log-simulator';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export const monitorLogs = inngest.createFunction(
  {
    id: 'monitor-firewall-logs',
    name: 'Monitor Firewall Logs',
    retries: 3,
  },
  { cron: '*/1 * * * *' }, // Run every minute
  async ({ step }) => {
    return await step.run('Generate Logs', async () => {
      // Generate a mix of normal and occasional anomaly logs
      const pattern = Math.random() > 0.9 ? 'anomaly' : 'normal';
      const count = Math.floor(Math.random() * 5) + 5; // 5-10 logs per minute
      
      await generateAndStoreLogs(pattern as any, count);
      
      return { pattern, count, timestamp: new Date() };
    });
  }
);

