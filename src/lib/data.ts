
type Policy = {
    id: string;
    name: string;
    source: string;
    destination: string;
    action: 'Allow' | 'Deny';
    status: 'Active' | 'Inactive';
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
    status: 'Inactive',
  },
  {
    id: 'POL-004',
    name: 'Allow SSH from Admin Workstations',
    source: 'Admin-Network',
    destination: 'Any',
    action: 'Allow',
    status: 'Active',
  },
];

const complianceReports = [
  {
    framework: 'PCI DSS',
    status: 'Compliant',
    lastAudit: '2024-05-20',
    coverage: 98,
  },
  {
    framework: 'HIPAA',
    status: 'Compliant',
    lastAudit: '2024-04-15',
    coverage: 100,
  },
  {
    framework: 'GDPR',
    status: 'Needs Review',
    lastAudit: '2024-06-01',
    coverage: 85,
  },
  {
    framework: 'ISO 27001',
    status: 'Non-Compliant',
    lastAudit: '2024-03-10',
    coverage: 60,
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

export function getRecentActivities() {
    return recentActivities;
}

export function addPolicy(policy: Omit<Policy, 'id'>) {
    const newId = `POL-${String(policies.length + 1).padStart(3, '0')}`;
    policies.unshift({ id: newId, ...policy });
    return policies;
}

export function updatePolicy(updatedPolicy: Policy) {
    policies = policies.map(p => p.id === updatedPolicy.id ? updatedPolicy : p);
    return policies;
}

export function deletePolicy(policyId: string) {
    policies = policies.filter(p => p.id !== policyId);
    return policies;
}
