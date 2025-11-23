/**
 * API Route for Manual Firewall Log Ingestion
 * POST /api/ingestion/run
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFullIngestion, ingestTrafficLogs, ingestConfigSnapshot } from '@/lib/ingestion/firewall-ingestion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, deviceId } = body;

    let result;

    switch (type) {
      case 'traffic':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'deviceId is required for traffic ingestion' },
            { status: 400 }
          );
        }
        result = await ingestTrafficLogs(deviceId);
        break;

      case 'config':
        if (!deviceId) {
          return NextResponse.json(
            { error: 'deviceId is required for config ingestion' },
            { status: 400 }
          );
        }
        result = await ingestConfigSnapshot(deviceId);
        break;

      case 'full':
      default:
        result = await runFullIngestion();
        break;
    }

    // Handle different result types
    if ('success' in result) {
      return NextResponse.json(result);
    } else {
      // runFullIngestion result
      return NextResponse.json({
        success: result.errors.length === 0,
        ...result
      });
    }

  } catch (error: any) {
    console.error('Ingestion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Firewall Ingestion API',
    endpoints: {
      'POST /api/ingestion/run': {
        description: 'Run firewall log ingestion',
        body: {
          type: 'full | traffic | config',
          deviceId: 'string (required for traffic/config types)'
        }
      }
    }
  });
}
