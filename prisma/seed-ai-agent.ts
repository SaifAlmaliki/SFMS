/**
 * Seed data for AI Agent features
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI Agent data...');

  // Create sample users with different roles
  const users = [
    { email: 'admin@firewall.local', name: 'Admin User', role: 'Admin' as const },
    { email: 'editor@firewall.local', name: 'Editor User', role: 'Editor' as const },
    { email: 'viewer@firewall.local', name: 'Viewer User', role: 'Viewer' as const },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log('✅ Users created');

  // Create sample chat conversations
  const conversations = [
    {
      userId: 'user-001',
      title: 'Firewall Configuration Help',
      messages: [
        {
          role: 'User',
          content: 'How do I create a firewall policy?',
        },
        {
          role: 'Assistant',
          content: 'You can create a firewall policy by describing what traffic you want to allow or deny. For example, "Allow HTTPS from internal to DMZ". Would you like me to help you create a policy?',
        },
      ],
    },
  ];

  for (const conv of conversations) {
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: conv.userId,
        title: conv.title,
        messages: {
          create: conv.messages.map(msg => ({
            role: msg.role as any,
            content: msg.content,
          })),
        },
      },
    });
  }
  console.log('✅ Conversations created');

  // Create sample change tickets
  const tickets = [
    {
      ticketNumber: 'TKT-000001',
      requestedBy: 'admin@firewall.local',
      title: 'Allow HTTPS from Internal Network to DMZ',
      description: 'Need to enable HTTPS traffic from internal network (10.0.0.0/8) to DMZ web servers (192.0.2.0/24)',
      status: 'PendingApproval' as const,
      priority: 'High' as const,
      policyId: null,
    },
    {
      ticketNumber: 'TKT-000002',
      requestedBy: 'editor@firewall.local',
      title: 'Block SSH from External Networks',
      description: 'Block SSH traffic (port 22) from external networks to internal servers',
      status: 'PendingApproval' as const,
      priority: 'Medium' as const,
      policyId: null,
    },
  ];

  // Create sample change tickets (skip if already exist)
  try {
    for (const ticket of tickets) {
      await prisma.changeTicket.create({
        data: ticket,
      });
    }
    console.log('✅ Change tickets created');
  } catch (error) {
    console.log('ℹ️ Change tickets already exist, skipping...');
  }

  // Generate sample firewall logs
  const sampleLogs = [];
  const devices = ['FW-Primary-DC1', 'FW-Secondary-DC1', 'FW-Branch-Office-A'];
  const protocols = ['TCP', 'UDP', 'ICMP'];
  const actions = ['Allow', 'Deny', 'Drop'];
  const severities = ['Info', 'Warning', 'Critical'];

  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
    
    sampleLogs.push({
      timestamp,
      sourceIp: `10.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      destIp: `192.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      sourcePort: Math.floor(Math.random() * 65535),
      destPort: [80, 443, 22, 3389, 8080][Math.floor(Math.random() * 5)],
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      action: actions[Math.floor(Math.random() * actions.length)] as any,
      deviceName: devices[Math.floor(Math.random() * devices.length)],
      severity: severities[Math.floor(Math.random() * severities.length)] as any,
      message: Math.random() > 0.7 ? 'Unusual traffic pattern detected' : null,
    });
  }

  await prisma.firewallLog.createMany({ data: sampleLogs });
  console.log('✅ Firewall logs created');

  // Create sample alerts
  const alerts = [
    {
      type: 'AnomalyDetected' as const,
      severity: 'High' as const,
      title: 'High Denial Rate Detected',
      description: 'Detected unusually high rate of connection denials (156 denials in 5 minutes)',
      source: 'Anomaly Detection System',
      status: 'Open' as const,
    },
    {
      type: 'PolicyViolation' as const,
      severity: 'Medium' as const,
      title: 'Unusual Traffic Pattern',
      description: 'Multiple connection attempts from unknown IP address 203.0.113.45',
      source: 'Firewall Logs',
      status: 'Open' as const,
    },
    {
      type: 'ThresholdExceeded' as const,
      severity: 'Low' as const,
      title: 'Traffic Volume Spike',
      description: 'Network traffic volume exceeded normal threshold by 25%',
      source: 'Monitoring System',
      status: 'Open' as const,
    },
  ];

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert });
  }
  console.log('✅ Alerts created');

  // Create FortiGate devices
  const fortigateDevices = [
    {
      name: 'FW-Primary-DC1',
      ip: '10.1.1.1',
      vendor: 'fortigate',
      model: 'FortiGate-100F',
      version: '7.0.5',
      apiKey: 'mock-api-key-12345',
      status: 'Active',
    },
    {
      name: 'FW-Secondary-DC1',
      ip: '10.1.1.2',
      vendor: 'fortigate',
      model: 'FortiGate-100F',
      version: '7.0.5',
      apiKey: 'mock-api-key-67890',
      status: 'Active',
    },
    {
      name: 'FW-Branch-Office-A',
      ip: '192.168.1.1',
      vendor: 'fortigate',
      model: 'FortiGate-60F',
      version: '7.0.4',
      apiKey: 'mock-api-key-branch',
      status: 'Active',
    },
  ];

  for (const device of fortigateDevices) {
    await prisma.device.updateMany({
      where: { name: device.name },
      data: device,
    });
  }
  console.log('✅ FortiGate devices created');

  // Create external ticket system configurations
  const externalSystems = [
    {
      name: 'servicenow',
      displayName: 'ServiceNow',
      isActive: false,
      config: {
        instanceUrl: 'https://your-instance.service-now.com',
        username: 'admin',
        password: 'password',
        tableName: 'change_request',
        apiVersion: 'v1'
      }
    },
    {
      name: 'jira',
      displayName: 'Jira',
      isActive: false,
      config: {
        baseUrl: 'https://your-domain.atlassian.net',
        username: 'user@company.com',
        apiToken: 'your-api-token',
        projectKey: 'PROJ',
        issueType: 'Task'
      }
    }
  ];

  for (const system of externalSystems) {
    await prisma.externalTicketSystem.upsert({
      where: { name: system.name },
      update: system,
      create: system,
    });
  }
  console.log('✅ External ticket systems created');

  // Create sample policies with history for testing duplicate detection
  const samplePolicies = [
    {
      id: 'POL-001',
      name: 'Database Access Policy',
      source: '10.1.1.5',
      destination: '192.168.1.10',
      destPort: 443,
      action: 'Allow',
      status: 'Active',
      businessJustification: 'Database access for reporting service',
      requestedBy: 'john.doe@company.com',
      approvedBy: 'admin@company.com',
      targetDevice: 'FW-Primary-DC1',
      sourceZone: 'internal',
      destinationZone: 'dmz',
      vendor: 'fortigate',
      rawConfig: {
        name: 'Database Access Policy',
        srcintf: 'internal',
        dstintf: 'dmz',
        srcaddr: '10.1.1.5',
        dstaddr: '192.168.1.10',
        action: 'accept',
        schedule: 'always',
        service: 'HTTPS',
        logtraffic: 'all'
      },
      cliConfig: 'config firewall policy\n  edit 0\n    set name "Database Access Policy"\n    set srcintf "internal"\n    set dstintf "dmz"\n    set srcaddr "10.1.1.5"\n    set dstaddr "192.168.1.10"\n    set action accept\n    set schedule "always"\n    set service "HTTPS"\n    set logtraffic all\n  next\nend'
    },
    {
      id: 'POL-002',
      name: 'API Service Access',
      source: '172.16.0.50',
      destination: 'api.example.com',
      destPort: 8080,
      action: 'Allow',
      status: 'PendingApproval',
      businessJustification: 'API integration for customer portal',
      requestedBy: 'jane.smith@company.com',
      targetDevice: 'FW-Primary-DC1',
      sourceZone: 'internal',
      destinationZone: 'external',
      vendor: 'fortigate',
      rawConfig: {
        name: 'API Service Access',
        srcintf: 'internal',
        dstintf: 'external',
        srcaddr: '172.16.0.50',
        dstaddr: 'api.example.com',
        action: 'accept',
        schedule: 'always',
        service: 'HTTP',
        logtraffic: 'all'
      },
      cliConfig: 'config firewall policy\n  edit 0\n    set name "API Service Access"\n    set srcintf "internal"\n    set dstintf "external"\n    set srcaddr "172.16.0.50"\n    set dstaddr "api.example.com"\n    set action accept\n    set schedule "always"\n    set service "HTTP"\n    set logtraffic all\n  next\nend'
    },
    {
      id: 'POL-003',
      name: 'Inactive Policy Example',
      source: '10.0.0.10',
      destination: '192.168.1.20',
      destPort: 22,
      action: 'Allow',
      status: 'Inactive',
      businessJustification: 'SSH access for maintenance',
      requestedBy: 'bob.wilson@company.com',
      approvedBy: 'admin@company.com',
      targetDevice: 'FW-Primary-DC1',
      sourceZone: 'internal',
      destinationZone: 'dmz',
      vendor: 'fortigate',
      rawConfig: {
        name: 'Inactive Policy Example',
        srcintf: 'internal',
        dstintf: 'dmz',
        srcaddr: '10.0.0.10',
        dstaddr: '192.168.1.20',
        action: 'accept',
        schedule: 'always',
        service: 'SSH',
        logtraffic: 'all'
      },
      cliConfig: 'config firewall policy\n  edit 0\n    set name "Inactive Policy Example"\n    set srcintf "internal"\n    set dstintf "dmz"\n    set srcaddr "10.0.0.10"\n    set dstaddr "192.168.1.20"\n    set action accept\n    set schedule "always"\n    set service "SSH"\n    set logtraffic all\n  next\nend'
    }
  ];

  for (const policy of samplePolicies) {
    await prisma.policy.upsert({
      where: { id: policy.id },
      update: policy,
      create: policy,
    });
  }
  console.log('✅ Sample policies created');

  // Create policy history entries
  const policyHistoryEntries = [
    // POL-001 history
    {
      policyId: 'POL-001',
      action: 'created',
      performedBy: 'john.doe@company.com',
      comment: 'Policy created via AI chat for database access',
      previousStatus: null,
      newStatus: 'PendingApproval'
    },
    {
      policyId: 'POL-001',
      action: 'approved',
      performedBy: 'admin@company.com',
      comment: 'Approved for production database access',
      previousStatus: 'PendingApproval',
      newStatus: 'Approved'
    },
    {
      policyId: 'POL-001',
      action: 'deployed',
      performedBy: 'admin@company.com',
      comment: 'Deployed to FW-Primary-DC1',
      previousStatus: 'Approved',
      newStatus: 'Active'
    },
    // POL-002 history
    {
      policyId: 'POL-002',
      action: 'created',
      performedBy: 'jane.smith@company.com',
      comment: 'Policy created for API integration',
      previousStatus: null,
      newStatus: 'PendingApproval'
    },
    // POL-003 history
    {
      policyId: 'POL-003',
      action: 'created',
      performedBy: 'bob.wilson@company.com',
      comment: 'Policy created for SSH access',
      previousStatus: null,
      newStatus: 'PendingApproval'
    },
    {
      policyId: 'POL-003',
      action: 'deactivated',
      performedBy: 'admin@company.com',
      comment: 'Deactivated: SSH access no longer needed',
      previousStatus: 'Active',
      newStatus: 'Inactive'
    }
  ];

  for (const history of policyHistoryEntries) {
    await prisma.policyHistory.create({
      data: history,
    });
  }
  console.log('✅ Policy history created');

  console.log('🎉 AI Agent data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

