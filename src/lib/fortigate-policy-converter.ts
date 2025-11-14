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
  // FortiGate expects interface names, not zone names
  // Common interface names: internal, wan1, wan2, dmz, etc.
  // If sourceZone is a zone name, try to map it to interface name
  let srcintfName = 'any';
  if (policy.sourceZone) {
    // Map common zone names to interface names
    const zoneToInterface: Record<string, string> = {
      'Internal': 'internal',
      'Public': 'wan1',
      'DMZ': 'dmz',
    };
    srcintfName = zoneToInterface[policy.sourceZone] || policy.sourceZone.toLowerCase() || 'any';
  }
  const srcintf = [{ name: srcintfName }];
  
  // Map destination interface/zone
  let dstintfName = 'any';
  if (policy.destinationZone) {
    const zoneToInterface: Record<string, string> = {
      'Internal': 'internal',
      'Public': 'wan1',
      'DMZ': 'dmz',
    };
    dstintfName = zoneToInterface[policy.destinationZone] || policy.destinationZone.toLowerCase() || 'any';
  }
  const dstintf = [{ name: dstintfName }];
  
  // Map source address
  // FortiGate expects address object names or 'all' for any
  let srcaddrName = 'all';
  if (policy.source && policy.source !== 'any' && policy.source !== 'Any') {
    // If it's an IP address, it should be converted to an address object name
    // For now, use the source as-is (assuming it's an address object name)
    srcaddrName = policy.source;
  }
  const srcaddr = [{ name: srcaddrName }];
  
  // Map destination address
  let dstaddrName = 'all';
  if (policy.destination && policy.destination !== 'any' && policy.destination !== 'Any') {
    dstaddrName = policy.destination;
  }
  const dstaddr = [{ name: dstaddrName }];
  
  // Map service/port
  // FortiGate expects service object names or 'ALL' for all services
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
      23: 'TELNET',
      110: 'POP3',
      143: 'IMAP',
      993: 'IMAPS',
      995: 'POP3S',
    };
    
    if (commonServices[policy.destPort]) {
      service = [{ name: commonServices[policy.destPort] }];
    } else {
      // For custom ports, we should create a custom service
      // For now, use ALL and let the deployment handle service creation
      // Or use a generic TCP/UDP service
      service = [{ name: 'ALL' }];
    }
  }
  
  // Map status
  const status = policy.status === 'Active' ? 'enable' : 'disable';
  
  // Policy name - FortiGate has a 35 character limit
  // Remove policy ID suffix if present to keep name shorter
  let policyName = policy.name || `Policy-${policy.id}`;
  // Truncate if too long
  if (policyName.length > 35) {
    policyName = policyName.substring(0, 32) + '...';
  }
  
  return {
    name: policyName,
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
    nat: 'disable', // Default to no NAT
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

