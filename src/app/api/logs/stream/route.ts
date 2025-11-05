/**
 * SSE endpoint for real-time firewall log streaming
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const severity = searchParams.get('severity');
  const device = searchParams.get('device');
  const limit = parseInt(searchParams.get('limit') || '100');

  // Setup SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const initialData = JSON.stringify({ type: 'connected', message: 'Log stream connected' });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // Function to send logs
      const sendLogs = async () => {
        try {
          // Build query filters
          const where: any = {};
          if (severity) {
            where.severity = severity;
          }
          if (device) {
            where.deviceName = device;
          }

          const logs = await prisma.firewallLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
          });

          const data = JSON.stringify({ type: 'logs', data: logs, timestamp: new Date().toISOString() });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error: any) {
          const errorData = JSON.stringify({ type: 'error', message: error?.message || 'Unknown error' });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        }
      };

      // Send initial logs
      await sendLogs();

      // Poll for new logs every 2 seconds
      const interval = setInterval(async () => {
        try {
          await sendLogs();
        } catch (error) {
          console.error('Error sending logs:', error);
        }
      }, 2000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

