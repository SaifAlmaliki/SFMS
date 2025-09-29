
// src/lib/data.ts

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export type UserRole = 'Administrator' | 'Editor' | 'Viewer';

export type Policy = {
    id: string;
    name: string;
    source: string;
    destination: string;
    action: 'Allow' | 'Deny';
    status: 'Active' | 'Inactive' | 'Pending Approval';
};

// Helper function to convert UI status to Prisma enum
function convertStatusToPrisma(status: 'Active' | 'Inactive' | 'Pending Approval') {
    switch (status) {
        case 'Pending Approval':
            return 'PendingApproval';
        default:
            return status;
    }
}

// Helper function to convert Prisma enum to UI status
function convertStatusFromPrisma(status: string): 'Active' | 'Inactive' | 'Pending Approval' {
    switch (status) {
        case 'PendingApproval':
            return 'Pending Approval';
        default:
            return status as 'Active' | 'Inactive';
    }
}

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


// All data now comes from the database via Prisma


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

export async function getPolicies() {
    const policies = await prisma.policy.findMany();
    return policies.map(p => ({
        ...p,
        status: convertStatusFromPrisma(p.status)
    }));
}

export async function getPolicyTemplates() {
    const templates = await prisma.policyTemplate.findMany();
    return templates.map(t => ({ ...t, policy: t.policy as any }));
}

export async function getSnapshots() {
    return await prisma.snapshot.findMany();
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

export async function getDevices() {
    return await prisma.device.findMany();
}

export async function getAddressObjects() {
    return await prisma.addressObject.findMany();
}

export async function getServiceObjects() {
    return await prisma.serviceObject.findMany();
}

export async function getObjectGroups() {
    return await prisma.objectGroup.findMany();
}

export async function addPolicy(policy: Omit<Policy, 'id'>) {
    const count = await prisma.policy.count();
    const newId = `POL-${String(count + 1).padStart(3, '0')}`;
    await prisma.policy.create({ 
        data: { 
            ...policy, 
            id: newId,
            status: convertStatusToPrisma(policy.status) as any,
            action: policy.action as any
        } 
    });
    return await getPolicies();
}

export async function updatePolicy(updatedPolicy: Partial<Policy> & { id: string }) {
    const { id, ...updateData } = updatedPolicy;
    const prismaData: any = { ...updateData };
    
    if (updateData.status) {
        prismaData.status = convertStatusToPrisma(updateData.status);
    }
    if (updateData.action) {
        prismaData.action = updateData.action;
    }
    
    await prisma.policy.update({
        where: { id },
        data: prismaData,
    });
    return await getPolicies();
}

export async function deletePolicy(policyId: string) {
    await prisma.policy.delete({ where: { id: policyId } });
    return await getPolicies();
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
  

export async function rollbackSnapshot(version: string) {
    // Update status
    await prisma.snapshot.updateMany({
        where: { status: 'Live' },
        data: { status: 'Archived' },
    });
    await prisma.snapshot.update({
        where: { version },
        data: { status: 'Live' },
    });
    return await getSnapshots();
}
