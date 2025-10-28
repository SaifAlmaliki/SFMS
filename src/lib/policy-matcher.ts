/**
 * Policy Matching Service
 * Finds exact matches for firewall policy requests to prevent duplicates
 */

import { PrismaClient } from '../generated/prisma';
import { PolicyRequestParser } from './policy-parser';

const prisma = new PrismaClient();

export interface PolicyMatchRequest {
  sourceIp: string;
  destinationIp?: string;
  destinationFqdn?: string;
  destinationUrl?: string;
  port: number;
  protocol?: string;
  sourceZone?: string;
  destinationZone?: string;
  targetDevice?: string;
}

export interface PolicyWithHistory {
  id: string;
  name: string;
  source: string;
  destination: string;
  destPort: number | null;
  action: string;
  status: string;
  businessJustification: string | null;
  requestedBy: string | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  targetDevice: string | null;
  history: PolicyHistoryEntry[];
}

export interface PolicyHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  comment: string | null;
  previousStatus: string | null;
  newStatus: string | null;
}

export interface PolicyMatchResult {
  hasMatch: boolean;
  matchedPolicies: PolicyWithHistory[];
  matchType: 'exact' | 'none';
  recommendation: string;
}

export class PolicyMatcherService {
  /**
   * Find exact matches for source → destination:port
   */
  async findExactMatches(request: PolicyMatchRequest): Promise<PolicyMatchResult> {
    try {
      // Resolve destination to IP if needed
      const destinationIp = await this.resolveDestination(request);
      
      if (!destinationIp) {
        return {
          hasMatch: false,
          matchedPolicies: [],
          matchType: 'none',
          recommendation: 'Unable to resolve destination address'
        };
      }

      // Build query conditions
      const whereConditions: any = {
        source: request.sourceIp,
        destination: destinationIp,
        destPort: request.port
      };

      // Add optional filters
      if (request.targetDevice) {
        whereConditions.targetDevice = request.targetDevice;
      }
      if (request.sourceZone) {
        whereConditions.sourceZone = request.sourceZone;
      }
      if (request.destinationZone) {
        whereConditions.destinationZone = request.destinationZone;
      }

      // Find matching policies (check ALL statuses)
      const policies = await prisma.policy.findMany({
        where: whereConditions,
        include: {
          history: {
            orderBy: { performedAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (policies.length === 0) {
        return {
          hasMatch: false,
          matchedPolicies: [],
          matchType: 'none',
          recommendation: 'No existing policy found for this connection'
        };
      }

      // Format policies with history
      const policiesWithHistory: PolicyWithHistory[] = policies.map(policy => ({
        id: policy.id,
        name: policy.name,
        source: policy.source,
        destination: policy.destination,
        destPort: policy.destPort,
        action: policy.action,
        status: policy.status,
        businessJustification: policy.businessJustification,
        requestedBy: policy.requestedBy,
        approvedBy: policy.approvedBy,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
        targetDevice: policy.targetDevice,
        history: policy.history.map(h => ({
          id: h.id,
          action: h.action,
          performedBy: h.performedBy,
          performedAt: h.performedAt,
          comment: h.comment,
          previousStatus: h.previousStatus,
          newStatus: h.newStatus
        }))
      }));

      return {
        hasMatch: true,
        matchedPolicies: policiesWithHistory,
        matchType: 'exact',
        recommendation: this.generateRecommendation(policiesWithHistory)
      };

    } catch (error: any) {
      return {
        hasMatch: false,
        matchedPolicies: [],
        matchType: 'none',
        recommendation: `Error checking for duplicates: ${error.message}`
      };
    }
  }

  /**
   * Resolve destination to IP address
   */
  private async resolveDestination(request: PolicyMatchRequest): Promise<string | null> {
    // If already an IP, return it
    if (request.destinationIp) {
      return request.destinationIp;
    }

    // If FQDN, try to resolve (mock for now)
    if (request.destinationFqdn) {
      return await this.resolveFqdnToIp(request.destinationFqdn);
    }

    // If URL, extract domain and resolve
    if (request.destinationUrl) {
      const domain = PolicyRequestParser.extractDomainFromUrl(request.destinationUrl);
      if (domain) {
        return await this.resolveFqdnToIp(domain);
      }
    }

    return null;
  }

  /**
   * Resolve FQDN to IP address (mock implementation)
   */
  private async resolveFqdnToIp(fqdn: string): Promise<string | null> {
    // Mock DNS resolution - in real implementation, use actual DNS lookup
    const mockResolutions: Record<string, string> = {
      'api.example.com': '192.168.1.100',
      'service.company.com': '10.0.0.50',
      'database.internal.com': '172.16.0.10',
      'web.company.com': '203.0.113.10',
      'mail.company.com': '198.51.100.5'
    };

    return mockResolutions[fqdn] || null;
  }

  /**
   * Generate recommendation based on matched policies
   */
  private generateRecommendation(policies: PolicyWithHistory[]): string {
    const activePolicies = policies.filter(p => p.status === 'Active');
    const inactivePolicies = policies.filter(p => p.status === 'Inactive');
    const pendingPolicies = policies.filter(p => p.status === 'PendingApproval');
    const rejectedPolicies = policies.filter(p => p.status === 'Rejected');

    if (activePolicies.length > 0) {
      return `Found ${activePolicies.length} active policy(ies) covering this connection. The connection should already be working.`;
    }

    if (pendingPolicies.length > 0) {
      return `Found ${pendingPolicies.length} pending policy(ies) for this connection. Check if your request is already in progress.`;
    }

    if (inactivePolicies.length > 0) {
      return `Found ${inactivePolicies.length} inactive policy(ies) for this connection. These were previously active but have been deactivated.`;
    }

    if (rejectedPolicies.length > 0) {
      return `Found ${rejectedPolicies.length} rejected policy(ies) for this connection. Review the rejection reasons before proceeding.`;
    }

    return 'Found existing policies for this connection with various statuses.';
  }

  /**
   * Get policy with full history
   */
  async getPolicyHistory(policyId: string): Promise<PolicyHistoryEntry[]> {
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        history: {
          orderBy: { performedAt: 'asc' }
        }
      }
    });

    if (!policy) {
      return [];
    }

    return policy.history.map(h => ({
      id: h.id,
      action: h.action,
      performedBy: h.performedBy,
      performedAt: h.performedAt,
      comment: h.comment,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus
    }));
  }

  /**
   * Format match results for user display
   */
  formatMatchResults(matches: PolicyWithHistory[]): string {
    if (matches.length === 0) {
      return 'No matching policies found.';
    }

    let result = `Found ${matches.length} matching policy(ies):\n\n`;

    matches.forEach((policy, index) => {
      result += `${index + 1}. Policy ID: ${policy.id}\n`;
      result += `   Name: ${policy.name}\n`;
      result += `   Source: ${policy.source}\n`;
      result += `   Destination: ${policy.destination}:${policy.destPort}\n`;
      result += `   Action: ${policy.action}\n`;
      result += `   Status: ${policy.status}\n`;
      result += `   Created: ${policy.createdAt.toLocaleDateString()} by ${policy.requestedBy || 'Unknown'}\n`;
      
      if (policy.businessJustification) {
        result += `   Business Justification: ${policy.businessJustification}\n`;
      }

      if (policy.history.length > 0) {
        result += `   History:\n`;
        policy.history.forEach(h => {
          result += `     - ${h.action} by ${h.performedBy} on ${h.performedAt.toLocaleDateString()}`;
          if (h.comment) {
            result += ` (${h.comment})`;
          }
          result += `\n`;
        });
      }

      result += `\n`;
    });

    return result;
  }

  /**
   * Create policy history entry
   */
  async createPolicyHistory(
    policyId: string,
    action: string,
    performedBy: string,
    comment?: string,
    statusChange?: { from: string; to: string }
  ): Promise<void> {
    await prisma.policyHistory.create({
      data: {
        policyId,
        action,
        performedBy,
        comment,
        previousStatus: statusChange?.from,
        newStatus: statusChange?.to
      }
    });
  }

  /**
   * Check if a specific connection exists
   */
  async checkConnectionExists(
    sourceIp: string,
    destinationIp: string,
    port: number,
    targetDevice?: string
  ): Promise<{ exists: boolean; policies: PolicyWithHistory[] }> {
    const result = await this.findExactMatches({
      sourceIp,
      destinationIp,
      port,
      targetDevice
    });

    return {
      exists: result.hasMatch,
      policies: result.matchedPolicies
    };
  }

  /**
   * Get all policies for a specific device
   */
  async getPoliciesForDevice(deviceName: string): Promise<PolicyWithHistory[]> {
    const policies = await prisma.policy.findMany({
      where: { targetDevice: deviceName },
      include: {
        history: {
          orderBy: { performedAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      source: policy.source,
      destination: policy.destination,
      destPort: policy.destPort,
      action: policy.action,
      status: policy.status,
      businessJustification: policy.businessJustification,
      requestedBy: policy.requestedBy,
      approvedBy: policy.approvedBy,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      targetDevice: policy.targetDevice,
      history: policy.history.map(h => ({
        id: h.id,
        action: h.action,
        performedBy: h.performedBy,
        performedAt: h.performedAt,
        comment: h.comment,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus
      }))
    }));
  }
}
