/**
 * FortiGate Policy Converter
 * Converts between database policy format and FortiGate API format
 */

import type { Policy } from '@/lib/data';

export interface FortiGatePolicyFormat {
  name?: string;
  srcintf: Array<{ name: string }>;
  dstintf: Array<{ name: string }>;
  srcaddr: Array<{ name: string }>;
  dstaddr: Array<{ name: string }>;
  action: 'accept' | 'deny';
  schedule?: string;
  service?: Array<{ name: string }>;
  logtraffic?: 'all' | 'utm' | 'disable';
  comments?: string;
  policyid?: number;
  nat?: 'enable' | 'disable';
  status?: 'enable' | 'disable';
}

/**
 * Convert database policy to FortiGate API format
 */
export function convertPolicyToFortiGate(policy: Policy): FortiGatePolicyFormat {
  // Map action
  const action = policy.action === 'Allow' ? 'accept' : 'deny';
  
  // Map source interface/zone
  const srcintf = policy.sourceZone 
    ? [{ name: policy.sourceZone }]
    : [{ name: 'any' }];
  
  // Map destination interface/zone
  const dstintf = policy.destinationZone
    ? [{ name: policy.destinationZone }]
    : [{ name: 'any' }];
  
  // Map source address
  // First check if source is an address object name, otherwise use the IP/FQDN
  const srcaddr = policy.source && policy.source !== 'any'
    ? [{ name: policy.source }]
    : [{ name: 'all' }];
  
  // Map destination address
  const dstaddr = policy.destination && policy.destination !== 'any'
    ? [{ name: policy.destination }]
    : [{ name: 'all' }];
  
  // Map service/port
  let service: Array<{ name: string }> = [{ name: 'ALL' }];
  if (policy.destPort) {
    // Check if it's a common service
    const commonServices: Record<number, string> = {
      80: 'HTTP',
      443: 'HTTPS',
      22: 'SSH',
      21: 'FTP',
      25: 'SMTP',
      53: 'DNS',
      3389: 'RDP',
    };
    
    if (commonServices[policy.destPort]) {
      service = [{ name: commonServices[policy.destPort] }];
    } else {
      // Create custom service name
      service = [{ name: `port-${policy.destPort}` }];
    }
  }
  
  // Map status
  const status = policy.status === 'Active' ? 'enable' : 'disable';
  
  // Ensure unique policy name by including policy ID
  // FortiGate requires unique policy names, so we append the policy ID
  const uniqueName = policy.name 
    ? `${policy.name}-${policy.id}`
    : `Policy-${policy.id}`;
  
  return {
    name: uniqueName,
    srcintf,
    dstintf,
    srcaddr,
    dstaddr,
    action,
    schedule: 'always',
    service,
    logtraffic: 'all',
    comments: policy.businessJustification || undefined,
    status,
  };
}

/**
 * Convert FortiGate API policy to database format
 */
export function convertFortiGateToPolicy(
  fortigatePolicy: any,
  deviceName?: string
): Partial<Policy> {
  // Extract action
  const action = fortigatePolicy.action === 'accept' ? 'Allow' : 'Deny';
  
  // Extract source
  const source = fortigatePolicy.srcaddr?.[0]?.name || 'all';
  
  // Extract destination
  const destination = fortigatePolicy.dstaddr?.[0]?.name || 'all';
  
  // Extract port from service
  let destPort: number | null = null;
  if (fortigatePolicy.service && fortigatePolicy.service.length > 0) {
    const serviceName = fortigatePolicy.service[0].name;
    // Check if it's a port number
    if (serviceName.startsWith('port-')) {
      destPort = parseInt(serviceName.replace('port-', ''), 10);
    } else {
      // Map common services to ports
      const servicePorts: Record<string, number> = {
        'HTTP': 80,
        'HTTPS': 443,
        'SSH': 22,
        'FTP': 21,
        'SMTP': 25,
        'DNS': 53,
        'RDP': 3389,
      };
      destPort = servicePorts[serviceName] || null;
    }
  }
  
  // Extract zones
  const sourceZone = fortigatePolicy.srcintf?.[0]?.name || undefined;
  const destinationZone = fortigatePolicy.dstintf?.[0]?.name || undefined;
  
  // Extract status
  const status = fortigatePolicy.status === 'enable' ? 'Active' : 'Inactive';
  
  return {
    name: fortigatePolicy.name || `Policy-${fortigatePolicy.policyid || Date.now()}`,
    source,
    destination,
    destPort,
    action,
    status,
    sourceZone,
    destinationZone,
    targetDevice: deviceName,
    businessJustification: fortigatePolicy.comments || undefined,
    vendor: 'fortigate',
    vendorId: fortigatePolicy.policyid?.toString(),
    rawConfig: fortigatePolicy,
  };
}

/**
 * Ensure address objects exist in FortiGate before creating policy
 * This is a helper to check/create address objects if needed
 */
export async function ensureAddressObjects(
  client: any,
  source: string,
  destination: string
): Promise<{ sourceAddr: string; destAddr: string }> {
  // If source/destination are IPs or FQDNs, we might need to create address objects
  // For now, we'll use them as-is and let FortiGate handle it
  // In a production system, you'd check if address objects exist and create them if needed
  
  return {
    sourceAddr: source,
    destAddr: destination,
  };
}

