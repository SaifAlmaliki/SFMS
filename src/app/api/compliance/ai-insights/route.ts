/**
 * API Route for fetching persisted AI Compliance Insights
 * GET /api/compliance/ai-insights - Get AI insights from ComplianceFrameworkStatus
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get framework statuses with AI insights
    const frameworkStatuses = await prisma.complianceFrameworkStatus.findMany({
      where: {
        aiAnalyzedAt: { not: null }
      },
      include: {
        framework: true
      }
    });

    const insights: Record<string, any> = {};

    for (const status of frameworkStatuses) {
      if (status.aiRiskScore !== null) {
        insights[status.framework.name] = {
          overallStatus: status.status,
          riskScore: status.aiRiskScore,
          aiSummary: status.aiSummary,
          keyFindings: status.aiKeyFindings,
          violations: status.aiViolations,
          recommendations: status.aiRecommendations,
          nextSteps: status.aiNextSteps,
          analyzedAt: status.aiAnalyzedAt
        };
      }
    }

    return NextResponse.json({
      success: true,
      insights,
      count: Object.keys(insights).length
    });

  } catch (error: any) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI insights', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frameworkName = searchParams.get('framework');

    if (frameworkName) {
      // Clear AI insights for specific framework
      const framework = await prisma.complianceFramework.findFirst({
        where: { name: frameworkName }
      });
      if (framework) {
        await prisma.complianceFrameworkStatus.updateMany({
          where: { frameworkId: framework.id },
          data: {
            aiRiskScore: null,
            aiSummary: null,
            aiKeyFindings: Prisma.DbNull,
            aiViolations: Prisma.DbNull,
            aiRecommendations: Prisma.DbNull,
            aiNextSteps: Prisma.DbNull,
            aiAnalyzedAt: null
          }
        });
      }
    } else {
      // Clear all AI insights
      await prisma.complianceFrameworkStatus.updateMany({
        data: {
          aiRiskScore: null,
          aiSummary: null,
          aiKeyFindings: Prisma.DbNull,
          aiViolations: Prisma.DbNull,
          aiRecommendations: Prisma.DbNull,
          aiNextSteps: Prisma.DbNull,
          aiAnalyzedAt: null
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear AI insights', details: error.message },
      { status: 500 }
    );
  }
}
