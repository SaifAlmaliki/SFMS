
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

// Temporary sync versions for client components (will be replaced with proper data fetching)
let cachedAddressObjects: AddressObject[] = [
    { id: 'ADDR-001', name: 'Internal-Network', type: 'IP/Range', value: '10.0.0.0/8', description: 'Main internal corporate network.' },
    { id: 'ADDR-002', name: 'Web-Server-VIP', type: 'IP/Range', value: '192.0.2.10', description: 'Public VIP for web servers.' },
    { id: 'ADDR-003', name: 'google.com', type: 'FQDN', value: 'google.com', description: 'Google main domain.' },
    { id: 'ADDR-004', name: 'United-States-Geo', type: 'Geography', value: 'US', description: 'IP addresses geolocated to the USA.' },
];

let cachedObjectGroups: ObjectGroup[] = [
    { id: 'GRP-001', name: 'Web-Services', type: 'Service', members: ['SVC-001', 'SVC-002'], description: 'Group for all standard web protocols.' },
    { id: 'GRP-002', name: 'Allowed-Public-Sites', type: 'Address', members: ['ADDR-003'], description: 'Group of FQDNs for allowed public websites.' },
];

let cachedDevices: Device[] = [
    { name: 'FW-Primary-DC1', ip: '10.1.1.1' },
    { name: 'FW-Secondary-DC1', ip: '10.1.1.2' },
    { name: 'FW-Branch-Office-A', ip: '192.168.1.1' },
    { name: 'FW-Cloud-VPC', ip: '172.16.0.1' },
    { name: 'FW-DMZ', ip: '10.100.1.5' },
];

// Sync versions for client components (these will return cached data)
export function getAddressObjectsSync(): AddressObject[] {
    return cachedAddressObjects;
}

export function getObjectGroupsSync(): ObjectGroup[] {
    return cachedObjectGroups;
}

export function getDevicesSync(): Device[] {
    return cachedDevices;
}


// All mocked data has been migrated to PostgreSQL database

export async function getPolicies(syncFromFortiGate: boolean = true, onlyRealPolicies: boolean = false) {
    // NOTE: Sync functionality has been moved to a separate server action
    // to prevent webpack from bundling server-only code into client components.
    // If you need to sync policies, call the sync action separately before calling getPolicies.
    // The syncFromFortiGate parameter is kept for backward compatibility but does nothing.
    
    const whereClause = onlyRealPolicies 
      ? { vendorId: { not: null } } // Only policies that exist in FortiGate
      : {};
    
    const policies = await prisma.policy.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
    });
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
    const snapshots = await prisma.snapshot.findMany();
    return snapshots.map(s => ({
        ...s,
        date: s.date.toISOString().split('T')[0] // Convert Date to string (YYYY-MM-DD)
    }));
}

export async function getComplianceReports() {
    try {
        const frameworks = await prisma.complianceFramework.findMany({
            include: {
                controls: {
                    include: {
                        results: {
                            orderBy: { evaluatedAt: 'desc' },
                            take: 1
                        }
                    }
                },
                evaluations: true
            }
        });
        
        return frameworks.map(framework => {
            // Use live evaluation data if available, otherwise fall back to static data
            const liveEvaluation = framework.evaluations;
            const status = liveEvaluation 
                ? (liveEvaluation.status === 'NeedsReview' ? 'Needs Review' : 
                   liveEvaluation.status === 'NonCompliant' ? 'Non-Compliant' : 'Compliant')
                : (framework.status === 'NeedsReview' ? 'Needs Review' : 
                   framework.status === 'NonCompliant' ? 'Non-Compliant' : 'Compliant');
            
            const lastAudit = liveEvaluation && liveEvaluation.lastAudit
                ? liveEvaluation.lastAudit.toISOString().split('T')[0]
                : framework.lastAudit ? framework.lastAudit.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                
            const coverage = liveEvaluation ? liveEvaluation.coverage : (framework.coverage || 0);

            return {
                framework: framework.name,
                status,
                lastAudit,
                coverage,
                controls: (framework.controls || []).map(control => {
                    const latestResult = control.results?.[0];
                    return {
                        id: control.controlId,
                        description: control.description || '',
                        status: latestResult 
                            ? (latestResult.status === 'NeedsReview' ? 'Needs Review' : 
                               latestResult.status === 'NonCompliant' ? 'Non-Compliant' : 'Compliant')
                            : (control.status === 'NeedsReview' ? 'Needs Review' : 
                               control.status === 'NonCompliant' ? 'Non-Compliant' : 'Compliant'),
                        lastEvaluated: latestResult?.evaluatedAt?.toISOString().split('T')[0] || null,
                        details: latestResult?.details || null
                    };
                })
            };
        });
    } catch (error: any) {
        console.error('Error in getComplianceReports:', error);
        throw error;
    }
}

export async function getComplianceReportByFramework(framework: string) {
    const reports = await getComplianceReports();
    return reports.find(report => report.framework.toLowerCase() === framework.toLowerCase());
}

export async function getRecentActivities() {
    const activities = await prisma.activityLog.findMany({
        orderBy: {
            timestamp: 'desc'
        },
        take: 10
    });
    
    return activities.map(activity => ({
        user: activity.user,
        action: activity.action,
        time: formatTimeAgo(activity.timestamp)
    }));
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else {
        return `${diffDays}d ago`;
    }
}

// Helper function to log user activities
export async function logActivity(user: string, action: string) {
    await prisma.activityLog.create({
        data: {
            user,
            action,
            timestamp: new Date()
        }
    });
}

export async function getDevices() {
    return await prisma.device.findMany();
}

export async function getAddressObjects() {
    const objects = await prisma.addressObject.findMany();
    return objects.map(obj => ({
        ...obj,
        type: (obj.type === 'IPRange' ? 'IP/Range' : obj.type) as 'IP/Range' | 'FQDN' | 'Geography'
    }));
}

export async function getServiceObjects() {
    return await prisma.serviceObject.findMany();
}

export async function getObjectGroups() {
    const groups = await prisma.objectGroup.findMany();
    return groups.map(group => ({
        ...group,
        type: group.type as 'Address' | 'Service'
    }));
}

export async function addPolicy(policy: Omit<Policy, 'id'>, user: string = 'System') {
    const count = await prisma.policy.count();
    const newId = `POL-${String(count + 1).padStart(3, '0')}`;
    const createdPolicy = await prisma.policy.create({ 
        data: { 
            ...policy, 
            id: newId,
            status: convertStatusToPrisma(policy.status) as any,
            action: policy.action as any
        } 
    });
    
    // Log the activity
    await logActivity(user, `Created policy ${newId}: ${policy.name}`);
    
    return [{
        ...createdPolicy,
        status: convertStatusFromPrisma(createdPolicy.status)
    }];
}

export async function updatePolicy(updatedPolicy: Partial<Policy> & { id: string }, user: string = 'System') {
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
    
    // Log the activity
    await logActivity(user, `Updated policy ${id}`);
    
    return await getPolicies();
}

export async function deletePolicy(policyId: string, user: string = 'System') {
    // Delete related records first (due to foreign key constraints)
    // Delete PolicyDeployment records
    await prisma.policyDeployment.deleteMany({
        where: { policyId },
    });
    
    // Delete PolicyHistory records (these have cascade delete, but being explicit)
    await prisma.policyHistory.deleteMany({
        where: { policyId },
    });
    
    // Now delete the policy
    await prisma.policy.delete({ where: { id: policyId } });
    
    // Log the activity
    await logActivity(user, `Deleted policy ${policyId}`);
    
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
