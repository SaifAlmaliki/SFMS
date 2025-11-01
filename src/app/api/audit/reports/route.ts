import { NextRequest, NextResponse } from 'next/server';
import { createAuditReport, getAuditReports } from '@/lib/audit-report-service';

/**
 * GET /api/audit/reports - Get audit report history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const reports = await getAuditReports(limit);

    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/reports - Generate audit report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userId, format = 'json' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Use provided userId or default to 'system' for API calls
    const finalUserId = userId || 'system';

    const report = await createAuditReport(query, userId, format);

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate audit report' },
      { status: 500 }
    );
  }
}

