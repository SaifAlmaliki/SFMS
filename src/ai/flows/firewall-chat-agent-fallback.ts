/**
 * @fileOverview Fallback firewall chat agent that works without AI API keys
 */

import { PrismaClient } from '../../generated/prisma';
import { FORTIGATE_VENDOR, convertToVendorFormat, validatePolicy } from '@/lib/firewall-vendors';
import { ExternalTicketService } from '@/lib/external-ticket-service';
import { PolicyRequestParser } from '@/lib/policy-parser';
import { PolicyMatcherService } from '@/lib/policy-matcher';

const prisma = new PrismaClient();

export interface FirewallChatAgentInput {
  query: string;
  userId: string;
  conversationId?: string;
  vendor?: string;
  externalSystem?: string;
}

export interface FirewallChatAgentOutput {
  response: string;
  conversationId: string;
  ticketCreated?: boolean;
  ticketId?: string;
  policyGenerated?: boolean;
  vendor?: string;
  cliConfig?: string;
  externalTicketCreated?: boolean;
  externalTicketId?: string;
  externalTicketUrl?: string;
  duplicateFound?: boolean;
  matchedPolicies?: any[];
  missingJustification?: boolean;
  parsedRequest?: any;
}

/**
 * Check if user query is requesting a policy creation
 */
function isPolicyRequest(query: string): boolean {
  const policyKeywords = [
    'create policy',
    'add policy',
    'allow',
    'deny',
    'block',
    'permit',
    'firewall rule',
    'access rule',
    'from',
    'to',
    'port',
    'protocol'
  ];
  
  const lowerQuery = query.toLowerCase();
  return policyKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Generate a simple response without AI
 */
function generateSimpleResponse(query: string, parsedRequest?: any, duplicateFound?: boolean, missingJustification?: boolean): string {
  if (duplicateFound && parsedRequest) {
    return `I found an existing policy that matches your request:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}

Please review the existing policy details above and let me know if you want to proceed anyway or if you need a different configuration.`;
  }
  
  if (missingJustification && parsedRequest) {
    return `I can help you create this policy:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}

However, I notice you haven't provided a business justification. While not required, providing a justification helps with approval and audit purposes. Would you like to add one or proceed without it?`;
  }
  
  if (parsedRequest) {
    return `I understand you want to create a firewall policy:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}
- Business Justification: ${parsedRequest.businessJustification || 'Not provided'}

I'll create this policy for you and generate a change ticket for admin approval.`;
  }
  
  // Generic responses for non-policy queries
  const responses = [
    "I'm here to help with firewall policy management. You can ask me to create policies, check for duplicates, or get assistance with firewall configurations.",
    "I can help you create firewall policies using natural language. Try something like 'Allow 10.1.1.5 to 192.168.1.10:443 for database access'.",
    "I support FortiGate, Palo Alto, and Cisco firewall configurations. What would you like to do today?",
    "I can detect duplicate policies, create change tickets, and integrate with ServiceNow or Jira. How can I assist you?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate FortiGate CLI configuration
 */
function generateFortiGateCLI(policy: any): string {
  return `config firewall policy
  edit 0
    set name "${policy.name}"
    set srcintf "${policy.srcintf || 'any'}"
    set dstintf "${policy.dstintf || 'any'}"
    set srcaddr "${policy.srcaddr}"
    set dstaddr "${policy.dstaddr}"
    set action ${policy.action}
    set schedule "always"
    set service "${policy.service || 'ALL'}"
    set logtraffic all
    ${policy.comments ? `set comments "${policy.comments}"` : ''}
  next
end`;
}

export async function firewallChatAgent(input: FirewallChatAgentInput): Promise<FirewallChatAgentOutput> {
  const { query, userId, conversationId, vendor = 'fortigate', externalSystem } = input;
  
  // Generate or get conversation ID
  let convId = conversationId;
  if (!convId) {
    const conversation = await prisma.chatConversation.create({
      data: {
        userId,
        title: query.substring(0, 50),
      },
    });
    convId = conversation.id;
  }

  // Save user message
  await prisma.chatMessage.create({
    data: {
      conversationId: convId,
      role: 'user',
      content: query,
    },
  });

  let parsedRequest: any = null;
  let duplicateFound = false;
  let matchedPolicies: any[] = [];
  let missingJustification = false;
  let ticketCreated = false;
  let ticketId = '';
  let policyGenerated = false;
  let cliConfig = '';
  let externalTicketCreated = false;
  let externalTicketId = '';
  let externalTicketUrl = '';

  // Check if this is a policy request
  const shouldCreatePolicy = isPolicyRequest(query);

  if (shouldCreatePolicy) {
    // Parse policy request
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

  // Generate response
  const aiResponse = generateSimpleResponse(query, parsedRequest, duplicateFound, missingJustification);

  // If this is a policy request and no duplicates found, create a ticket and draft policy
  if (shouldCreatePolicy && parsedRequest && !duplicateFound) {
    try {
      // Generate policy ID
      const policyId = `POL-${String(Date.now()).slice(-6)}`;
      
      // Convert to vendor-specific format
      const vendorPolicy = convertToVendorFormat({
        name: parsedRequest.businessJustification ? 
          `Policy for ${parsedRequest.businessJustification.substring(0, 30)}` :
          `Policy ${parsedRequest.sourceIp} to ${parsedRequest.destinationIp || parsedRequest.destinationFqdn}:${parsedRequest.port}`,
        source: parsedRequest.sourceIp,
        destination: parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl || '',
        destPort: parsedRequest.port,
        action: 'Allow',
        sourceZone: parsedRequest.sourceZone,
        destinationZone: parsedRequest.destinationZone,
        businessJustification: parsedRequest.businessJustification,
      }, FORTIGATE_VENDOR);

      // Validate policy
      const validation = validatePolicy(vendorPolicy, FORTIGATE_VENDOR);
      if (!validation.valid) {
        throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate CLI config
      cliConfig = generateFortiGateCLI(vendorPolicy);

      // Create policy
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

      policyGenerated = true;

      // Create change ticket
      const ticket = await prisma.changeTicket.create({
        data: {
          ticketNumber: `TKT-${String(Date.now()).slice(-6)}`,
          policyId: policy.id,
          requestedBy: userId,
          title: `Firewall Policy Request: ${policy.name}`,
          description: `Request to create firewall policy: ${policy.name}\n\nSource: ${policy.source}\nDestination: ${policy.destination}:${policy.destPort}\nAction: ${policy.action}\nBusiness Justification: ${policy.businessJustification || 'Not provided'}`,
          status: 'PendingApproval',
          priority: 'Medium',
        },
      });

      ticketCreated = true;
      ticketId = ticket.id;

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
            externalTicketId = externalResult.externalId || '';
            externalTicketUrl = externalResult.externalUrl || '';
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

  // Save bot response
  await prisma.chatMessage.create({
    data: {
      conversationId: convId,
      role: 'assistant',
      content: aiResponse,
    },
  });

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
