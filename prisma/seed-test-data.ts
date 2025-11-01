import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

/**
 * Seed test data for IT support tickets and audit reports
 */
async function main() {
  console.log('Seeding test IT support tickets and audit data...');

  // Create test VPN tickets from last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const vpnTickets = [
    {
      ticketNumber: 'TKT-VPN-001',
      requestedBy: 'user-001',
      title: 'VPN Access Required for Remote Work',
      description: 'I need VPN access to work from home. Please grant access to the corporate VPN.',
      status: 'Approved' as const,
      priority: 'High' as const,
      ticketType: 'VPN' as const,
      category: 'VPN Access Request',
      keywords: ['vpn', 'access', 'remote'],
      isNetworkRelated: true,
      createdAt: new Date(oneMonthAgo.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      ticketNumber: 'TKT-VPN-002',
      requestedBy: 'user-002',
      title: 'Need VPN Access for Production Server',
      description: 'Requesting VPN access to connect to production servers for maintenance.',
      status: 'Approved' as const,
      priority: 'High' as const,
      ticketType: 'VPN' as const,
      category: 'VPN Access Request',
      keywords: ['vpn', 'access', 'production'],
      isNetworkRelated: true,
      createdAt: new Date(oneMonthAgo.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      ticketNumber: 'TKT-VPN-003',
      requestedBy: 'user-003',
      title: 'VPN Certificate Expired',
      description: 'My VPN certificate has expired. Please renew it.',
      status: 'Deployed' as const,
      priority: 'Critical' as const,
      ticketType: 'VPN' as const,
      category: 'VPN Certificate',
      keywords: ['vpn', 'certificate', 'expired'],
      isNetworkRelated: true,
      createdAt: new Date(oneMonthAgo.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days ago
    },
    {
      ticketNumber: 'TKT-VPN-004',
      requestedBy: 'admin-001',
      title: 'VPN Setup for New Employee',
      description: 'Setting up VPN access for new team member John Doe.',
      status: 'Deployed' as const,
      priority: 'Medium' as const,
      ticketType: 'VPN' as const,
      category: 'VPN Setup',
      keywords: ['vpn', 'setup', 'new employee'],
      isNetworkRelated: true,
      createdAt: new Date(oneMonthAgo.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days ago
    },
  ];

  // Create test email tickets
  const emailTickets = [
    {
      ticketNumber: 'TKT-EMAIL-001',
      requestedBy: 'user-001',
      title: 'Outlook Not Working',
      description: 'Outlook is not connecting to the email server. Cannot send or receive emails.',
      status: 'Approved' as const,
      priority: 'High' as const,
      ticketType: 'Email' as const,
      category: 'Email Issue',
      keywords: ['outlook', 'not working', 'email'],
      isNetworkRelated: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      ticketNumber: 'TKT-EMAIL-002',
      requestedBy: 'user-004',
      title: 'Email Configuration on Mobile',
      description: 'Need to configure Outlook on my mobile device for work emails.',
      status: 'Deployed' as const,
      priority: 'Medium' as const,
      ticketType: 'Email' as const,
      category: 'Email Configuration',
      keywords: ['email', 'outlook', 'mobile', 'configuration'],
      isNetworkRelated: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
  ];

  // Create test network access tickets
  const networkTickets = [
    {
      ticketNumber: 'TKT-NET-001',
      requestedBy: 'user-005',
      title: 'WiFi Access Request',
      description: 'Need WiFi access in the new office building for my laptop.',
      status: 'PendingApproval' as const,
      priority: 'Medium' as const,
      ticketType: 'NetworkAccess' as const,
      category: 'Network Access Request',
      keywords: ['wifi', 'access', 'network'],
      isNetworkRelated: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ];

  // Create test policies with history
  const policies = [
    {
      id: 'POL-TEST-001',
      name: 'Allow HTTPS from Internal to DMZ',
      source: '10.0.0.0/8',
      destination: '192.0.2.0/24',
      destPort: 443,
      action: 'Allow' as const,
      status: 'Active' as const,
      vendor: 'fortigate',
      requestedBy: 'admin-001',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      id: 'POL-TEST-002',
      name: 'Block SSH from External',
      source: '0.0.0.0/0',
      destination: '10.0.0.0/8',
      destPort: 22,
      action: 'Deny' as const,
      status: 'Active' as const,
      vendor: 'fortigate',
      requestedBy: 'admin-002',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];

  // Create audit logs
  const auditLogs = [
    {
      userId: 'admin-001',
      action: 'policy_created',
      resource: 'Policy',
      resourceId: 'POL-TEST-001',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      userId: 'admin-001',
      action: 'ticket_approved',
      resource: 'ChangeTicket',
      resourceId: 'TKT-VPN-001',
      timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
    {
      userId: 'admin-002',
      action: 'policy_created',
      resource: 'Policy',
      resourceId: 'POL-TEST-002',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  // Insert tickets (skip if they exist)
  for (const ticket of [...vpnTickets, ...emailTickets, ...networkTickets]) {
    try {
      await prisma.changeTicket.upsert({
        where: { ticketNumber: ticket.ticketNumber },
        update: {},
        create: ticket,
      });
    } catch (error: any) {
      console.warn(`Ticket ${ticket.ticketNumber} already exists or error:`, error.message);
    }
  }

  // Insert policies (skip if they exist)
  for (const policy of policies) {
    try {
      await prisma.policy.upsert({
        where: { id: policy.id },
        update: {},
        create: policy,
      });
    } catch (error: any) {
      console.warn(`Policy ${policy.id} already exists or error:`, error.message);
    }
  }

  // Insert audit logs
  for (const log of auditLogs) {
    try {
      await prisma.auditLog.create({
        data: log,
      });
    } catch (error: any) {
      console.warn(`Audit log creation error:`, error.message);
    }
  }

  console.log('✅ Test data seeded successfully!');
  console.log(`   - ${vpnTickets.length} VPN tickets`);
  console.log(`   - ${emailTickets.length} Email tickets`);
  console.log(`   - ${networkTickets.length} Network tickets`);
  console.log(`   - ${policies.length} Policies`);
  console.log(`   - ${auditLogs.length} Audit logs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

