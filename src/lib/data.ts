

export type UserRole = 'Administrator' | 'Editor' | 'Viewer';

export type Policy = {
    id: string;
    name: string;
    source: string;
    destination: string;
    action: 'Allow' | 'Deny';
    status: 'Active' | 'Inactive' | 'Pending Approval';
};

let policies: Policy[] = [
  {
    id: 'POL-001',
    name: 'Allow HTTP/HTTPS from Internal to DMZ',
    source: 'Internal',
    destination: 'DMZ',
    action: 'Allow',
    status: 'Active',
  },
  {
    id: 'POL-002',
    name: 'Block all traffic from Public to Internal',
    source: 'Public',
    destination: 'Internal',
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

export function getComplianceReports() {
    return complianceReports;
}

export function getComplianceReportByFramework(framework: string) {
    return complianceReports.find(report => report.framework.toLowerCase() === framework.toLowerCase());
}

export function getRecentActivities() {
    return recentActivities;
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
