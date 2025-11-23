/**
 * API Route for AI-Enhanced Compliance Analysis
 * POST /api/compliance/ai-analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIComplianceInsights } from '@/ai/flows/compliance-ai-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frameworkName, controlId, deviceId, analysisType = 'full' } = body;

    if (!frameworkName) {
      return NextResponse.json(
        { error: 'frameworkName is required' },
        { status: 400 }
      );
    }

    const aiInsights = await getAIComplianceInsights(
      frameworkName,
      controlId,
      deviceId
    );

    return NextResponse.json({
      success: true,
      frameworkName,
      analysisType,
      aiInsights
    });

  } catch (error: any) {
    console.error('AI compliance analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Compliance Analysis API',
    endpoints: {
      'POST /api/compliance/ai-analyze': {
        description: 'Run AI-enhanced compliance analysis',
        body: {
          frameworkName: 'string (required) - e.g., "PCI DSS", "HIPAA", "GDPR", "ISO 27001"',
          controlId: 'string (optional) - specific control to analyze',
          deviceId: 'string (optional) - specific device to analyze',
          analysisType: 'string (optional) - "full", "control", or "device"'
        }
      }
    },
    supportedFrameworks: ['PCI DSS', 'HIPAA', 'GDPR', 'ISO 27001']
  });
}
