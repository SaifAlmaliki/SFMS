/**
 * Compliance Evaluator Service
 * Analyzes firewall logs and configurations to determine compliance status
 */

import 'server-only';
import { PrismaClient } from '../../generated/prisma';
import { getAIComplianceInsights, type ComplianceAIOutput } from '@/ai/flows/compliance-ai-analyzer';

const prisma = new PrismaClient();

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
    return {
      controlId,
      frameworkId: frameworkName,
      status: 'NeedsReview',
      details: `Evaluation error: ${error.message}`,
      evidenceRefs: []
    };
  }
}

/**
 * Evaluate all controls for a framework
 */
export async function evaluateFramework(frameworkName: string): Promise<FrameworkEvaluationResult> {
  const framework = COMPLIANCE_RULES[frameworkName as keyof typeof COMPLIANCE_RULES];
  if (!framework) {
    throw new Error(`Unknown framework: ${frameworkName}`);
  }

  const controlResults: EvaluationResult[] = [];
  
  for (const controlId of Object.keys(framework)) {
    const result = await evaluateControl(frameworkName, controlId);
    if (result) {
      controlResults.push(result);
    }
  }

  // Calculate overall framework status and coverage
  const compliantCount = controlResults.filter(r => r.status === 'Compliant').length;
  const totalControls = controlResults.length;
  const coverage = totalControls > 0 ? Math.round((compliantCount / totalControls) * 100) : 0;

  let overallStatus: 'Compliant' | 'NeedsReview' | 'NonCompliant' = 'Compliant';
  if (controlResults.some(r => r.status === 'NonCompliant')) {
    overallStatus = 'NonCompliant';
  } else if (controlResults.some(r => r.status === 'NeedsReview')) {
    overallStatus = 'NeedsReview';
  }

  // Get AI insights for the framework (optional - don't fail if AI is unavailable)
  let aiInsights: ComplianceAIOutput | undefined;
  try {
    console.log(`Attempting to get AI insights for ${frameworkName}...`);
    aiInsights = await getAIComplianceInsights(frameworkName);
    console.log(`✓ AI insights generated for ${frameworkName}`);
  } catch (error) {
    console.warn(`⚠️ AI insights unavailable for ${frameworkName}:`, error instanceof Error ? error.message : error);
    // Continue without AI insights - this is not a critical failure
    aiInsights = undefined;
  }

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
    // Get all frameworks from database
    const frameworks = await prisma.complianceFramework.findMany({
      include: { controls: true }
    });

    for (const framework of frameworks) {
      try {
        const result = await evaluateFramework(framework.name);
        frameworksEvaluated++;
        
        // Store AI insights for this framework
        if (result.aiInsights) {
          aiInsights[framework.name] = result.aiInsights;
        }

        // Update framework status with AI insights
        const aiData = result.aiInsights ? {
          aiRiskScore: result.aiInsights.riskScore,
          aiSummary: result.aiInsights.aiSummary,
          aiKeyFindings: result.aiInsights.keyFindings,
          aiViolations: result.aiInsights.violations,
          aiRecommendations: result.aiInsights.recommendations,
          aiNextSteps: result.aiInsights.nextSteps,
          aiAnalyzedAt: new Date()
        } : {};

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
        
        if (result.aiInsights) {
          console.log(`[Evaluator] Saved AI insights for ${framework.name}`);
        }

        // Store individual control results
        for (const controlResult of result.controlResults) {
          const control = framework.controls.find(c => c.controlId === controlResult.controlId);
          if (control) {
            await prisma.complianceControlResult.create({
              data: {
                controlRecordId: control.id,
                frameworkId: framework.id,
                status: controlResult.status,
                score: controlResult.score,
                evidenceRefs: controlResult.evidenceRefs,
                details: controlResult.details,
                evaluationRunId: evaluationRun.id
              }
            });
            controlsEvaluated++;
          }
        }

      } catch (error: any) {
        errors.push(`Framework ${framework.name}: ${error.message}`);
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
