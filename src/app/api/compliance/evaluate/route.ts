/**
 * API Route for Compliance Evaluation
 * POST /api/compliance/evaluate
 */

import { NextRequest, NextResponse } from 'next/server';
import { runComplianceEvaluation, evaluateFramework, evaluateControl } from '@/lib/compliance/evaluator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, framework, controlId } = body;

    let result;

    switch (type) {
      case 'control':
        if (!framework || !controlId) {
          return NextResponse.json(
            { error: 'framework and controlId are required for control evaluation' },
            { status: 400 }
          );
        }
        result = await evaluateControl(framework, controlId);
        if (!result) {
          return NextResponse.json(
            { error: 'Control not found or evaluation failed' },
            { status: 404 }
          );
        }
        break;

      case 'framework':
        if (!framework) {
          return NextResponse.json(
            { error: 'framework is required for framework evaluation' },
            { status: 400 }
          );
        }
        result = await evaluateFramework(framework);
        break;

      case 'all':
      default:
        result = await runComplianceEvaluation();
        break;
    }

    // Log what we're returning
    console.log('[Evaluate API] Returning result with aiInsights:', 
      result?.aiInsights ? Object.keys(result.aiInsights) : 'none');
    
    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('Compliance evaluation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Compliance Evaluation API',
    endpoints: {
      'POST /api/compliance/evaluate': {
        description: 'Run compliance evaluation',
        body: {
          type: 'all | framework | control',
          framework: 'string (required for framework/control types)',
          controlId: 'string (required for control type)'
        }
      }
    }
  });
}
