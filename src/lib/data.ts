




export type UserRole = 'Administrator' | 'Editor' | 'Viewer';

export type Policy = {
    id: string;
    name: string;
    source: string;
    destination: string;
    action: 'Allow' | 'Deny';
    status: 'Active' | 'Inactive' | 'Pending Approval';
};

export type Snapshot = {
    version: string;
    comment: string;
    author: string;
    date: string;
    status: 'Live' | 'Archived';
};

export type Device = {
    name: string;
    ip: string;
};

export type AddressObject = {
    id: string;
    name: string;
    type: 'IP/Range' | 'FQDN' | 'Geography';
    value: string;
    description: string;
};

export type ServiceObject = {
    id: string;
    name: string;
    protocol: 'TCP' | 'UDP' | 'ICMP';
    portRange: string;
    description: string;
};

export type ObjectGroup = {
    id: string;
    name: string;
    type: 'Address' | 'Service';
    members: string[]; // Array of object IDs
    description: string;
};

export type PolicyTemplate = {
    id: string;
    name: string;
    description: string;
    category: 'Security' | 'Compliance' | 'Operations';
    policy: Partial<Omit<Policy, 'id' | 'name' | 'status'>>;
};


let policies: Policy[] = [
  {
    id: 'POL-001',
    name: 'Allow HTTP/HTTPS from Internal to DMZ',
    source: 'Internal-Network',
    destination: 'Web-Server-VIP',
    action: 'Allow',
    status: 'Active',
  },
  {
    id: 'POL-002',
    name: 'Block all traffic from Public to Internal',
    source: 'Public',
    destination: 'Internal-Network',
    action: 'Deny',
    status: 'Active',
  },
  {
    id: 'POL-003',
    name: 'Allow Database access from App Servers',
    source: 'App-Servers',
    destination: 'DB-Servers',
    action: 'Allow',
    status: 'Pending Approval',
  },
  {
    id: 'POL-004',
    name: 'Allow SSH from Admin Workstations',
    source: 'Admin-Network',
    destination: 'Any',
    action: 'Allow',
    status: 'Active',
  },
  {
    id: 'POL-005',
    name: 'Allow Jenkins to access Kubernetes',
    source: 'Jenkins-Server',
    destination: 'K8s-API',
    action: 'Allow',
    status: 'Inactive',
  }
];

let snapshots: Snapshot[] = [
    { version: 'v1.2.3', comment: 'Initial deployment after audit.', author: 'Alice', date: '2024-07-28', status: 'Live' },
    { version: 'v1.2.2', comment: 'Added rule for new staging server.', author: 'Bob', date: '2024-07-25', status: 'Archived' },
    { version: 'v1.2.1', comment: 'Emergency patch for CVE-2024-XXXX.', author: 'System', date: '2024-07-24', status: 'Archived' },
    { version: 'v1.2.0', comment: 'Quarterly rule cleanup.', author: 'Alice', date: '2024-07-20', status: 'Archived' },
];

const devices: Device[] = [
    { name: 'FW-Primary-DC1', ip: '10.1.1.1' },
    { name: 'FW-Secondary-DC1', ip: '10.1.1.2' },
    { name: 'FW-Branch-Office-A', ip: '192.168.1.1' },
    { name: 'FW-Cloud-VPC', ip: '172.16.0.1' },
    { name: 'FW-DMZ', ip: '10.100.1.5' },
  ];

const addressObjects: AddressObject[] = [
    { id: 'ADDR-001', name: 'Internal-Network', type: 'IP/Range', value: '10.0.0.0/8', description: 'Main internal corporate network.' },
    { id: 'ADDR-002', name: 'Web-Server-VIP', type: 'IP/Range', value: '192.0.2.10', description: 'Public VIP for web servers.' },
    { id: 'ADDR-003', name: 'google.com', type: 'FQDN', value: 'google.com', description: 'Google main domain.' },
    { id: 'ADDR-004', name: 'United-States-Geo', type: 'Geography', value: 'US', description: 'IP addresses geolocated to the USA.' },
];

const serviceObjects: ServiceObject[] = [
    { id: 'SVC-001', name: 'HTTP', protocol: 'TCP', portRange: '80', description: 'Standard HTTP port.' },
    { id: 'SVC-002', name: 'HTTPS', protocol: 'TCP', portRange: '443', description: 'Standard HTTPS port.' },
    { id: 'SVC-003', name: 'SSH', protocol: 'TCP', portRange: '22', description: 'Secure Shell access.' },
    { id: 'SVC-004', name: 'DNS', protocol: 'UDP', portRange: '53', description: 'Domain Name System.' },
];

const objectGroups: ObjectGroup[] = [
    { id: 'GRP-001', name: 'Web-Services', type: 'Service', members: ['SVC-001', 'SVC-002'], description: 'Group for all standard web protocols.' },
    { id: 'GRP-002', name: 'Allowed-Public-Sites', type: 'Address', members: ['ADDR-003'], description: 'Group of FQDNs for allowed public websites.' },
];

const policyTemplates: PolicyTemplate[] = [
    { id: 'TPL-001', name: 'Allow Web Access', description: 'Standard policy for allowing egress web traffic (HTTP/HTTPS).', category: 'Security', policy: { source: 'Internal-Network', destination: 'Any', action: 'Allow' } },
    { id: 'TPL-002', name: 'Block Risky Ports', description: 'Deny common risky protocols like Telnet and FTP from any source.', category: 'Security', policy: { source: 'Any', destination: 'Any', action: 'Deny' } },
    { id: 'TPL-003', name: 'PCI Compliance Baseline', description: 'Base policy to ensure traffic to cardholder data environment is blocked by default.', category: 'Compliance', policy: { source: 'Any', destination: 'PCI-Zone', action: 'Deny' } },
    { id: 'TPL-004', name: 'Allow Admin Access', description: 'Permit SSH and RDP from the dedicated admin network to any internal server.', category: 'Operations', policy: { source: 'Admin-Network', destination: 'Internal-Network', action: 'Allow' } },
];


const complianceControlData = {
    'PCI DSS': [
      { id: 'REQ-3.1', description: 'Data retention and disposal policies', status: 'Compliant' },
      { id: 'REQ-3.2', description: 'Do not store sensitive authentication data', status: 'Compliant' },
      { id: 'REQ-8.2', description: 'Strong cryptography and security protocols', status: 'Compliant' },
    ],
    'HIPAA': [
      { id: '164.312(a)(1)', description: 'Access Control', status: 'Compliant' },
      { id: '164.312(b)', description: 'Audit Controls', status: 'Compliant' },
      { id: '164.312(c)(1)', description: 'Integrity', status: 'Compliant' },
    ],
    'GDPR': [
      { id: 'Art. 5', description: 'Principles relating to processing of personal data', status: 'Compliant' },
      { id: 'Art. 25', description: 'Data protection by design and by default', status: 'Needs Review' },
      { id: 'Art. 32', description: 'Security of processing', status: 'Compliant' },
    ],
    'ISO 27001': [
      { id: 'A.5.1', description: 'Policies for information security', status: 'Compliant' },
      { id: 'A.8.1', description: 'Asset management', status: 'Non-Compliant' },
      { id: 'A.12.1', description: 'Operational procedures and responsibilities', status: 'Non-Compliant' },
      { id: 'A.14.1', description: 'Secure development policy', status: 'Compliant' },
    ],
  };

const complianceReports = [
  {
    framework: 'PCI DSS',
    status: 'Compliant',
    lastAudit: '2024-05-20',
    coverage: 98,
    controls: complianceControlData['PCI DSS'],
  },
  {
    framework: 'HIPAA',
    status: 'Compliant',
    lastAudit: '2024-04-15',
    coverage: 100,
    controls: complianceControlData['HIPAA'],
  },
  {
    framework: 'GDPR',
    status: 'Needs Review',
    lastAudit: '2024-06-01',
    coverage: 85,
    controls: complianceControlData['GDPR'],
  },
  {
    framework: 'ISO 27001',
    status: 'Non-Compliant',
    lastAudit: '2024-03-10',
    coverage: 60,
    controls: complianceControlData['ISO 27001'],
  },
];

const recentActivities = [
  { user: 'Alice', action: 'Created policy #4021', time: '5m ago' },
  { user: 'Bob', action: 'Updated device FW-Primary-DC1', time: '12m ago' },
  {
    user: 'System',
    action: 'Auto-healed misconfiguration on FW-Branch-Office-A',
    time: '1h ago',
  },
  { user: 'Charlie', action: 'Approved policy #4020', time: '3h ago' },
  { user: 'Alice', action: 'Generated policy from template', time: '5h ago' },
];

export function getPolicies() {
    return policies;
}

export function getPolicyTemplates() {
    return policyTemplates;
}

export function getSnapshots() {
    return snapshots;
}

export function getComplianceReports() {
    return complianceReports;
}

export function getComplianceReportByFramework(framework: string) {
    return complianceReports.find(report => report.framework.toLowerCase() === framework.toLowerCase());
}

export function getRecentActivities() {
    return recentActivities;
}

export function getDevices() {
    return devices;
}

export function getAddressObjects() {
    return addressObjects;
}

export function getServiceObjects() {
    return serviceObjects;
}

export function getObjectGroups() {
    return objectGroups;
}

export function addPolicy(policy: Omit<Policy, 'id'>) {
    const newId = `POL-${String(policies.length + 1).padStart(3, '0')}`;
    policies.unshift({ id: newId, ...policy });
    return policies;
}

export function updatePolicy(updatedPolicy: Partial<Policy> & { id: string }) {
    policies = policies.map(p => p.id === updatedPolicy.id ? { ...p, ...updatedPolicy } : p);
    return policies;
}

export function deletePolicy(policyId: string) {
    policies = policies.filter(p => p.id !== policyId);
    return policies;
}


// Snapshot Management
export function getSnapshotDiff(version: string): string {
    // This is a mock function. In a real app, you would compute a diff.
    return `
- name: Block all traffic from Public to Internal
  source: Public
  destination: Internal
  action: Deny
  status: Active
+ name: Block ALL traffic from Public to Internal
+  source: ANY-PUBLIC-ZONE
+  destination: Internal-Network
+  action: Deny
+  status: Active
+  log: true
- name: Allow SSH from Admin Workstations
+ name: Allow SSH from Admin Workstations (LOG)
   source: Admin-Network
   destination: Any
   action: Allow
   status: Active
+  log: true
  `;
  }
  

export function rollbackSnapshot(version: string) {
    snapshots = snapshots.map(s => {
        if (s.version === version) {
            return { ...s, status: 'Live' };
        }
        if (s.status === 'Live') {
            return { ...s, status: 'Archived' };
        }
        return s;
    });
    return snapshots;
}
