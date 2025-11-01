import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

// Ticket examples from user - categorized and with extracted keywords
const ticketExamples = [
  // Email Issues
  { title: 'Email ID Deletion and Addition Request', category: 'Email Management', type: 'Email', keywords: ['email', 'deletion', 'addition'], networkRelated: false },
  { title: 'Email not working', category: 'Email Issue', type: 'Email', keywords: ['email', 'not working', 'outlook'], networkRelated: false },
  { title: 'Mail Not working', category: 'Email Issue', type: 'Email', keywords: ['mail', 'not working'], networkRelated: false },
  { title: 'Emails are not working please check.', category: 'Email Issue', type: 'Email', keywords: ['emails', 'not working'], networkRelated: false },
  { title: 'Outlook mail is not working.', category: 'Email Issue', type: 'Email', keywords: ['outlook', 'mail', 'not working'], networkRelated: false },
  { title: 'Outlook mail need to configure', category: 'Email Configuration', type: 'Email', keywords: ['outlook', 'mail', 'configure'], networkRelated: false },
  { title: 'Request for Outlook configuration in my Mobile', category: 'Email Configuration', type: 'Email', keywords: ['outlook', 'configuration', 'mobile'], networkRelated: false },
  
  // VPN Issues
  { title: 'Unable to Connect VPN.', category: 'VPN Connection', type: 'VPN', keywords: ['vpn', 'unable', 'connect'], networkRelated: true },
  { title: 'Not able to connect with VPN', category: 'VPN Connection', type: 'VPN', keywords: ['vpn', 'not able', 'connect'], networkRelated: true },
  { title: 'Need VPN Access', category: 'VPN Access Request', type: 'VPN', keywords: ['vpn', 'access', 'need'], networkRelated: true },
  { title: 'VPN setup', category: 'VPN Setup', type: 'VPN', keywords: ['vpn', 'setup'], networkRelated: true },
  { title: 'VPN Installation', category: 'VPN Setup', type: 'VPN', keywords: ['vpn', 'installation'], networkRelated: true },
  { title: 'VPN Access Required', category: 'VPN Access Request', type: 'VPN', keywords: ['vpn', 'access', 'required'], networkRelated: true },
  { title: 'VPN certificate expired', category: 'VPN Certificate', type: 'VPN', keywords: ['vpn', 'certificate', 'expired'], networkRelated: true },
  { title: 'GVPN certificate got expired', category: 'VPN Certificate', type: 'VPN', keywords: ['gvpn', 'certificate', 'expired'], networkRelated: true },
  
  // Software Installation
  { title: 'Please install the requested software in my machine (WinSCP)', category: 'Software Installation', type: 'Software', keywords: ['install', 'software', 'winscp'], networkRelated: false },
  { title: 'Please install the requested software in my machine', category: 'Software Installation', type: 'Software', keywords: ['install', 'software'], networkRelated: false },
  { title: 'VS 2015 License required', category: 'Software License', type: 'Software', keywords: ['visual studio', 'license', '2015'], networkRelated: false },
  { title: 'Please install the requested software in my machine', category: 'Software Installation', type: 'Software', keywords: ['install', 'software'], networkRelated: false },
  
  // Hardware Requests
  { title: 'Please provide me a new laptop', category: 'Hardware Request', type: 'Hardware', keywords: ['new laptop', 'laptop'], networkRelated: false },
  { title: 'New Laptop Required', category: 'Hardware Request', type: 'Hardware', keywords: ['new laptop', 'required'], networkRelated: false },
  { title: 'Laptop replacement request', category: 'Hardware Request', type: 'Hardware', keywords: ['laptop', 'replacement'], networkRelated: false },
  { title: 'KeyBoard change /new required', category: 'Hardware Request', type: 'Hardware', keywords: ['keyboard', 'change'], networkRelated: false },
  { title: 'Mouse required', category: 'Hardware Request', type: 'Hardware', keywords: ['mouse', 'required'], networkRelated: false },
  { title: 'Headphone required', category: 'Hardware Request', type: 'Hardware', keywords: ['headphone', 'required'], networkRelated: false },
  
  // Access Requests
  { title: 'need admin access', category: 'Access Request', type: 'AdminAccess', keywords: ['admin', 'access'], networkRelated: false },
  { title: 'Admin Rights Required', category: 'Access Request', type: 'AdminAccess', keywords: ['admin', 'rights'], networkRelated: false },
  { title: 'Need Admin Access to deploy applications to IIS locally', category: 'Access Request', type: 'AdminAccess', keywords: ['admin', 'access', 'iis'], networkRelated: false },
  { title: 'Need access to JIRA', category: 'Access Request', type: 'AccessRequest', keywords: ['access', 'jira'], networkRelated: false },
  { title: 'Need access to Confluence', category: 'Access Request', type: 'AccessRequest', keywords: ['access', 'confluence'], networkRelated: false },
  
  // Application Issues
  { title: 'NAVISION not working', category: 'Application Issue', type: 'Software', keywords: ['navision', 'not working'], networkRelated: false },
  { title: 'Navision is not working.', category: 'Application Issue', type: 'Software', keywords: ['navision', 'not working'], networkRelated: false },
  { title: 'Excel not working', category: 'Application Issue', type: 'Software', keywords: ['excel', 'not working'], networkRelated: false },
  { title: 'Excel is not working properly', category: 'Application Issue', type: 'Software', keywords: ['excel', 'not working'], networkRelated: false },
  { title: 'MS Teams is not working', category: 'Application Issue', type: 'Software', keywords: ['teams', 'not working'], networkRelated: false },
  
  // Network Related
  { title: 'Not able to connect internet', category: 'Network Connectivity', type: 'NetworkAccess', keywords: ['internet', 'connect'], networkRelated: true },
  { title: 'Wifi not working', category: 'Network Connectivity', type: 'NetworkAccess', keywords: ['wifi', 'not working'], networkRelated: true },
  { title: 'Need Wifi Access for Noida office', category: 'Network Access Request', type: 'NetworkAccess', keywords: ['wifi', 'access'], networkRelated: true },
  { title: 'WIFI connectivity issue', category: 'Network Connectivity', type: 'NetworkAccess', keywords: ['wifi', 'connectivity'], networkRelated: true },
  
  // System Performance
  { title: 'Laptop is working slow', category: 'System Performance', type: 'Hardware', keywords: ['laptop', 'slow'], networkRelated: false },
  { title: 'system working slow', category: 'System Performance', type: 'Hardware', keywords: ['system', 'slow'], networkRelated: false },
  { title: 'Laptop hanging issue', category: 'System Performance', type: 'Hardware', keywords: ['laptop', 'hanging'], networkRelated: false },
  { title: 'System is hanging', category: 'System Performance', type: 'Hardware', keywords: ['system', 'hanging'], networkRelated: false },
  
  // Password/Account
  { title: 'Reset password', category: 'Password Reset', type: 'PasswordReset', keywords: ['password', 'reset'], networkRelated: false },
  { title: 'My XYXABClabs account locked', category: 'Account Issue', type: 'PasswordReset', keywords: ['account', 'locked'], networkRelated: false },
  
  // Group Email/Distribution List
  { title: 'Please create a new Group ID/distribution list', category: 'Email Management', type: 'Email', keywords: ['group', 'distribution list'], networkRelated: false },
  { title: 'Addition of your mail ID to groups', category: 'Email Management', type: 'Email', keywords: ['email', 'group', 'addition'], networkRelated: false },
  { title: 'Remove User from Group ID\'s', category: 'Email Management', type: 'Email', keywords: ['remove', 'user', 'group'], networkRelated: false },
];

async function main() {
  console.log('Seeding IT Support ticket knowledge base...');

  // Group tickets by category to calculate frequency
  const categoryFrequency: Record<string, number> = {};
  ticketExamples.forEach(ticket => {
    categoryFrequency[ticket.category] = (categoryFrequency[ticket.category] || 0) + 1;
  });

  // Create knowledge base entries
  const knowledgeBaseEntries = [];
  const processedCategories = new Set<string>();

  for (const ticket of ticketExamples) {
    const categoryKey = `${ticket.category}_${ticket.type}`;
    
    if (!processedCategories.has(categoryKey)) {
      processedCategories.add(categoryKey);
      
      // Find all tickets in this category
      const similarTickets = ticketExamples.filter(t => 
        t.category === ticket.category && t.type === ticket.type
      );
      
      // Extract common patterns
      const allKeywords = similarTickets.flatMap(t => t.keywords);
      const keywordFrequency: Record<string, number> = {};
      allKeywords.forEach(kw => {
        keywordFrequency[kw] = (keywordFrequency[kw] || 0) + 1;
      });
      
      const commonPatterns = {
        similarTitles: similarTickets.map(t => t.title),
        commonKeywords: Object.entries(keywordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([kw, freq]) => ({ keyword: kw, frequency: freq })),
        totalOccurrences: similarTickets.length,
      };

      knowledgeBaseEntries.push({
        title: ticket.category,
        description: `Common ${ticket.category} requests. Examples: ${similarTickets.slice(0, 3).map(t => t.title).join(', ')}`,
        category: ticket.category,
        ticketType: ticket.type,
        keywords: Array.from(new Set(allKeywords)).slice(0, 15),
        solution: ticket.category.includes('Issue') 
          ? 'Please check application status, restart services if needed, and verify user permissions.'
          : ticket.category.includes('Request')
          ? 'Request has been logged. IT team will process the request and notify you.'
          : null,
        commonPatterns: commonPatterns,
        frequency: similarTickets.length,
      });
    }
  }

  // Insert knowledge base entries
  for (const entry of knowledgeBaseEntries) {
    // Use a unique identifier based on category and type
    const uniqueKey = `${entry.category}_${entry.ticketType}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if entry exists by title and category
    const existing = await prisma.knowledgeBase.findFirst({
      where: {
        category: entry.category,
        ticketType: entry.ticketType,
      },
    });

    if (existing) {
      await prisma.knowledgeBase.update({
        where: { id: existing.id },
        data: {
          frequency: entry.frequency,
          commonPatterns: entry.commonPatterns,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.knowledgeBase.create({
        data: entry,
      });
    }
  }

  console.log(`✅ Seeded ${knowledgeBaseEntries.length} knowledge base entries`);
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

