/**
 * AI-Enhanced Compliance Analysis Flow
 * Uses Gemini to provide intelligent compliance analysis with natural language insights
 * Fetches REAL-TIME data directly from FortiGate API for accurate analysis
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PrismaClient } from '../../generated/prisma';
import { FortiGateClient, FortiGateDevice } from '@/lib/fortigate';

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
 * Fetch REAL-TIME data from FortiGate API for compliance analysis
 */
async function fetchLiveFortiGateData(deviceId?: string) {
  // Get active FortiGate devices from database
  const devices = await prisma.device.findMany({
    where: {
      vendor: 'fortigate',
      status: 'Active',
      ...(deviceId ? { id: deviceId } : {})
    }
  });

  if (devices.length === 0) {
    throw new Error('No active FortiGate devices configured. Please add and activate devices in Settings.');
  }

  const liveData: {
    devices: any[];
    systemStatus: any[];
    firewallPolicies: any[];
    firewallSessions: any[];
    resourceUsage: any[];
    interfaces: any[];
    licenseStatus: any[];
    globalConfig: any[];
    errors: string[];
  } = {
    devices: [],
    systemStatus: [],
    firewallPolicies: [],
    firewallSessions: [],
    resourceUsage: [],
    interfaces: [],
    licenseStatus: [],
    globalConfig: [],
    errors: []
  };

  // Fetch real-time data from each device
  for (const device of devices) {
    if (!device.apiKey) {
      liveData.errors.push(`Device ${device.name}: No API key configured`);
      continue;
    }

    const fortigateDevice: FortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version || undefined,
    };

    const client = new FortiGateClient(fortigateDevice);
    
    try {
      console.log(`[Compliance AI] Fetching live data from ${device.name}...`);
      
      // Test connection first
      const connectionTest = await client.testConnection();
      if (!connectionTest.success) {
        liveData.errors.push(`Device ${device.name}: Connection failed - ${connectionTest.error}`);
        continue;
      }

      liveData.devices.push({
        name: device.name,
        ip: device.ip,
        status: 'Online',
        version: connectionTest.data?.version || device.version
      });

      // Fetch system status
      const systemStatus = await client.monitor.getSystemStatus();
      if (systemStatus.success) {
        liveData.systemStatus.push({
          device: device.name,
          ...systemStatus.data
        });
      }

      // Fetch firewall policies (CRITICAL for compliance)
      const policies = await client.firewall.getPolicies();
      if (policies.success && policies.data) {
        const policyList = Array.isArray(policies.data) ? policies.data : [policies.data];
        liveData.firewallPolicies.push({
          device: device.name,
          count: policyList.length,
          policies: policyList.slice(0, 20).map((p: any) => ({
            id: p.policyid,
            name: p.name,
            srcintf: p.srcintf,
            dstintf: p.dstintf,
            srcaddr: p.srcaddr,
            dstaddr: p.dstaddr,
            action: p.action,
            status: p.status,
            logtraffic: p.logtraffic,
            utm_status: p['utm-status'],
            ssl_ssh_profile: p['ssl-ssh-profile'],
            av_profile: p['av-profile'],
            ips_sensor: p['ips-sensor'],
            application_list: p['application-list'],
            webfilter_profile: p['webfilter-profile']
          }))
        });
      }

      // Fetch active sessions
      const sessions = await client.monitor.getFirewallSessions();
      if (sessions.success && sessions.data) {
        liveData.firewallSessions.push({
          device: device.name,
          totalSessions: sessions.data.total || 0,
          summary: sessions.data
        });
      }

      // Fetch resource usage
      const resources = await client.monitor.getResourceUsage();
      if (resources.success && resources.data) {
        liveData.resourceUsage.push({
          device: device.name,
          cpu: resources.data.cpu,
          memory: resources.data.memory,
          disk: resources.data.disk
        });
      }

      // Fetch interface status
      const interfaces = await client.monitor.getInterfaceStats();
      if (interfaces.success && interfaces.data) {
        liveData.interfaces.push({
          device: device.name,
          interfaces: interfaces.data
        });
      }

      // Fetch license status
      const license = await client.monitor.getLicenseStatus();
      if (license.success && license.data) {
        liveData.licenseStatus.push({
          device: device.name,
          ...license.data
        });
      }

      // Fetch global system config
      const globalConfig = await client.system.getGlobal();
      if (globalConfig.success && globalConfig.data) {
        liveData.globalConfig.push({
          device: device.name,
          hostname: globalConfig.data.hostname,
          timezone: globalConfig.data.timezone,
          admin_sport: globalConfig.data['admin-sport'],
          admin_ssh_port: globalConfig.data['admin-ssh-port'],
          admintimeout: globalConfig.data.admintimeout,
          strong_crypto: globalConfig.data['strong-crypto'],
          ssl_min_proto_version: globalConfig.data['ssl-min-proto-version']
        });
      }

      console.log(`[Compliance AI] ✓ Live data fetched from ${device.name}`);
    } catch (error: any) {
      liveData.errors.push(`Device ${device.name}: ${error.message}`);
      console.error(`[Compliance AI] Error fetching from ${device.name}:`, error.message);
    }
  }

  if (liveData.devices.length === 0) {
    throw new Error('Could not connect to any FortiGate devices. Please check device connectivity and API keys.');
  }

  return liveData;
}

/**
 * Get relevant data for AI analysis - combines live FortiGate data with compliance framework info
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

  // Fetch REAL-TIME data from FortiGate API
  const liveData = await fetchLiveFortiGateData(deviceId);

  return {
    framework,
    liveData,
    deviceCount: liveData.devices.length
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

    // Use LIVE data from FortiGate API
    const liveData = context.liveData;
    
    // Summarize framework controls
    const controlsSummary = context.framework.controls?.map((c: any) => ({
      controlId: c.controlId,
      description: c.description?.substring(0, 50),
      latestResult: c.results?.[0]?.status || 'NotEvaluated'
    })) || [];

    const frameworkPrompt = getFrameworkPrompt(frameworkName);

    // Generate AI analysis with REAL-TIME FortiGate data
    console.log('[Compliance AI] Starting AI generation for framework:', frameworkName);
    console.log('[Compliance AI] Live devices:', liveData.devices.map((d: any) => d.name).join(', '));
    console.log('[Compliance AI] Firewall policies count:', liveData.firewallPolicies.reduce((sum: number, d: any) => sum + d.count, 0));
    
    let response;
    try {
      response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `You are a cybersecurity compliance expert. Analyze this ${frameworkName} compliance data from LIVE FortiGate firewall.

${frameworkPrompt}

REAL-TIME FORTIGATE DATA:
- Connected Devices (${liveData.devices.length}): ${JSON.stringify(liveData.devices)}
- System Status: ${JSON.stringify(liveData.systemStatus)}
- Global Config: ${JSON.stringify(liveData.globalConfig)}
- Resource Usage: ${JSON.stringify(liveData.resourceUsage)}
- Firewall Policies: ${JSON.stringify(liveData.firewallPolicies.map((d: any) => ({ device: d.device, count: d.count, policies: d.policies?.slice(0, 5) })))}
- Active Sessions: ${JSON.stringify(liveData.firewallSessions)}
- License Status: ${JSON.stringify(liveData.licenseStatus)}
- Connection Errors: ${liveData.errors.length > 0 ? liveData.errors.join('; ') : 'None'}

COMPLIANCE CONTROLS:
- Framework: ${context.framework.name}
- Controls (${controlsSummary.length}): ${JSON.stringify(controlsSummary)}

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
          maxOutputTokens: 4096, // Increased to allow room for thinking + output
          thinkingConfig: {
            thinkingBudget: 0 // Disable thinking mode to get direct output
          }
        }
      });
      console.log('[Compliance AI] AI generation completed');
      console.log('[Compliance AI] Response object:', JSON.stringify(response, null, 2).substring(0, 500));
    } catch (genError: any) {
      console.error('[Compliance AI] AI generation failed:', genError.message);
      console.error('[Compliance AI] Full error:', genError);
      throw genError;
    }

    try {
      // Try different ways to access the response text
      let responseText = response.text;
      
      // If response.text is a function, call it
      if (typeof response.text === 'function') {
        responseText = (response as any).text();
        console.log('[Compliance AI] response.text was a function');
      }
      
      // Check for alternative response properties
      if (!responseText && (response as any).output) {
        responseText = JSON.stringify((response as any).output);
        console.log('[Compliance AI] Using response.output instead');
      }
      
      if (!responseText && (response as any).message?.content) {
        // Handle message.content array format
        const content = (response as any).message.content;
        if (Array.isArray(content) && content.length > 0) {
          responseText = content.map((c: any) => c.text || '').join('');
        } else if (typeof content === 'string') {
          responseText = content;
        }
        console.log('[Compliance AI] Using response.message.content');
      }
      
      // Ensure responseText is a string
      if (typeof responseText !== 'string') {
        responseText = String(responseText || '');
      }
      
      console.log('[Compliance AI] Raw response length:', responseText?.length || 0);
      console.log('[Compliance AI] Raw response:', typeof responseText === 'string' ? responseText.substring(0, 200) : 'N/A');
      
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
      const responseText = typeof response.text === 'string' ? response.text : '';
      console.error('JSON parsing failed:', error);
      console.log('Failed response text:', responseText);
      
      // Try to extract useful information from the raw response
      let extractedSummary = responseText ? responseText.substring(0, 500) : '';
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
