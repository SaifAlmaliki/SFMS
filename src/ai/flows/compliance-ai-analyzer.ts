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
  const framework = await prisma.complianceFramework.findFirst({
    where: { name: frameworkName },
    include: {
      controls: {
        where: controlId ? { id: controlId } : {},
        include: { results: { orderBy: { evaluatedAt: 'desc' }, take: 3 } }
      }
    }
  });

  // Get recent firewall events for context
  const recentEvents = await prisma.firewallEvent.findMany({
    where: deviceId ? { deviceId } : {},
    orderBy: { eventTime: 'desc' },
    take: 20,
    include: { device: true }
  });

  // Get recent configuration snapshots
  const configSnapshots = await prisma.firewallSnapshot.findMany({
    where: {
      AND: [
        deviceId ? { deviceId } : {},
        { snapshotType: { in: ['ConfigGlobal', 'ConfigPolicy'] } }
      ]
    },
    orderBy: { capturedAt: 'desc' },
    take: 5,
    include: { device: true }
  });

  // Get recent ingestion runs for context
  const recentIngestions = await prisma.ingestionRun.findMany({
    where: deviceId ? { deviceId } : {},
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { device: true }
  });

  const deviceCount = await prisma.device.count({ where: { status: 'Active' } });

  // Check if we have active devices but no data (firewall offline scenario)
  if (deviceCount === 0) {
    // No active devices configured
    throw new Error('No active firewall devices configured. Please add and activate devices in Settings.');
  }

  if (recentEvents.length === 0 && configSnapshots.length === 0) {
    // We have active devices but no data - likely offline
    throw new Error('Firewall devices are offline or disconnected. AI analysis requires active firewall connection to analyze security data.');
  }

  return {
    framework,
    recentEvents,
    configSnapshots,
    recentIngestions,
    deviceCount
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
        deviceName: (s as any).device?.name
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

        CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text.

        RESPONSE FORMAT (JSON only - keep responses concise):
        {
          "overallStatus": "Compliant|NeedsReview|NonCompliant",
          "riskScore": 1-10,
          "aiSummary": "Brief executive summary (max 2 sentences)",
          "keyFindings": ["Finding 1", "Finding 2"],
          "violations": [
            {
              "severity": "Low|Medium|High|Critical",
              "description": "Brief description",
              "recommendation": "Short recommendation"
            }
          ],
          "recommendations": [
            {
              "priority": "Low|Medium|High|Critical", 
              "action": "Brief action",
              "businessImpact": "Short impact",
              "estimatedEffort": "Brief effort"
            }
          ],
          "nextSteps": ["Step 1", "Step 2"]
        }

        Focus on practical, actionable insights. Respond with JSON only - no other text or formatting.
      `,
      config: {
        temperature: 0.3, // Lower temperature for more consistent compliance analysis
        maxOutputTokens: 1024 // Reduced to prevent truncation
      }
    });

    try {
      let responseText = response.text;
      console.log('Raw AI response length:', responseText?.length || 0);
      console.log('Raw AI response:', responseText);
      
      // Handle empty or null responses
      if (!responseText || responseText.trim().length === 0) {
        console.log('Empty AI response, using fallback');
        throw new Error('Empty AI response');
      }
      
      // Clean up the response - remove markdown code blocks if present
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON if it's embedded in other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      // Check if we have valid JSON structure
      if (!responseText.includes('{') || !responseText.includes('}')) {
        console.log('No valid JSON structure found, using fallback');
        throw new Error('No valid JSON structure');
      }
      
      // Check if JSON is truncated and try to fix it
      if (!responseText.trim().endsWith('}')) {
        console.log('Detected truncated JSON, attempting to fix...');
        // Try to close the JSON properly
        const openBraces = (responseText.match(/\{/g) || []).length;
        const closeBraces = (responseText.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        if (missingBraces > 0) {
          responseText += '}'.repeat(missingBraces);
        }
        
        // Remove any trailing commas that might cause issues
        responseText = responseText.replace(/,(\s*[}\]])/g, '$1');
      }
      
      const aiResult = JSON.parse(responseText);
      console.log('Successfully parsed AI result');
      return aiResult as ComplianceAIOutput;
    } catch (error) {
      // Enhanced fallback with better error handling
      const responseText = response.text;
      console.error('JSON parsing failed:', error);
      console.log('Failed response text:', responseText);
      
      // Try to extract useful information from the raw response
      let extractedSummary = responseText.substring(0, 500);
      let extractedStatus: 'Compliant' | 'NeedsReview' | 'NonCompliant' = 'NeedsReview';
      let extractedRiskScore = 5;
      
      // Try to extract status and risk score from the raw text
      if (responseText.includes('NonCompliant')) {
        extractedStatus = 'NonCompliant';
      } else if (responseText.includes('Compliant')) {
        extractedStatus = 'Compliant';
      }
      
      const riskMatch = responseText.match(/"riskScore":\s*(\d+)/);
      if (riskMatch) {
        extractedRiskScore = parseInt(riskMatch[1]);
      }
      
      // Generate a basic fallback response based on framework
      const fallbackResponse = generateFallbackResponse(frameworkName, extractedStatus, extractedRiskScore);
      return fallbackResponse;
    }
  }
);

/**
 * Generate a fallback response when AI analysis fails
 */
function generateFallbackResponse(
  frameworkName: string, 
  status: 'Compliant' | 'NeedsReview' | 'NonCompliant', 
  riskScore: number
): ComplianceAIOutput {
  const frameworkInfo = {
    'PCI DSS': {
      summary: 'PCI DSS compliance requires secure handling of cardholder data with proper encryption, access controls, and logging.',
      keyFindings: ['Payment card data security assessment needed', 'Network security controls require review'],
      violations: [{
        severity: 'Medium' as const,
        description: 'Incomplete PCI DSS compliance assessment',
        recommendation: 'Conduct thorough PCI DSS security assessment'
      }]
    },
    'HIPAA': {
      summary: 'HIPAA compliance focuses on protecting electronic health information through administrative, physical, and technical safeguards.',
      keyFindings: ['ePHI protection measures need evaluation', 'Audit controls require assessment'],
      violations: [{
        severity: 'Medium' as const,
        description: 'HIPAA compliance status unclear',
        recommendation: 'Review technical safeguards and audit controls'
      }]
    },
    'GDPR': {
      summary: 'GDPR compliance requires data protection by design, lawful processing, and individual rights protection.',
      keyFindings: ['Data protection measures need review', 'Privacy by design implementation required'],
      violations: [{
        severity: 'Medium' as const,
        description: 'GDPR compliance assessment incomplete',
        recommendation: 'Implement data protection by design principles'
      }]
    },
    'ISO 27001': {
      summary: 'ISO 27001 requires a comprehensive information security management system with documented policies and controls.',
      keyFindings: ['Information security policies need documentation', 'Asset management controls require implementation'],
      violations: [{
        severity: 'Medium' as const,
        description: 'ISO 27001 compliance framework incomplete',
        recommendation: 'Establish formal information security management system'
      }]
    }
  };

  const info = frameworkInfo[frameworkName as keyof typeof frameworkInfo] || frameworkInfo['ISO 27001'];

  return {
    overallStatus: status,
    riskScore: riskScore,
    aiSummary: `${info.summary} Current status requires attention.`,
    keyFindings: info.keyFindings,
    violations: info.violations,
    recommendations: [{
      priority: 'Medium' as const,
      action: `Review ${frameworkName} compliance requirements`,
      businessImpact: 'Ensure regulatory compliance and avoid penalties',
      estimatedEffort: '2-4 hours'
    }],
    nextSteps: [
      `Conduct detailed ${frameworkName} compliance assessment`,
      'Implement recommended security controls'
    ]
  };
}

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
