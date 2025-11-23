/**
 * API Route for Testing AI Compliance Analysis
 * GET /api/compliance/ai-test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIComplianceInsights } from '@/ai/flows/compliance-ai-analyzer';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing AI compliance analysis...');
    
    // Test with a simple framework
    const testResult = await getAIComplianceInsights('PCI DSS');
    
    return NextResponse.json({
      success: true,
      message: 'AI compliance analysis test completed',
      result: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('AI compliance test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'AI compliance test failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
