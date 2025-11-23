/**
 * API Route for Compliance Reports
 * GET /api/compliance/reports
 */

import { NextResponse } from 'next/server';
import { getComplianceReports } from '@/lib/data';

export async function GET() {
  try {
    const complianceReports = await getComplianceReports();
    return NextResponse.json(complianceReports);
  } catch (error: any) {
    console.error('Compliance reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance reports', details: error.message },
      { status: 500 }
    );
  }
}
