/**
 * AI-Enhanced Compliance Analysis Flow
 * Uses Gemini to provide intelligent compliance analysis with natural language insights
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

const ComplianceAIInputSchema = z.object({
  frameworkName: z.string().describe('Compliance framework name (e.g., PCI DSS, HIPAA)'),
  controlId: z.string().optional().describe('Specific control ID to analyze'),
  deviceId: z.string().optional().describe('Specific device to analyze'),
  analysisType: z.enum(['full', 'control', 'device']).default('full').describe('Type of analysis to perform'),
});

export type ComplianceAIInput = z.infer<typeof ComplianceAIInputSchema>;

const ComplianceAIOutputSchema = z.object({
  overallStatus: z.enum(['Compliant', 'NeedsReview', 'NonCompliant']).describe('Overall compliance status'),
  riskScore: z.number().min(1).max(10).describe('Risk score from 1 (low) to 10 (critical)'),
  aiSummary: z.string().describe('AI-generated summary in natural language'),
  keyFindings: z.array(z.string()).describe('Key compliance findings'),
  violations: z.array(z.object({
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
    description: z.string(),
    recommendation: z.string(),
    evidenceRef: z.string().optional()
  })).describe('Specific violations found'),
  recommendations: z.array(z.object({
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    action: z.string(),
    businessImpact: z.string(),
    estimatedEffort: z.string()
  })).describe('Prioritized recommendations'),
  trendAnalysis: z.string().optional().describe('Analysis of compliance trends over time'),
  nextSteps: z.array(z.string()).describe('Recommended next steps'),
});

export type ComplianceAIOutput = z.infer<typeof ComplianceAIOutputSchema>;

/**
 * Get relevant data for AI analysis
 */
async function getComplianceContext(frameworkName: string, controlId?: string, deviceId?: string) {
  // Get recent firewall events
  const recentEvents = await prisma.firewallEvent.findMany({
    where: deviceId ? { deviceId } : {},
    orderBy: { eventTime: 'desc' },
    take: 50,
    include: { device: true }
  });

  // Get configuration snapshots
  const configSnapshots = await prisma.firewallSnapshot.findMany({
    where: {
      ...(deviceId && { deviceId }),
      snapshotType: { in: ['ConfigGlobal', 'ConfigPolicy'] }
    },
    orderBy: { capturedAt: 'desc' },
    take: 10,
    include: { device: true }
  });

  // Get framework and controls
  const framework = await prisma.complianceFramework.findFirst({
    where: { name: frameworkName },
    include: {
      controls: {
        where: controlId ? { controlId } : {},
        include: {
          results: {
            orderBy: { evaluatedAt: 'desc' },
            take: 5
          }
        }
      }
    }
  });

  // Get recent ingestion runs for context
  const recentIngestions = await prisma.ingestionRun.findMany({
    where: deviceId ? { deviceId } : {},
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { device: true }
  });

  return {
    framework,
    recentEvents,
    configSnapshots,
    recentIngestions,
    deviceCount: await prisma.device.count({ where: { status: 'Active' } })
  };
}

/**
 * Generate compliance framework-specific prompts
 */
function getFrameworkPrompt(frameworkName: string): string {
  const prompts = {
    'PCI DSS': `
      Focus on Payment Card Industry Data Security Standard requirements:
      - Data encryption and secure transmission
      - Access controls and authentication
      - Network security and firewalls
      - Logging and monitoring
      - Vulnerability management
    `,
    'HIPAA': `
      Focus on Health Insurance Portability and Accountability Act requirements:
      - Administrative safeguards
      - Physical safeguards  
      - Technical safeguards
      - Access controls for PHI
      - Audit controls and logging
    `,
    'GDPR': `
      Focus on General Data Protection Regulation requirements:
      - Data protection by design and default
      - Lawful basis for processing
      - Data subject rights
      - Security of processing
      - Data breach notification
    `,
    'ISO 27001': `
      Focus on Information Security Management System requirements:
      - Information security policies
      - Asset management
      - Access control
      - Cryptography
      - Operations security
      - Network security controls
    `
  };

  return prompts[frameworkName as keyof typeof prompts] || 'General compliance analysis focusing on security best practices.';
}

/**
 * Main AI compliance analysis flow
 */
export const analyzeComplianceWithAI = ai.defineFlow(
  {
    name: 'analyzeComplianceWithAI',
    inputSchema: ComplianceAIInputSchema,
    outputSchema: ComplianceAIOutputSchema,
  },
  async (input) => {
    const { frameworkName, controlId, deviceId, analysisType } = input;

    // Get compliance context data
    const context = await getComplianceContext(frameworkName, controlId, deviceId);
    
    if (!context.framework) {
      throw new Error(`Framework ${frameworkName} not found`);
    }

    // Prepare data for AI analysis
    const analysisData = {
      framework: context.framework,
      recentEvents: context.recentEvents.map(e => ({
        severity: e.severity,
        eventTime: e.eventTime,
        payload: e.payload,
        deviceName: e.device?.name
      })),
      configurations: context.configSnapshots.map(s => ({
        type: s.snapshotType,
        capturedAt: s.capturedAt,
        payload: s.payload,
        deviceName: s.device?.name
      })),
      ingestionStatus: context.recentIngestions.map(i => ({
        status: i.status,
        startedAt: i.startedAt,
        itemsFetched: i.itemsFetched,
        deviceName: i.device?.name
      })),
      deviceCount: context.deviceCount
    };

    const frameworkPrompt = getFrameworkPrompt(frameworkName);

    // Generate AI analysis
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `
        You are a cybersecurity compliance expert analyzing firewall configurations and logs for ${frameworkName} compliance.

        ${frameworkPrompt}

        ANALYSIS DATA:
        Framework: ${JSON.stringify(context.framework, null, 2)}
        Recent Security Events (${context.recentEvents.length}): ${JSON.stringify(analysisData.recentEvents, null, 2)}
        Configuration Snapshots (${context.configSnapshots.length}): ${JSON.stringify(analysisData.configurations, null, 2)}
        Ingestion Status: ${JSON.stringify(analysisData.ingestionStatus, null, 2)}
        Active Devices: ${context.deviceCount}

        ANALYSIS REQUIREMENTS:
        1. Determine overall compliance status: Compliant, NeedsReview, or NonCompliant
        2. Assign a risk score from 1-10 (1=low risk, 10=critical risk)
        3. Provide a clear, executive-level summary
        4. Identify key findings and specific violations
        5. Give prioritized, actionable recommendations
        6. Suggest next steps

        RESPONSE FORMAT:
        Provide a JSON response with the following structure:
        {
          "overallStatus": "Compliant|NeedsReview|NonCompliant",
          "riskScore": 1-10,
          "aiSummary": "Executive summary in 2-3 sentences",
          "keyFindings": ["Finding 1", "Finding 2", ...],
          "violations": [
            {
              "severity": "Low|Medium|High|Critical",
              "description": "What's wrong",
              "recommendation": "How to fix it",
              "evidenceRef": "Reference to evidence"
            }
          ],
          "recommendations": [
            {
              "priority": "Low|Medium|High|Critical", 
              "action": "What to do",
              "businessImpact": "Why it matters",
              "estimatedEffort": "Time/resources needed"
            }
          ],
          "trendAnalysis": "Analysis of trends over time",
          "nextSteps": ["Step 1", "Step 2", ...]
        }

        Focus on practical, actionable insights that help improve security posture and compliance.
      `,
      config: {
        temperature: 0.3, // Lower temperature for more consistent compliance analysis
        maxOutputTokens: 2048
      }
    });

    try {
      const responseText = response.text;
      const aiResult = JSON.parse(responseText);
      return aiResult as ComplianceAIOutput;
    } catch (error) {
      // Fallback if JSON parsing fails
      const responseText = response.text;
      return {
        overallStatus: 'NeedsReview' as const,
        riskScore: 5,
        aiSummary: responseText.substring(0, 500),
        keyFindings: ['AI analysis completed but response format needs review'],
        violations: [],
        recommendations: [{
          priority: 'Medium' as const,
          action: 'Review AI analysis output format',
          businessImpact: 'Ensure consistent compliance reporting',
          estimatedEffort: '1 hour'
        }],
        nextSteps: ['Review and reformat AI analysis output']
      };
    }
  }
);

/**
 * Simplified function for direct use in compliance evaluator
 */
export async function getAIComplianceInsights(
  frameworkName: string, 
  controlId?: string, 
  deviceId?: string
): Promise<ComplianceAIOutput> {
  return await analyzeComplianceWithAI({
    frameworkName,
    controlId,
    deviceId,
    analysisType: controlId ? 'control' : 'full'
  });
}
