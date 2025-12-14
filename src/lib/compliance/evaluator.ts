/**
 * Compliance Evaluator Service
 * Analyzes firewall logs and configurations to determine compliance status
 */

import 'server-only';
import { PrismaClient } from '../../generated/prisma';
import { 
  getAIComplianceInsights, 
  type ComplianceAIOutput, 
  fetchLiveFortiGateData,
  type LiveFortiGateData 
} from '@/ai/flows/compliance-ai-analyzer';

const prisma = new PrismaClient();

/**
 * Calculate overall compliance status from control results
 */
function calculateOverallStatus(controlResults: EvaluationResult[]): 'Compliant' | 'NeedsReview' | 'NonCompliant' {
  if (controlResults.some(r => r.status === 'NonCompliant')) {
    return 'NonCompliant';
  }
  if (controlResults.some(r => r.status === 'NeedsReview')) {
    return 'NeedsReview';
  }
  return 'Compliant';
}

/**
 * Calculate coverage percentage from control results
 */
function calculateCoverage(controlResults: EvaluationResult[]): number {
  if (controlResults.length === 0) return 0;
  const compliantCount = controlResults.filter(r => r.status === 'Compliant').length;
  return Math.round((compliantCount / controlResults.length) * 100);
}

export interface EvaluationResult {
  controlId: string;
  frameworkId: string;
  status: 'Compliant' | 'NeedsReview' | 'NonCompliant';
  score?: number;
  details: string;
  evidenceRefs: any[];
  aiInsights?: {
    riskScore: number;
    aiSummary: string;
    keyFindings: string[];
    violations: Array<{
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      description: string;
      recommendation: string;
      evidenceRef?: string;
    }>;
    recommendations: Array<{
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
      action: string;
      businessImpact: string;
      estimatedEffort: string;
    }>;
    nextSteps: string[];
  };
}

export interface FrameworkEvaluationResult {
  frameworkId: string;
  status: 'Compliant' | 'NeedsReview' | 'NonCompliant';
  coverage: number;
  controlResults: EvaluationResult[];
  aiInsights?: ComplianceAIOutput;
}

/**
 * Compliance rules for different frameworks
 */
const COMPLIANCE_RULES = {
  // PCI DSS Rules
  'PCI DSS': {
    'REQ-3.1': {
      name: 'Data retention and disposal policies',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check if logging is enabled and retention policies are in place
        const configSnapshots = await prisma.firewallSnapshot.findMany({
          where: { snapshotType: 'ConfigGlobal' },
          orderBy: { capturedAt: 'desc' },
          take: 5
        });

        const hasLoggingConfig = configSnapshots.some(snapshot => 
          snapshot.payload && 
          typeof snapshot.payload === 'object' && 
          'log' in snapshot.payload
        );

        return {
          controlId: 'REQ-3.1',
          frameworkId: 'PCI DSS',
          status: hasLoggingConfig ? 'Compliant' : 'NeedsReview',
          score: hasLoggingConfig ? 100 : 50,
          details: hasLoggingConfig 
            ? 'Logging configuration found in device snapshots'
            : 'No logging configuration detected in recent snapshots',
          evidenceRefs: configSnapshots.map(s => ({ type: 'snapshot', id: s.id }))
        };
      }
    },
    'REQ-3.2': {
      name: 'Do not store sensitive authentication data',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check for any blocked authentication attempts or policy violations
        const recentEvents = await prisma.firewallEvent.findMany({
          where: {
            eventTime: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            },
            severity: { in: ['High', 'Critical'] }
          },
          take: 10
        });

        const hasSecurityViolations = recentEvents.length > 0;

        return {
          controlId: 'REQ-3.2',
          frameworkId: 'PCI DSS',
          status: hasSecurityViolations ? 'NeedsReview' : 'Compliant',
          score: hasSecurityViolations ? 70 : 100,
          details: hasSecurityViolations 
            ? `${recentEvents.length} high/critical security events in last 24h`
            : 'No critical security events detected',
          evidenceRefs: recentEvents.map(e => ({ type: 'event', id: e.id }))
        };
      }
    },
    'REQ-8.2': {
      name: 'Strong cryptography and security protocols',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check firewall policies for encryption requirements
        const policySnapshots = await prisma.firewallSnapshot.findMany({
          where: { snapshotType: 'ConfigPolicy' },
          orderBy: { capturedAt: 'desc' },
          take: 1
        });

        let hasEncryptionPolicies = false;
        let policyCount = 0;

        if (policySnapshots.length > 0 && policySnapshots[0].payload) {
          const policies = Array.isArray(policySnapshots[0].payload) 
            ? policySnapshots[0].payload 
            : [policySnapshots[0].payload];
          
          policyCount = policies.length;
          hasEncryptionPolicies = policies.some((policy: any) => 
            policy.service && (
              policy.service.includes('HTTPS') || 
              policy.service.includes('SSL') ||
              policy.service.includes('443')
            )
          );
        }

        return {
          controlId: 'REQ-8.2',
          frameworkId: 'PCI DSS',
          status: hasEncryptionPolicies ? 'Compliant' : 'NeedsReview',
          score: hasEncryptionPolicies ? 100 : 60,
          details: hasEncryptionPolicies 
            ? `Encryption protocols found in ${policyCount} policies`
            : `No encryption protocols detected in ${policyCount} policies`,
          evidenceRefs: policySnapshots.map(s => ({ type: 'snapshot', id: s.id }))
        };
      }
    }
  },

  // HIPAA Rules
  'HIPAA': {
    '164.312(a)(1)': {
      name: 'Access Control',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check for access control policies and denied access attempts
        const deniedEvents = await prisma.firewallEvent.findMany({
          where: {
            eventTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            },
            payload: {
              path: ['action'],
              equals: 'deny'
            }
          },
          take: 20
        });

        const hasAccessControls = deniedEvents.length > 0;

        return {
          controlId: '164.312(a)(1)',
          frameworkId: 'HIPAA',
          status: hasAccessControls ? 'Compliant' : 'NeedsReview',
          score: hasAccessControls ? 100 : 70,
          details: hasAccessControls 
            ? `${deniedEvents.length} access control events in last 7 days`
            : 'No access control events detected',
          evidenceRefs: deniedEvents.map(e => ({ type: 'event', id: e.id }))
        };
      }
    },
    '164.312(b)': {
      name: 'Audit Controls',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check if audit logging is active
        const recentEvents = await prisma.firewallEvent.findMany({
          where: {
            eventTime: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          take: 1
        });

        const hasRecentAuditLogs = recentEvents.length > 0;

        return {
          controlId: '164.312(b)',
          frameworkId: 'HIPAA',
          status: hasRecentAuditLogs ? 'Compliant' : 'NonCompliant',
          score: hasRecentAuditLogs ? 100 : 0,
          details: hasRecentAuditLogs 
            ? 'Audit logging is active with recent events'
            : 'No recent audit events - logging may be disabled',
          evidenceRefs: recentEvents.map(e => ({ type: 'event', id: e.id }))
        };
      }
    }
  },

  // GDPR Rules
  'GDPR': {
    'Art. 5': {
      name: 'Principles relating to processing of personal data',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check for data processing monitoring
        const dataEvents = await prisma.firewallEvent.findMany({
          where: {
            eventTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            severity: { in: ['Medium', 'High', 'Critical'] }
          },
          take: 10
        });

        return {
          controlId: 'Art. 5',
          frameworkId: 'GDPR',
          status: 'Compliant',
          score: 90,
          details: `Monitoring ${dataEvents.length} data processing events`,
          evidenceRefs: dataEvents.map(e => ({ type: 'event', id: e.id }))
        };
      }
    },
    'Art. 25': {
      name: 'Data protection by design and by default',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check for default deny policies
        const policySnapshots = await prisma.firewallSnapshot.findMany({
          where: { snapshotType: 'ConfigPolicy' },
          orderBy: { capturedAt: 'desc' },
          take: 1
        });

        let hasDefaultDeny = false;
        if (policySnapshots.length > 0) {
          const policies = Array.isArray(policySnapshots[0].payload) 
            ? policySnapshots[0].payload 
            : [policySnapshots[0].payload];
          
          hasDefaultDeny = policies.some((policy: any) => 
            policy.action === 'deny' || policy.action === 'block'
          );
        }

        return {
          controlId: 'Art. 25',
          frameworkId: 'GDPR',
          status: hasDefaultDeny ? 'Compliant' : 'NeedsReview',
          score: hasDefaultDeny ? 100 : 75,
          details: hasDefaultDeny 
            ? 'Default deny policies found in configuration'
            : 'No explicit default deny policies detected',
          evidenceRefs: policySnapshots.map(s => ({ type: 'snapshot', id: s.id }))
        };
      }
    }
  },

  // ISO 27001 Rules
  'ISO 27001': {
    'A.5.1': {
      name: 'Policies for information security',
      evaluate: async (): Promise<EvaluationResult> => {
        const configSnapshots = await prisma.firewallSnapshot.findMany({
          where: { snapshotType: 'ConfigGlobal' },
          orderBy: { capturedAt: 'desc' },
          take: 1
        });

        const hasSecurityPolicies = configSnapshots.length > 0;

        return {
          controlId: 'A.5.1',
          frameworkId: 'ISO 27001',
          status: hasSecurityPolicies ? 'Compliant' : 'NonCompliant',
          score: hasSecurityPolicies ? 100 : 0,
          details: hasSecurityPolicies 
            ? 'Security policies found in configuration'
            : 'No security policy configuration detected',
          evidenceRefs: configSnapshots.map(s => ({ type: 'snapshot', id: s.id }))
        };
      }
    },
    'A.8.1': {
      name: 'Asset management',
      evaluate: async (): Promise<EvaluationResult> => {
        // Check if devices are being monitored
        const activeDevices = await prisma.device.count({
          where: { status: 'Active' }
        });

        const recentIngestion = await prisma.ingestionRun.count({
          where: {
            startedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            },
            status: 'Success'
          }
        });

        const isMonitored = activeDevices > 0 && recentIngestion > 0;

        return {
          controlId: 'A.8.1',
          frameworkId: 'ISO 27001',
          status: isMonitored ? 'Compliant' : 'NonCompliant',
          score: isMonitored ? 100 : 20,
          details: isMonitored 
            ? `${activeDevices} devices actively monitored`
            : `${activeDevices} devices, but no recent monitoring data`,
          evidenceRefs: [{ type: 'device_count', count: activeDevices }]
        };
      }
    }
  }
};

/**
 * Evaluate a single compliance control
 */
export async function evaluateControl(
  frameworkName: string, 
  controlId: string
): Promise<EvaluationResult | null> {
  const framework = COMPLIANCE_RULES[frameworkName as keyof typeof COMPLIANCE_RULES];
  if (!framework) return null;

  const control = framework[controlId as keyof typeof framework] as any;
  if (!control) return null;

  try {
    return await control.evaluate();
  } catch (error: any) {
    console.error(`Error evaluating control ${controlId}:`, error);
    return createErrorResult(controlId, frameworkName, error.message);
  }
}

/**
 * Create an error result for failed control evaluation
 */
function createErrorResult(
  controlId: string, 
  frameworkId: string, 
  errorMessage: string
): EvaluationResult {
  return {
    controlId,
    frameworkId,
    status: 'NeedsReview',
    details: `Evaluation error: ${errorMessage}`,
    evidenceRefs: []
  };
}

/**
 * Get AI insights with error handling (non-blocking)
 */
async function getAIInsightsSafely(
  frameworkName: string, 
  liveData?: LiveFortiGateData
): Promise<ComplianceAIOutput | undefined> {
  try {
    console.log(`Attempting to get AI insights for ${frameworkName}...`);
    const insights = await getAIComplianceInsights(frameworkName, undefined, undefined, liveData);
    console.log(`✓ AI insights generated for ${frameworkName}`);
    return insights;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ AI insights unavailable for ${frameworkName}:`, message);
    return undefined; // Non-blocking failure
  }
}

/**
 * Evaluate all controls for a framework
 * @param liveData - Pre-fetched live FortiGate data (optional, will fetch if not provided)
 */
export async function evaluateFramework(
  frameworkName: string,
  liveData?: LiveFortiGateData
): Promise<FrameworkEvaluationResult> {
  const framework = COMPLIANCE_RULES[frameworkName as keyof typeof COMPLIANCE_RULES];
  if (!framework) {
    throw new Error(`Unknown framework: ${frameworkName}`);
  }

  // Evaluate all controls in parallel
  const controlIds = Object.keys(framework);
  const controlPromises = controlIds.map(controlId => 
    evaluateControl(frameworkName, controlId)
  );
  
  const controlResults = (await Promise.all(controlPromises))
    .filter((result): result is EvaluationResult => result !== null);

  // Calculate status and coverage using helper functions
  const overallStatus = calculateOverallStatus(controlResults);
  const coverage = calculateCoverage(controlResults);

  // Get AI insights (non-blocking)
  const aiInsights = await getAIInsightsSafely(frameworkName, liveData);

  return {
    frameworkId: frameworkName,
    status: overallStatus,
    coverage,
    controlResults,
    aiInsights
  };
}

/**
 * Run compliance evaluation for all frameworks
 */
export async function runComplianceEvaluation(): Promise<{
  success: boolean;
  frameworksEvaluated: number;
  controlsEvaluated: number;
  errors: string[];
  aiInsights: Record<string, any>;
}> {
  const errors: string[] = [];
  let frameworksEvaluated = 0;
  let controlsEvaluated = 0;
  const aiInsights: Record<string, any> = {};

  // Create evaluation run record
  const evaluationRun = await prisma.complianceEvaluationRun.create({
    data: {
      status: 'Running',
      triggeredBy: 'system'
    }
  });

  try {
    // STEP 1: Collect ALL firewall data FIRST (before any evaluation)
    console.log('[Evaluator] Step 1: Collecting all firewall data...');
    const liveData = await fetchLiveFortiGateData();
    console.log(`[Evaluator] ✓ Collected data from ${liveData.devices.length} device(s)`);

    // STEP 2: Get all frameworks from database
    const frameworks = await prisma.complianceFramework.findMany({
      include: { controls: true }
    });

    // STEP 3: Evaluate all frameworks in parallel using the pre-collected data
    console.log(`[Evaluator] Step 2: Evaluating ${frameworks.length} framework(s) in parallel...`);
    const frameworkResults = await Promise.all(
      frameworks.map(async (framework) => {
        try {
          const result = await evaluateFramework(framework.name, liveData);
          return { framework, result, success: true as const, error: null };
        } catch (error: any) {
          return { 
            framework, 
            result: null, 
            success: false as const, 
            error: error.message 
          };
        }
      })
    );

    // Process results and store in database
    for (const { framework, result, success, error } of frameworkResults) {
      if (!success || !result) {
        errors.push(`Framework ${framework.name}: ${error || 'Evaluation failed'}`);
        continue;
      }

      frameworksEvaluated++;
      
      // Store AI insights
      if (result.aiInsights) {
        aiInsights[framework.name] = result.aiInsights;
      }

      // Prepare AI data for database
      const aiData = result.aiInsights ? {
        aiRiskScore: result.aiInsights.riskScore,
        aiSummary: result.aiInsights.aiSummary,
        aiKeyFindings: result.aiInsights.keyFindings,
        aiViolations: result.aiInsights.violations,
        aiRecommendations: result.aiInsights.recommendations,
        aiNextSteps: result.aiInsights.nextSteps,
        aiAnalyzedAt: new Date()
      } : {};

      // Update framework status
      await prisma.complianceFrameworkStatus.upsert({
        where: { frameworkId: framework.id },
        update: {
          status: result.status,
          coverage: result.coverage,
          lastAudit: new Date(),
          notes: `Evaluated ${result.controlResults.length} controls`,
          ...aiData
        },
        create: {
          frameworkId: framework.id,
          status: result.status,
          coverage: result.coverage,
          lastAudit: new Date(),
          notes: `Initial evaluation of ${result.controlResults.length} controls`,
          ...aiData
        }
      });

      // Batch insert control results
      const controlResultsToInsert = result.controlResults
        .map(controlResult => {
          const control = framework.controls.find(c => c.controlId === controlResult.controlId);
          return control ? {
            controlRecordId: control.id,
            frameworkId: framework.id,
            status: controlResult.status,
            score: controlResult.score,
            evidenceRefs: controlResult.evidenceRefs,
            details: controlResult.details,
            evaluationRunId: evaluationRun.id
          } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (controlResultsToInsert.length > 0) {
        await prisma.complianceControlResult.createMany({
          data: controlResultsToInsert,
          skipDuplicates: true
        });
        controlsEvaluated += controlResultsToInsert.length;
      }
    }

    // Update evaluation run as completed
    await prisma.complianceEvaluationRun.update({
      where: { id: evaluationRun.id },
      data: {
        status: errors.length === 0 ? 'Success' : 'Failed',
        completedAt: new Date(),
        controlsEvaluated,
        frameworksUpdated: frameworksEvaluated,
        error: errors.length > 0 ? errors.join('; ') : null
      }
    });

    return {
      success: errors.length === 0,
      frameworksEvaluated,
      controlsEvaluated,
      errors,
      aiInsights
    };

  } catch (error: any) {
    await prisma.complianceEvaluationRun.update({
      where: { id: evaluationRun.id },
      data: {
        status: 'Failed',
        completedAt: new Date(),
        error: error.message
      }
    });

    throw error;
  }
}
