import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.complianceControl.deleteMany();
  await prisma.complianceFramework.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.policyTemplate.deleteMany();
  await prisma.objectGroup.deleteMany();
  await prisma.serviceObject.deleteMany();
  await prisma.addressObject.deleteMany();
  await prisma.device.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.policy.deleteMany();

  // Seed Policies
  await prisma.policy.createMany({
    data: [
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
        status: 'PendingApproval',
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
    ]
  });

  // Seed Snapshots
  await prisma.snapshot.createMany({
    data: [
      { version: 'v1.2.3', comment: 'Initial deployment after audit.', author: 'Alice', date: new Date('2024-07-28'), status: 'Live' },
      { version: 'v1.2.2', comment: 'Added rule for new staging server.', author: 'Bob', date: new Date('2024-07-25'), status: 'Archived' },
      { version: 'v1.2.1', comment: 'Emergency patch for CVE-2024-XXXX.', author: 'System', date: new Date('2024-07-24'), status: 'Archived' },
      { version: 'v1.2.0', comment: 'Quarterly rule cleanup.', author: 'Alice', date: new Date('2024-07-20'), status: 'Archived' },
    ]
  });

  // Seed Devices
  await prisma.device.createMany({
    data: [
      { name: 'FW-Primary-DC1', ip: '10.1.1.1' },
      { name: 'FW-Secondary-DC1', ip: '10.1.1.2' },
      { name: 'FW-Branch-Office-A', ip: '192.168.1.1' },
      { name: 'FW-Cloud-VPC', ip: '172.16.0.1' },
      { name: 'FW-DMZ', ip: '10.100.1.5' },
    ]
  });

  // Seed Address Objects
  await prisma.addressObject.createMany({
    data: [
      { id: 'ADDR-001', name: 'Internal-Network', type: 'IPRange', value: '10.0.0.0/8', description: 'Main internal corporate network.' },
      { id: 'ADDR-002', name: 'Web-Server-VIP', type: 'IPRange', value: '192.0.2.10', description: 'Public VIP for web servers.' },
      { id: 'ADDR-003', name: 'google.com', type: 'FQDN', value: 'google.com', description: 'Google main domain.' },
      { id: 'ADDR-004', name: 'United-States-Geo', type: 'Geography', value: 'US', description: 'IP addresses geolocated to the USA.' },
    ]
  });

  // Seed Service Objects
  await prisma.serviceObject.createMany({
    data: [
      { id: 'SVC-001', name: 'HTTP', protocol: 'TCP', portRange: '80', description: 'Standard HTTP port.' },
      { id: 'SVC-002', name: 'HTTPS', protocol: 'TCP', portRange: '443', description: 'Standard HTTPS port.' },
      { id: 'SVC-003', name: 'SSH', protocol: 'TCP', portRange: '22', description: 'Secure Shell access.' },
      { id: 'SVC-004', name: 'DNS', protocol: 'UDP', portRange: '53', description: 'Domain Name System.' },
    ]
  });

  // Seed Object Groups
  await prisma.objectGroup.createMany({
    data: [
      { id: 'GRP-001', name: 'Web-Services', type: 'Service', members: ['SVC-001', 'SVC-002'], description: 'Group for all standard web protocols.' },
      { id: 'GRP-002', name: 'Allowed-Public-Sites', type: 'Address', members: ['ADDR-003'], description: 'Group of FQDNs for allowed public websites.' },
    ]
  });

  // Seed Policy Templates
  await prisma.policyTemplate.createMany({
    data: [
      { 
        id: 'TPL-001', 
        name: 'Allow Web Access', 
        description: 'Standard policy for allowing egress web traffic (HTTP/HTTPS).', 
        category: 'Security', 
        policy: { source: 'Internal-Network', destination: 'Any', action: 'Allow' } 
      },
      { 
        id: 'TPL-002', 
        name: 'Block Risky Ports', 
        description: 'Deny common risky protocols like Telnet and FTP from any source.', 
        category: 'Security', 
        policy: { source: 'Any', destination: 'Any', action: 'Deny' } 
      },
      { 
        id: 'TPL-003', 
        name: 'PCI Compliance Baseline', 
        description: 'Base policy to ensure traffic to cardholder data environment is blocked by default.', 
        category: 'Compliance', 
        policy: { source: 'Any', destination: 'PCI-Zone', action: 'Deny' } 
      },
      { 
        id: 'TPL-004', 
        name: 'Allow Admin Access', 
        description: 'Permit SSH and RDP from the dedicated admin network to any internal server.', 
        category: 'Operations', 
        policy: { source: 'Admin-Network', destination: 'Internal-Network', action: 'Allow' } 
      },
    ]
  });

  // Seed Compliance Frameworks
  const pciFramework = await prisma.complianceFramework.create({
    data: {
      name: 'PCI DSS',
      status: 'Compliant',
      lastAudit: new Date('2024-05-20'),
      coverage: 98,
    }
  });

  const hipaaFramework = await prisma.complianceFramework.create({
    data: {
      name: 'HIPAA',
      status: 'Compliant',
      lastAudit: new Date('2024-04-15'),
      coverage: 100,
    }
  });

  const gdprFramework = await prisma.complianceFramework.create({
    data: {
      name: 'GDPR',
      status: 'NeedsReview',
      lastAudit: new Date('2024-06-01'),
      coverage: 85,
    }
  });

  const isoFramework = await prisma.complianceFramework.create({
    data: {
      name: 'ISO 27001',
      status: 'NonCompliant',
      lastAudit: new Date('2024-03-10'),
      coverage: 60,
    }
  });

  // Seed Compliance Controls
  await prisma.complianceControl.createMany({
    data: [
      // PCI DSS Controls
      { controlId: 'REQ-3.1', description: 'Data retention and disposal policies', status: 'Compliant', frameworkId: pciFramework.id },
      { controlId: 'REQ-3.2', description: 'Do not store sensitive authentication data', status: 'Compliant', frameworkId: pciFramework.id },
      { controlId: 'REQ-8.2', description: 'Strong cryptography and security protocols', status: 'Compliant', frameworkId: pciFramework.id },
      
      // HIPAA Controls
      { controlId: '164.312(a)(1)', description: 'Access Control', status: 'Compliant', frameworkId: hipaaFramework.id },
      { controlId: '164.312(b)', description: 'Audit Controls', status: 'Compliant', frameworkId: hipaaFramework.id },
      { controlId: '164.312(c)(1)', description: 'Integrity', status: 'Compliant', frameworkId: hipaaFramework.id },
      
      // GDPR Controls
      { controlId: 'Art. 5', description: 'Principles relating to processing of personal data', status: 'Compliant', frameworkId: gdprFramework.id },
      { controlId: 'Art. 25', description: 'Data protection by design and by default', status: 'NeedsReview', frameworkId: gdprFramework.id },
      { controlId: 'Art. 32', description: 'Security of processing', status: 'Compliant', frameworkId: gdprFramework.id },
      
      // ISO 27001 Controls
      { controlId: 'A.5.1', description: 'Policies for information security', status: 'Compliant', frameworkId: isoFramework.id },
      { controlId: 'A.8.1', description: 'Asset management', status: 'NonCompliant', frameworkId: isoFramework.id },
      { controlId: 'A.12.1', description: 'Operational procedures and responsibilities', status: 'NonCompliant', frameworkId: isoFramework.id },
      { controlId: 'A.14.1', description: 'Secure development policy', status: 'Compliant', frameworkId: isoFramework.id },
    ]
  });

  // Seed Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { user: 'Alice', action: 'Created policy #4021', timestamp: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes ago
      { user: 'Bob', action: 'Updated device FW-Primary-DC1', timestamp: new Date(Date.now() - 12 * 60 * 1000) }, // 12 minutes ago
      { user: 'System', action: 'Auto-healed misconfiguration on FW-Branch-Office-A', timestamp: new Date(Date.now() - 60 * 60 * 1000) }, // 1 hour ago
      { user: 'Charlie', action: 'Approved policy #4020', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) }, // 3 hours ago
      { user: 'Alice', action: 'Generated policy from template', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) }, // 5 hours ago
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
