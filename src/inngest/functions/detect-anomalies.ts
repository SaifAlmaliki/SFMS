/**
 * Inngest function to detect anomalies in firewall logs
 */

import { inngest } from '../client';
import { PrismaClient } from '../../../src/generated/prisma';
import { sendAlertNotification } from '@/lib/email';

const prisma = new PrismaClient();

interface AnomalyDetectionResult {
  anomalyType: string;
  count: number;
  threshold: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

// Get logs from the last 5 minutes
async function getRecentLogs() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return await prisma.firewallLog.findMany({
    where: {
      timestamp: {
        gte: fiveMinutesAgo,
      },
    },
  });
}

// Detect high rate of denied connections
async function detectHighDenialRate(logs: any[]): Promise<AnomalyDetectionResult | null> {
  const deniedLogs = logs.filter(log => log.action === 'Deny');
  const rate = deniedLogs.length / 5; // per minute
  const threshold = 20; // 20 denials per minute
  
  if (rate > threshold) {
    return {
      anomalyType: 'HighDenialRate',
      count: deniedLogs.length,
      threshold,
      severity: rate > threshold * 2 ? 'Critical' : 'High',
    };
  }
  
  return null;
}

// Detect unusual source IPs
async function detectUnusualSourceIPs(logs: any[]): Promise<AnomalyDetectionResult | null> {
  const sourceIPs = logs.map(log => log.sourceIp);
  const ipCounts = sourceIPs.reduce((acc, ip) => {
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const threshold = 50; // 50 connections from same IP in 5 minutes
  const suspiciousIPs = Object.entries(ipCounts).filter(([, count]) => (count as number) > threshold);
  
  if (suspiciousIPs.length > 0) {
    return {
      anomalyType: 'UnusualSourceIPs',
      count: suspiciousIPs.length,
      threshold,
      severity: 'Medium',
    };
  }
  
  return null;
}

// Detect critical severity logs
async function detectCriticalLogs(logs: any[]): Promise<AnomalyDetectionResult | null> {
  const criticalLogs = logs.filter(log => log.severity === 'Critical');
  const threshold = 3; // 3+ critical logs in 5 minutes
  
  if (criticalLogs.length > threshold) {
    return {
      anomalyType: 'CriticalLogs',
      count: criticalLogs.length,
      threshold,
      severity: 'Critical',
    };
  }
  
  return null;
}

export const detectAnomalies = inngest.createFunction(
  {
    id: 'detect-firewall-anomalies',
    name: 'Detect Firewall Anomalies',
    retries: 2,
  },
  { cron: '*/5 * * * *' }, // Run every 5 minutes
  async ({ step }) => {
    const logs = await step.run('Get Recent Logs', async () => {
      return await getRecentLogs();
    });

    const results = await step.run('Analyze Logs', async () => {
      const detectionResults = await Promise.all([
        detectHighDenialRate(logs),
        detectUnusualSourceIPs(logs),
        detectCriticalLogs(logs),
      ]);

      return detectionResults.filter(result => result !== null);
    });

    // Create alerts for detected anomalies
    await step.run('Create Alerts', async () => {
      for (const result of results) {
        const alert = await prisma.alert.create({
          data: {
            type: 'AnomalyDetected',
            severity: result.severity,
            title: `Anomaly Detected: ${result.anomalyType}`,
            description: `${result.anomalyType} detected with count ${result.count} (threshold: ${result.threshold})`,
            source: 'Anomaly Detection System',
            status: 'Open',
          },
        });

        // Send email notification to admins (in real system, get from database)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ai-firewall.local';
        
        await sendAlertNotification(adminEmail, {
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
        });
      }

      return { alertsCreated: results.length };
    });

    return { timestamp: new Date(), anomalies: results };
  }
);

