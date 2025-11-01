/**
 * @fileOverview Enhanced AI chatbot for firewall management with FortiGate-specific support
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PrismaClient } from '../../generated/prisma';
import { getVendorById, getDefaultVendor, convertToVendorFormat, validatePolicy, AVAILABLE_VENDORS, type FirewallVendor } from '@/lib/firewall-vendors';
import { ExternalTicketService } from '@/lib/external-ticket-service';
import { PolicyRequestParser } from '@/lib/policy-parser';
import { PolicyMatcherService } from '@/lib/policy-matcher';

const prisma = new PrismaClient();

const FirewallChatAgentInputSchema = z.object({
  query: z.string().describe('The user\'s natural language query or request'),
  userId: z.string().describe('The ID of the user making the request'),
  conversationId: z.string().optional().describe('Optional conversation ID for context'),
  vendor: z.string().optional().describe('Firewall vendor (fortigate, paloalto, cisco)'),
  externalSystem: z.string().optional().describe('External ticket system (servicenow, jira)'),
});

export type FirewallChatAgentInput = z.infer<typeof FirewallChatAgentInputSchema>;

const FirewallChatAgentOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response'),
  conversationId: z.string().describe('The conversation ID for maintaining context'),
  ticketCreated: z.boolean().optional().describe('Whether a change ticket was created'),
  ticketId: z.string().optional().describe('The ID of the created ticket, if applicable'),
  policyGenerated: z.boolean().optional().describe('Whether a policy was generated'),
  vendor: z.string().optional().describe('The firewall vendor used'),
  cliConfig: z.string().optional().describe('Vendor-specific CLI configuration'),
  externalTicketCreated: z.boolean().optional().describe('Whether an external ticket was created'),
  externalTicketId: z.string().optional().describe('The external ticket ID'),
  externalTicketUrl: z.string().optional().describe('The external ticket URL'),
  duplicateFound: z.boolean().optional().describe('Whether duplicate policies were found'),
  matchedPolicies: z.array(z.any()).optional().describe('Matched existing policies'),
  missingJustification: z.boolean().optional().describe('Whether business justification is missing'),
  parsedRequest: z.any().optional().describe('Parsed policy request details'),
});

export type FirewallChatAgentOutput = z.infer<typeof FirewallChatAgentOutputSchema>;

/**
 * Check if user query is requesting a policy creation
 */
function isPolicyRequest(query: string): boolean {
  const policyKeywords = [
    'create policy',
    'add policy',
    'new policy',
    'allow traffic',
    'block traffic',
    'firewall rule',
    'policy from',
    'policy to',
    'allow',
    'deny',
    'block',
    'permit',
    'from',
    'to',
    'port',
    'protocol'
  ];
  
  const lowerQuery = query.toLowerCase();
  return policyKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Check if user query is requesting to list/view policies
 */
function isListPoliciesRequest(query: string): boolean {
  const listKeywords = [
    'list policies',
    'show policies',
    'view policies',
    'get policies',
    'what policies',
    'all policies',
    'existing policies',
    'current policies',
    'list all policies',
    'show all policies',
    'what are the policies',
    'display policies',
    'policies list'
  ];
  
  const lowerQuery = query.toLowerCase();
  return listKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Format policies for display with comprehensive details
 */
function formatPoliciesList(policies: any[]): string {
  if (policies.length === 0) {
    return 'No policies found in the database.';
  }

  // Group policies by status
  const activePolicies = policies.filter(p => p.status === 'Active');
  const inactivePolicies = policies.filter(p => p.status === 'Inactive');
  const pendingPolicies = policies.filter(p => p.status === 'PendingApproval');
  const rejectedPolicies = policies.filter(p => p.status === 'Rejected');

  // Start with summary first for better readability
  let formatted = `SUMMARY\n`;
  formatted += `═══════════════════════════════════════════\n`;
  formatted += `Total Policies: ${policies.length}\n`;
  if (activePolicies.length > 0) {
    formatted += `Active: ${activePolicies.length} (${activePolicies.map(p => p.id).join(', ')})\n`;
  }
  if (pendingPolicies.length > 0) {
    formatted += `Pending Approval: ${pendingPolicies.length} (${pendingPolicies.map(p => p.id).join(', ')})\n`;
  }
  if (inactivePolicies.length > 0) {
    formatted += `Inactive: ${inactivePolicies.length} (${inactivePolicies.map(p => p.id).join(', ')})\n`;
  }
  if (rejectedPolicies.length > 0) {
    formatted += `Rejected: ${rejectedPolicies.length} (${rejectedPolicies.map(p => p.id).join(', ')})\n`;
  }
  formatted += `\n═══════════════════════════════════════════\n`;
  formatted += `POLICY DETAILS\n`;
  formatted += `═══════════════════════════════════════════\n\n`;
  
  policies.forEach((policy, index) => {
    formatted += `${index + 1}. Policy ${policy.id}\n`;
    formatted += `   ${policy.name}\n\n`;
    formatted += `   Source: ${policy.source}\n`;
    formatted += `   Destination: ${policy.destination}:${policy.destPort || 'Any'}\n`;
    formatted += `   Action: ${policy.action}\n`;
    formatted += `   Status: ${policy.status}\n`;
    if (policy.vendor) {
      formatted += `   Vendor: ${policy.vendor}\n`;
    }
    if (policy.targetDevice) {
      formatted += `   Target Device: ${policy.targetDevice}\n`;
    }
    if (policy.sourceZone || policy.destinationZone) {
      formatted += `   Zones: ${policy.sourceZone || 'N/A'} → ${policy.destinationZone || 'N/A'}\n`;
    }
    if (policy.requestedBy) {
      formatted += `   Requested By: ${policy.requestedBy}\n`;
    }
    if (policy.approvedBy) {
      formatted += `   Approved By: ${policy.approvedBy}\n`;
    }
    if (policy.businessJustification) {
      formatted += `   Business Justification: ${policy.businessJustification}\n`;
    }
    formatted += `   Created: ${new Date(policy.createdAt).toLocaleDateString()} at ${new Date(policy.createdAt).toLocaleTimeString()}\n`;
    if (policy.updatedAt && policy.updatedAt !== policy.createdAt) {
      formatted += `   Last Updated: ${new Date(policy.updatedAt).toLocaleDateString()}\n`;
    }
    formatted += `\n`;
  });

  return formatted;
}

/**
 * Parse policy request and extract details
 */
function parsePolicyRequest(query: string): {
  action: 'Allow' | 'Deny';
  source: string;
  destination: string;
  name: string;
} | null {
  // Simple parser - can be enhanced with more sophisticated NLP
  const lowerQuery = query.toLowerCase();
  
  let action: 'Allow' | 'Deny' = 'Allow';
  if (lowerQuery.includes('block') || lowerQuery.includes('deny') || lowerQuery.includes('prevent')) {
    action = 'Deny';
  }
  
  // Extract source (simple pattern matching)
  const sourceMatch = query.match(/from\s+([A-Za-z0-9\s-]+?)(?:\s+to|\s+allow|\s+block|$)/i);
  const destMatch = query.match(/to\s+([A-Za-z0-9\s-]+?)(?:\s+allow|\s+block|$)/i);
  
  const source = sourceMatch ? sourceMatch[1].trim() : 'Unknown';
  const destination = destMatch ? destMatch[1].trim() : 'Unknown';
  
  // Generate name
  const name = `${action} Traffic ${source} to ${destination}`.substring(0, 100);
  
  return { action, source, destination, name };
}

export async function firewallChatAgent(input: FirewallChatAgentInput): Promise<FirewallChatAgentOutput> {
  const { query, userId, conversationId, vendor = 'fortigate', externalSystem } = input;
  
  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conversation = await prisma.chatConversation.create({
      data: {
        userId,
        title: query.substring(0, 50),
        messages: {
          create: {
            role: 'User',
            content: query,
          },
        },
      },
    });
    convId = conversation.id;
  } else {
    // Add user message to existing conversation
    await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        role: 'User',
        content: query,
      },
    });
  }

  // Get conversation history
  const history = await prisma.chatMessage.findMany({
    where: { conversationId: convId },
    orderBy: { timestamp: 'asc' },
    take: 10, // Last 10 messages for context
  });

  // Check if this is a policy request or list request
  const shouldCreatePolicy = isPolicyRequest(query);
  const shouldListPolicies = isListPoliciesRequest(query);
  let parsedRequest: any = null;
  let duplicateFound = false;
  let matchedPolicies: any[] = [];
  let missingJustification = false;
  let policiesList: any[] = [];
  
  let ticketId: string | undefined;
  let ticketCreated = false;
  let policyGenerated = false;
  let cliConfig: string | undefined;
  let externalTicketCreated = false;
  let externalTicketId: string | undefined;
  let externalTicketUrl: string | undefined;

  // Check if user wants to list policies
  if (shouldListPolicies) {
    try {
      policiesList = await prisma.policy.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to 50 most recent policies
      });
    } catch (error) {
      console.error('Error fetching policies:', error);
      policiesList = [];
    }
  }

  // Parse policy request if needed
  if (shouldCreatePolicy) {
    const parseResult = PolicyRequestParser.parse(query);
    if (parseResult.success) {
      parsedRequest = parseResult.data;
      missingJustification = !parsedRequest.businessJustification;
      
      // Check for duplicates
      const policyMatcher = new PolicyMatcherService();
      const matchResult = await policyMatcher.findExactMatches(parsedRequest);
      
      if (matchResult.hasMatch) {
        duplicateFound = true;
        matchedPolicies = matchResult.matchedPolicies;
      }
    }
  }

  // Get vendor configuration for enhanced context
  const vendorConfig = getVendorById(vendor) || getDefaultVendor();
  
  // Build context for AI with vendor-specific information
  let systemContext = `You are an expert firewall administrator assistant helping users manage ${vendorConfig.displayName} (${vendor.toUpperCase()}) firewall policies.
You have deep knowledge of ${vendorConfig.displayName} configuration syntax, CLI commands, and best practices.
${vendorConfig.id === 'fortigate' ? `FortiGate policies use CLI syntax like "config firewall policy" with fields: srcintf, dstintf, srcaddr, dstaddr, action (accept/deny), service (port numbers or service names), schedule, and logtraffic.` : ''}
${vendorConfig.id === 'paloalto' ? `Palo Alto policies use XML-based configuration with zones (from/to), source/destination addresses, applications, services, and actions (allow/deny).` : ''}
${vendorConfig.id === 'cisco' ? `Cisco ASA policies use access-list commands with permit/deny actions, protocols, source/destination addresses, and port specifications.` : ''}
You can help create policies, answer questions about firewall configurations, and provide security recommendations.
Be concise and helpful.`;

  // Add policy list context if user requested it
  if (shouldListPolicies) {
    if (policiesList.length > 0) {
      systemContext += `\n\nIMPORTANT: The user is asking to view/list existing policies. Here are ALL the policies from the database with FULL DETAILS:\n\n${formatPoliciesList(policiesList)}\n\nRESPONSE REQUIRED: Format your response with clear sections. Start with the summary, then list each policy with clear spacing between policies. Use proper line breaks and formatting so each policy is easily readable. Include ALL details for each policy: Policy ID, Name, Source, Destination:Port, Action, Status, Vendor, Requested By, Business Justification, and Created date. Make sure to use line breaks (\n) between policies so the response is well-formatted and easy to read.`;
    } else {
      systemContext += `\n\nIMPORTANT: The user is asking to view existing policies, but no policies were found in the database.\n\nRESPONSE REQUIRED: Inform the user that no policies are currently in the database and offer to help create one.`;
    }
  } else if (shouldCreatePolicy && parsedRequest) {
    if (duplicateFound && matchedPolicies && matchedPolicies.length > 0) {
      const firstPolicy = matchedPolicies[0];
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy, but a DUPLICATE POLICY WAS FOUND.

EXISTING POLICY:
- Policy ID: ${firstPolicy.id}
- Source: ${firstPolicy.source}
- Destination: ${firstPolicy.destination}:${firstPolicy.destPort}
- Status: ${firstPolicy.status}
- Created by: ${firstPolicy.requestedBy || 'Unknown'}
- Business Justification: ${firstPolicy.businessJustification || 'N/A'}

${matchedPolicies.length > 1 ? `Note: ${matchedPolicies.length} total matching policies found.` : ''}

RESPONSE REQUIRED: Give a brief, concise response informing the user that a similar policy already exists. Mention the policy ID (${firstPolicy.id}) and ask if they still wish to proceed. DO NOT repeat all the policy details in your response - those will be shown in a card below. Keep your response to 1-2 sentences maximum.`;
    } else if (duplicateFound) {
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy, but DUPLICATE POLICIES WERE FOUND.

RESPONSE REQUIRED: Inform the user that a similar policy already exists and ask if they still wish to proceed. Keep your response concise (1-2 sentences).`;
    } else if (missingJustification) {
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy, but BUSINESS JUSTIFICATION IS MISSING:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}

RESPONSE REQUIRED: Warn the user that business justification is missing and may delay approval. Ask them to provide justification or proceed without it. DO NOT create a new policy yet.`;
    } else {
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}
- Business Justification: ${parsedRequest.businessJustification}

RESPONSE REQUIRED: Confirm the policy details for ${vendorConfig.displayName}. Inform them that a ${vendorConfig.displayName}-specific CLI configuration will be generated and a change ticket will be created for admin approval. Mention that the policy will be formatted according to ${vendorConfig.displayName} syntax and standards.`;
    }
  }

  // Build conversation context
  const messages = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  
  // Generate AI response
  const prompt = ai.definePrompt({
    name: 'firewallChatAgentPrompt',
    input: { schema: FirewallChatAgentInputSchema },
    output: { schema: z.object({ response: z.string() }) },
    prompt: `${systemContext}

Conversation history:
${messages}

User query: {{{query}}}

Provide a helpful response.`,
  });

  const { output } = await prompt({ query, userId, conversationId: convId });
  
  const aiResponse = output?.response || 'I apologize, I encountered an error processing your request.';
  
  // Save AI response to conversation
  await prisma.chatMessage.create({
    data: {
      conversationId: convId,
      role: 'Assistant',
      content: aiResponse,
    },
  });

  // If this is a policy request and no duplicates found, create a ticket and draft policy
  if (shouldCreatePolicy && parsedRequest && !duplicateFound) {
    try {
      // Get the selected vendor configuration
      const selectedVendorConfig = getVendorById(vendor) || getDefaultVendor();
      
      // Convert to vendor-specific format
      const vendorPolicy = convertToVendorFormat(parsedRequest, selectedVendorConfig);
      
      // Validate the policy
      const validation = validatePolicy(vendorPolicy, selectedVendorConfig);
      if (!validation.valid) {
        console.error('Policy validation failed:', validation.errors);
      }
      
      // Generate CLI configuration for the selected vendor
      cliConfig = generateVendorCLI(vendorPolicy, selectedVendorConfig);
      
      // Create draft policy
      const policyCount = await prisma.policy.count();
      const policyId = `POL-${String(policyCount + 1).padStart(3, '0')}`;
      
      const policy = await prisma.policy.create({
        data: {
          id: policyId,
          name: parsedRequest.businessJustification ? 
            `Policy for ${parsedRequest.businessJustification.substring(0, 30)}` :
            `Policy ${parsedRequest.sourceIp} to ${parsedRequest.destinationIp || parsedRequest.destinationFqdn}:${parsedRequest.port}`,
          source: parsedRequest.sourceIp,
          destination: parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl || '',
          destPort: parsedRequest.port,
          action: 'Allow',
          status: 'PendingApproval',
          vendor: vendor,
          rawConfig: vendorPolicy,
          cliConfig: cliConfig,
          businessJustification: parsedRequest.businessJustification,
          requestedBy: userId,
          targetDevice: parsedRequest.targetDevice,
          sourceZone: parsedRequest.sourceZone,
          destinationZone: parsedRequest.destinationZone,
        },
      });

      // Create ticket
      const ticketCount = await prisma.changeTicket.count();
      const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;
      
      const ticket = await prisma.changeTicket.create({
        data: {
          ticketNumber,
          policyId: policy.id,
          requestedBy: userId,
          title: `Create ${vendor.toUpperCase()} Policy: ${policy.name}`,
          description: `${vendor.toUpperCase()} policy requested via AI chat: ${query}`,
          status: 'PendingApproval',
          priority: 'Medium',
        },
      });
      
      ticketId = ticket.id;
      ticketCreated = true;
      policyGenerated = true;

      // Create external ticket if external system is specified
      if (externalSystem && (externalSystem === 'servicenow' || externalSystem === 'jira')) {
        try {
          const externalTicketService = new ExternalTicketService();
          const externalResult = await externalTicketService.createExternalTicket({
            ticketId: ticket.id,
            system: externalSystem,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            requestedBy: userId,
            policyId: policy.id
          });

          if (externalResult.success) {
            externalTicketCreated = true;
            externalTicketId = externalResult.externalId;
            externalTicketUrl = externalResult.externalUrl;
          }
        } catch (error) {
          console.error('Failed to create external ticket:', error);
        }
      }

      // Create policy history entry
      const policyMatcher = new PolicyMatcherService();
      await policyMatcher.createPolicyHistory(
        policy.id,
        'created',
        userId,
        `Policy created via AI chat: ${query}`
      );

    } catch (error) {
      console.error('Error creating policy and ticket:', error);
    }
  }

  return {
    response: aiResponse,
    conversationId: convId,
    ticketCreated,
    ticketId,
    policyGenerated,
    vendor,
    cliConfig,
    externalTicketCreated,
    externalTicketId,
    externalTicketUrl,
    duplicateFound,
    matchedPolicies,
    missingJustification,
    parsedRequest,
  };
}

/**
 * Generate vendor-specific CLI configuration from policy
 */
function generateVendorCLI(policy: any, vendor: FirewallVendor): string {
  switch (vendor.id) {
    case 'fortigate':
      return generateFortiGateCLI(policy);
    case 'paloalto':
      return generatePaloAltoCLI(policy);
    case 'cisco':
      return generateCiscoASACLI(policy);
    default:
      return generateFortiGateCLI(policy); // Default fallback
  }
}

/**
 * Generate FortiGate CLI configuration from policy
 */
function generateFortiGateCLI(policy: any): string {
  // Handle port-specific service
  let service = policy.service || 'ALL';
  if (policy.destPort && policy.service === 'ALL') {
    service = `port-${policy.destPort}`;
  }
  
  return `config firewall policy
  edit 0
    set name "${policy.name || 'Policy'}"
    set srcintf "${policy.srcintf || 'any'}"
    set dstintf "${policy.dstintf || 'any'}"
    set srcaddr "${policy.srcaddr || 'all'}"
    set dstaddr "${policy.dstaddr || 'all'}"
    set action ${policy.action || 'accept'}
    set schedule "${policy.schedule || 'always'}"
    set service "${service}"
    set logtraffic ${policy.logtraffic || 'all'}
    ${policy.comments ? `set comments "${policy.comments}"` : ''}
  next
end`;
}

/**
 * Generate Palo Alto CLI configuration from policy
 */
function generatePaloAltoCLI(policy: any): string {
  return `<entry name="${policy.name || 'Policy'}">
  <from>${policy.from || 'any'}</from>
  <to>${policy.to || 'any'}</to>
  <source>${policy.source || 'any'}</source>
  <destination>${policy.destination || 'any'}</destination>
  <application>${policy.application || 'any'}</application>
  <service>${policy.service || 'application-default'}</service>
  <action>${policy.action || 'allow'}</action>
</entry>`;
}

/**
 * Generate Cisco ASA CLI configuration from policy
 */
function generateCiscoASACLI(policy: any): string {
  const protocol = policy.protocol || 'tcp';
  const port = policy.destPort ? `eq ${policy.destPort}` : '';
  return `access-list ${policy['access-list'] || 'OUTSIDE_IN'} ${policy.action || 'permit'} ${protocol} ${policy.source || 'any'} ${policy.destination || 'any'} ${port}`.trim();
}

