/**
 * Firewall Vendor Configuration System
 * Supports multiple firewall brands with vendor-specific configurations
 */

export interface FirewallVendor {
  id: string;
  name: string;
  displayName: string;
  policyFormat: string;
  apiVersion: string;
  fields: string[];
  apiEndpoint: string;
  authType: 'basic' | 'token' | 'certificate';
  policyTemplate: string;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface FortiGatePolicy {
  name: string;
  srcintf: string | Array<{ name: string }>;      // Source interface (string for CLI, array for API)
  dstintf: string | Array<{ name: string }>;      // Destination interface (string for CLI, array for API)
  srcaddr: string | Array<{ name: string }>;     // Source address (string for CLI, array for API)
  dstaddr: string | Array<{ name: string }>;     // Destination address (string for CLI, array for API)
  action: 'accept' | 'deny';
  schedule: string;
  service: string | Array<{ name: string }>;     // Service (string for CLI, array for API)
  logtraffic: 'all' | 'utm' | 'disable';
  comments?: string;
  destPort?: number;   // Destination port for service mapping
}

// FortiGate Configuration
export const FORTIGATE_VENDOR: FirewallVendor = {
  id: 'fortigate',
  name: 'FortiGate',
  displayName: 'Fortinet FortiGate',
  policyFormat: 'fortigate-cli',
  apiVersion: 'v2',
  fields: ['srcintf', 'dstintf', 'srcaddr', 'dstaddr', 'action', 'schedule', 'service', 'logtraffic'],
  apiEndpoint: '/api/v2/cmdb/firewall/policy',
  authType: 'token',
  policyTemplate: `config firewall policy
  edit 0
    set name "{{name}}"
    set srcintf "{{srcintf}}"
    set dstintf "{{dstintf}}"
    set srcaddr "{{srcaddr}}"
    set dstaddr "{{dstaddr}}"
    set action {{action}}
    set schedule "{{schedule}}"
    set service "{{service}}"
    set logtraffic {{logtraffic}}
    {{#if comments}}set comments "{{comments}}"{{/if}}
  next
end`,
  validationRules: [
    { field: 'name', required: true, minLength: 1, maxLength: 35 },
    { field: 'srcintf', required: true },
    { field: 'dstintf', required: true },
    { field: 'srcaddr', required: true },
    { field: 'dstaddr', required: true },
    { field: 'action', required: true, allowedValues: ['accept', 'deny'] },
    { field: 'schedule', required: true },
    { field: 'service', required: true },
    { field: 'logtraffic', required: true, allowedValues: ['all', 'utm', 'disable'] }
  ]
};

// Palo Alto Configuration (for future expansion)
export const PALO_ALTO_VENDOR: FirewallVendor = {
  id: 'paloalto',
  name: 'Palo Alto',
  displayName: 'Palo Alto Networks',
  policyFormat: 'panos-xml',
  apiVersion: 'v1',
  fields: ['from', 'to', 'source', 'destination', 'application', 'service', 'action'],
  apiEndpoint: '/api/?type=config&action=set',
  authType: 'token',
  policyTemplate: `<entry name="{{name}}">
  <from>{{from}}</from>
  <to>{{to}}</to>
  <source>{{source}}</source>
  <destination>{{destination}}</destination>
  <application>{{application}}</application>
  <service>{{service}}</service>
  <action>{{action}}</action>
</entry>`,
  validationRules: [
    { field: 'name', required: true, minLength: 1, maxLength: 31 },
    { field: 'from', required: true },
    { field: 'to', required: true },
    { field: 'source', required: true },
    { field: 'destination', required: true },
    { field: 'action', required: true, allowedValues: ['allow', 'deny', 'drop'] }
  ]
};

// Cisco ASA Configuration (for future expansion)
export const CISCO_ASA_VENDOR: FirewallVendor = {
  id: 'cisco',
  name: 'Cisco ASA',
  displayName: 'Cisco Adaptive Security Appliance',
  policyFormat: 'cisco-asa',
  apiVersion: 'v1',
  fields: ['access-list', 'permit', 'deny', 'source', 'destination', 'protocol'],
  apiEndpoint: '/api/access-list',
  authType: 'basic',
  policyTemplate: `access-list {{access-list}} {{action}} {{protocol}} {{source}} {{destination}}`,
  validationRules: [
    { field: 'access-list', required: true },
    { field: 'action', required: true, allowedValues: ['permit', 'deny'] },
    { field: 'protocol', required: true },
    { field: 'source', required: true },
    { field: 'destination', required: true }
  ]
};

// Available vendors
export const AVAILABLE_VENDORS: FirewallVendor[] = [
  FORTIGATE_VENDOR,
  PALO_ALTO_VENDOR,
  CISCO_ASA_VENDOR
];

// Get vendor by ID
export function getVendorById(vendorId: string): FirewallVendor | undefined {
  return AVAILABLE_VENDORS.find(vendor => vendor.id === vendorId);
}

// Get default vendor (FortiGate)
export function getDefaultVendor(): FirewallVendor {
  return FORTIGATE_VENDOR;
}

// Validate policy against vendor rules
export function validatePolicy(policy: any, vendor: FirewallVendor): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const rule of vendor.validationRules) {
    const value = policy[rule.field];
    
    if (rule.required && (!value || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }
    
    if (value) {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be no more than ${rule.maxLength} characters`);
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }
      
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(`${rule.field} must be one of: ${rule.allowedValues.join(', ')}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Convert generic policy to vendor-specific format
export function convertToVendorFormat(genericPolicy: any, vendor: FirewallVendor): any {
  switch (vendor.id) {
    case 'fortigate':
      return convertToFortiGate(genericPolicy);
    case 'paloalto':
      return convertToPaloAlto(genericPolicy);
    case 'cisco':
      return convertToCiscoASA(genericPolicy);
    default:
      return genericPolicy;
  }
}

// Convert to FortiGate format
function convertToFortiGate(genericPolicy: any): FortiGatePolicy {
  // Map port to FortiGate service format
  let service: string | Array<{ name: string }> = 'ALL';
  const port = genericPolicy.destPort || genericPolicy.port;
  
  if (port) {
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
    
    if (commonServices[port]) {
      service = [{ name: commonServices[port] }];
    } else {
      service = [{ name: `port-${port}` }];
    }
  } else {
    service = [{ name: 'ALL' }];
  }
  
  // Interfaces (zones) - use sourceZone/destinationZone, not IP addresses
  // FortiGate API expects arrays
  const srcZone = mapToFortiGateInterface(genericPolicy.sourceZone || genericPolicy.source);
  const dstZone = mapToFortiGateInterface(genericPolicy.destinationZone || genericPolicy.destination);
  const srcintf = [{ name: srcZone }];
  const dstintf = [{ name: dstZone }];
  
  // Addresses - use IP addresses or FQDNs
  // FortiGate API expects arrays
  // Priority: destinationIp > destinationFqdn > destinationUrl > destination (from DB)
  // Exclude common words that shouldn't be used as destinations
  const excludedWords = ['access', 'connect', 'reach', 'use', 'allow', 'deny'];
  const destinationValue = genericPolicy.destinationIp 
    || genericPolicy.destinationFqdn 
    || genericPolicy.destinationUrl 
    || (genericPolicy.destination && 
        !excludedWords.includes(genericPolicy.destination.toLowerCase()) && 
        genericPolicy.destination.trim() !== '' 
        ? genericPolicy.destination 
        : undefined);
  
  const srcAddr = mapToFortiGateAddress(genericPolicy.sourceIp || genericPolicy.source);
  const dstAddr = mapToFortiGateAddress(destinationValue);
  const srcaddr = [{ name: srcAddr }];
  const dstaddr = [{ name: dstAddr }];
  
  // Debug logging
  if (!genericPolicy.destinationIp && !genericPolicy.destinationFqdn && !genericPolicy.destinationUrl) {
    console.warn('Warning: No destination IP/FQDN/URL found in policy. Generic policy:', {
      destinationIp: genericPolicy.destinationIp,
      destinationFqdn: genericPolicy.destinationFqdn,
      destinationUrl: genericPolicy.destinationUrl,
      destination: genericPolicy.destination,
      finalDestination: destinationValue
    });
  }
  
  return {
    name: genericPolicy.name || `Policy-${Date.now()}`,
    srcintf,
    dstintf,
    srcaddr,
    dstaddr,
    action: genericPolicy.action === 'Allow' ? 'accept' : 'deny',
    schedule: 'always',
    service,
    logtraffic: 'all',
    comments: genericPolicy.businessJustification || genericPolicy.description,
    destPort: port
  };
}

// Convert to Palo Alto format
function convertToPaloAlto(genericPolicy: any): any {
  return {
    name: genericPolicy.name || `Policy-${Date.now()}`,
    from: mapToPaloAltoZone(genericPolicy.source),
    to: mapToPaloAltoZone(genericPolicy.destination),
    source: mapToPaloAltoAddress(genericPolicy.source),
    destination: mapToPaloAltoAddress(genericPolicy.destination),
    application: 'any',
    service: 'any',
    action: genericPolicy.action === 'Allow' ? 'allow' : 'deny'
  };
}

// Convert to Cisco ASA format
function convertToCiscoASA(genericPolicy: any): any {
  return {
    'access-list': 'OUTSIDE_IN',
    action: genericPolicy.action === 'Allow' ? 'permit' : 'deny',
    protocol: 'tcp',
    source: mapToCiscoAddress(genericPolicy.source),
    destination: mapToCiscoAddress(genericPolicy.destination)
  };
}

// Helper functions for mapping generic values to vendor-specific values
function mapToFortiGateInterface(source?: string): string {
  if (!source) {
    return 'any';
  }
  
  // Map common network names to FortiGate interfaces
  const interfaceMap: Record<string, string> = {
    'internal': 'internal',
    'dmz': 'dmz',
    'external': 'wan1',
    'wan': 'wan1',
    'lan': 'internal',
    'any': 'any'
  };
  
  const lowerSource = source.toLowerCase();
  return interfaceMap[lowerSource] || 'any';
}

function mapToFortiGateAddress(source?: string): string {
  if (!source) {
    return 'all';
  }
  
  // Map common address names to FortiGate address objects
  const addressMap: Record<string, string> = {
    'internal': 'all',
    'dmz': 'all',
    'external': 'all',
    'any': 'all',
    '10.0.0.0/8': 'Internal-Network',
    '192.168.0.0/16': 'Internal-Network'
  };
  
  const lowerSource = source.toLowerCase();
  return addressMap[lowerSource] || source;
}

function mapToPaloAltoZone(source: string): string {
  const zoneMap: Record<string, string> = {
    'internal': 'trust',
    'dmz': 'dmz',
    'external': 'untrust',
    'any': 'any'
  };
  
  const lowerSource = source.toLowerCase();
  return zoneMap[lowerSource] || 'trust';
}

function mapToPaloAltoAddress(source: string): string {
  return source === 'any' ? 'any' : source;
}

function mapToCiscoAddress(source: string): string {
  return source === 'any' ? 'any' : source;
}
