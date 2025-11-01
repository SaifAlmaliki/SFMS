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
  srcintf: string;      // Source interface
  dstintf: string;     // Destination interface
  srcaddr: string;     // Source address
  dstaddr: string;     // Destination address
  action: 'accept' | 'deny';
  schedule: string;
  service: string;
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
  let service = 'ALL';
  if (genericPolicy.destPort) {
    service = `port-${genericPolicy.destPort}`;
  } else if (genericPolicy.port) {
    service = `port-${genericPolicy.port}`;
  }
  
  return {
    name: genericPolicy.name || `Policy-${Date.now()}`,
    srcintf: mapToFortiGateInterface(genericPolicy.source || genericPolicy.sourceIp),
    dstintf: mapToFortiGateInterface(genericPolicy.destination || genericPolicy.destinationIp),
    srcaddr: mapToFortiGateAddress(genericPolicy.source || genericPolicy.sourceIp),
    dstaddr: mapToFortiGateAddress(genericPolicy.destination || genericPolicy.destinationIp || genericPolicy.destinationFqdn),
    action: genericPolicy.action === 'Allow' ? 'accept' : 'deny',
    schedule: 'always',
    service: service,
    logtraffic: 'all',
    comments: genericPolicy.businessJustification || genericPolicy.description,
    destPort: genericPolicy.destPort || genericPolicy.port
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
function mapToFortiGateInterface(source: string): string {
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
  return interfaceMap[lowerSource] || 'internal';
}

function mapToFortiGateAddress(source: string): string {
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
