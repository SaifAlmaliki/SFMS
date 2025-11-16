/**
 * @fileOverview Enhanced AI chatbot for firewall management with FortiGate-specific support
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PrismaClient } from '../../generated/prisma';
import { getVendorById, getDefaultVendor, convertToVendorFormat, validatePolicy, AVAILABLE_VENDORS, type FirewallVendor } from '@/lib/firewall-vendors';
import { ExternalTicketService } from '@/lib/external-ticket-service';
import { AIPolicyRequestParser } from '@/lib/policy-parser-ai';
import { PolicyRequestParser } from '@/lib/policy-parser'; // Keep for isValidIp utility if needed
import { PolicyMatcherService } from '@/lib/policy-matcher';
import { classifyTicket, type TicketClassification } from '@/lib/ticket-classifier';
import { searchKnowledgeBase } from '@/lib/knowledge-base-service';
import { FortiGateClient, FortiGateDevice } from '@/lib/fortigate';
import { convertFortiGateToPolicy } from '@/lib/fortigate-policy-converter';
import { checkFortiGateAvailability } from '@/lib/fortigate-availability';

const prisma = new PrismaClient();

const FirewallChatAgentInputSchema = z.object({
  query: z.string().describe('The user\'s natural language query or request'),
  userId: z.string().describe('The ID of the user making the request'),
  conversationId: z.string().optional().describe('Optional conversation ID for context'),
  vendor: z.string().optional().describe('Firewall vendor (fortigate, paloalto, cisco)'),
  targetDevice: z.string().optional().describe('Target firewall device name for policy deployment'),
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
  ticketType: z.string().optional().describe('Ticket type (FirewallPolicy, ITSupport, etc.)'),
  ticketCategory: z.string().optional().describe('Ticket category'),
  isITSupport: z.boolean().optional().describe('Whether this is an IT support request'),
});

export type FirewallChatAgentOutput = z.infer<typeof FirewallChatAgentOutputSchema>;

/**
 * Check if user query is requesting a policy creation
 * Only returns true if there's actual policy data (source IP, destination, port) OR explicit creation keywords
 */
function isPolicyRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Explicit policy creation keywords (these require actual policy data)
  const explicitKeywords = [
    'create policy',
    'add policy',
    'new policy',
    'allow traffic',
    'block traffic',
    'firewall rule'
  ];
  
  // Check for explicit keywords first
  const hasExplicitKeyword = explicitKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Use AI parser's quick check method (synchronous, doesn't call API)
  const looksLikePolicyRequest = AIPolicyRequestParser.isPolicyRequest(query);
  
  // Only return true if:
  // 1. Has explicit keyword AND looks like policy request, OR
  // 2. Looks like policy request (user provided policy details directly)
  if (looksLikePolicyRequest) {
    return true; // Has actual policy data (source IP, destination, port)
  }
  
  // If explicit keyword but no actual data, still consider it a policy request intent
  // but the parser will fail later and prevent policy creation
  return hasExplicitKeyword;
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
    'what are',
    'all policies',
    'existing policies',
    'current policies',
    'list all policies',
    'show all policies',
    'what are the policies',
    'display policies',
    'policies list',
    'show me policies',
    'tell me about policies'
  ];
  
  const lowerQuery = query.toLowerCase();
  // Check if query contains both "what" or "list"/"show"/"view" AND "policies"
  if (lowerQuery.includes('policies') || lowerQuery.includes('policy')) {
    const listVerbs = ['list', 'show', 'view', 'get', 'what', 'display', 'tell me', 'existing', 'current', 'all'];
    if (listVerbs.some(verb => lowerQuery.includes(verb))) {
      return true;
    }
  }
  // Also check for exact keyword matches
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

  // Check for list requests FIRST - these should always be treated as FirewallPolicy requests
  // This prevents them from being misclassified as IT support
  const shouldListPolicies = isListPoliciesRequest(query);
  
  // Check if this might be a policy request BEFORE classification
  // This ensures policy requests are detected even if classifier thinks it's IT support
  const mightBePolicyRequest = !shouldListPolicies && isPolicyRequest(query);
  
  let parsedRequest: any = null;
  let duplicateFound = false;
  let matchedPolicies: any[] = [];
  let missingJustification = false;
  let policiesList: any[] = [];
  
  // Try to parse the policy request if it looks like one
  // This happens BEFORE classification to ensure we catch policy requests
  let shouldCreatePolicy = false;
  let hasValidPolicyData = false;
  let parseError: string | undefined = undefined;
  
  if (mightBePolicyRequest) {
    // Use AI-powered parser to extract policy information
    const parseResult = await AIPolicyRequestParser.parse(query);
    
    if (parseResult.success && parseResult.data) {
      // AI parser already validates, so we can trust the data
      const data = parseResult.data;
      
      // All validations passed - this is definitely a policy request
      hasValidPolicyData = true;
      shouldCreatePolicy = true;
      parsedRequest = data;
      missingJustification = !parsedRequest.businessJustification;
      
      // Check for duplicates/conflicts - this should happen for ALL valid policy requests
      // BEFORE creating any tickets or policies
      const policyMatcher = new PolicyMatcherService();
      const matchResult = await policyMatcher.findExactMatches(parsedRequest);
      
      if (matchResult.hasMatch) {
        duplicateFound = true;
        matchedPolicies = matchResult.matchedPolicies;
        // If duplicate found, don't create a new policy
        shouldCreatePolicy = false;
      }
    } else {
      // Parsing failed - capture the error
      parseError = parseResult.error || 'Failed to parse policy request. Please provide source IP, destination, and port.';
    }
  }
  
  // Only classify ticket if it's NOT a policy request (list or create)
  // Skip classification entirely for policy-related requests
  let classification: any = null;
  let isITSupportRequest = false;
  
  if (!shouldListPolicies && !hasValidPolicyData) {
    // Only run classification if we don't have a policy request
    classification = await classifyTicket(query);
    isITSupportRequest = classification.ticketType !== 'FirewallPolicy';
  } else {
    // For policy requests, set classification without calling the classifier
    classification = {
      ticketType: 'FirewallPolicy' as const,
      category: shouldListPolicies ? 'Policy Inquiry' : 'Firewall Policy Request',
      priority: 'Medium' as const,
      keywords: [],
      isNetworkRelated: true,
      confidence: 1.0,
    };
    isITSupportRequest = false;
  }
  
  let ticketId: string | undefined;
  let ticketCreated = false;
  let policyGenerated = false;
  let cliConfig: string | undefined;
  let externalTicketCreated = false;
  let externalTicketId: string | undefined;
  let externalTicketUrl: string | undefined;
  
  // For IT support requests, search knowledge base for similar tickets
  let similarTickets: any[] = [];
  if (isITSupportRequest) {
    similarTickets = await searchKnowledgeBase(query, 5);
  }

  // Check if user wants to list policies
  let fortigateConnectionError: string | null = null;
  if (shouldListPolicies) {
    try {
      // Use availability checker utility to verify firewall connection
      const availability = await checkFortiGateAvailability();
      
      if (!availability.available) {
        policiesList = [];
        fortigateConnectionError = availability.error || 'NO_DEVICES';
      } else {
        // Firewall is available, now fetch policies
        const fortigateDevices = await prisma.device.findMany({
          where: {
            vendor: 'fortigate',
            status: 'Active',
          },
        });

        let fetchedFromFortiGate = false;
        let connectionError: string | null = null;
        
        // Try to fetch from the available device first, then try others if needed
        // Prioritize the device that passed availability check
        const sortedDevices = fortigateDevices.sort((a, b) => {
          if (a.name === availability.deviceName) return -1;
          if (b.name === availability.deviceName) return 1;
          return 0;
        });
        
        for (const device of sortedDevices) {
          if (device.apiKey) {
            try {
              const fortigateDevice: FortiGateDevice = {
                id: device.id,
                name: device.name,
                ip: device.ip,
                apiKey: device.apiKey,
                version: device.version || undefined,
              };

              const client = new FortiGateClient(fortigateDevice);
              const policiesResult = await client.firewall.getPolicies();
              
              if (policiesResult.success && policiesResult.data) {
                // Convert FortiGate policies to database format
                let fortigatePolicies: any[] = [];
                
                if (Array.isArray(policiesResult.data)) {
                  fortigatePolicies = policiesResult.data;
                } else if (policiesResult.data && typeof policiesResult.data === 'object') {
                  if (Array.isArray(policiesResult.data.results)) {
                    fortigatePolicies = policiesResult.data.results;
                  } else if (policiesResult.data.results && typeof policiesResult.data.results === 'object') {
                    if (policiesResult.data.results.policyid !== undefined) {
                      fortigatePolicies = [policiesResult.data.results];
                    } else {
                      fortigatePolicies = Object.values(policiesResult.data.results);
                    }
                  }
                }

                // Convert each FortiGate policy to database format
                policiesList = fortigatePolicies.map((fgPolicy) => {
                  const policyData = convertFortiGateToPolicy(fgPolicy, device.name);
                  return {
                    ...policyData,
                    id: `POL-FG-${fgPolicy.policyid || Date.now()}`,
                    vendor: 'fortigate',
                    vendorId: fgPolicy.policyid?.toString(),
                    targetDevice: input.targetDevice || device.name, // Use provided device or first available
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                });
                
                fetchedFromFortiGate = true;
                break; // Use first successful device
              } else {
                connectionError = policiesResult.error || 'Failed to fetch policies from FortiGate';
              }
            } catch (error: any) {
              console.error(`Error fetching policies from FortiGate device ${device.name}:`, error);
              connectionError = `Error fetching policies from ${device.name}: ${error.message}`;
              // Continue to next device
            }
          }
        }

        // If policy fetch failed even though connection test passed
        if (!fetchedFromFortiGate) {
          policiesList = [];
          fortigateConnectionError = connectionError || 'Failed to fetch policies from FortiGate';
        }
      }
    } catch (error: any) {
      console.error('Error fetching policies:', error);
      policiesList = [];
      fortigateConnectionError = `Error: ${error.message}`;
    }
  }

  // Get vendor configuration for enhanced context
  const vendorConfig = getVendorById(vendor) || getDefaultVendor();
  
  // Handle IT Support requests
  if (isITSupportRequest) {
    // Create IT Support ticket
    try {
      const ticketCount = await prisma.changeTicket.count();
      const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;
      
      const ticket = await prisma.changeTicket.create({
        data: {
          ticketNumber,
          requestedBy: userId,
          title: query.substring(0, 100),
          description: query,
          status: 'PendingApproval',
          priority: classification.priority,
          ticketType: classification.ticketType,
          category: classification.category,
          keywords: classification.keywords,
          isNetworkRelated: classification.isNetworkRelated,
        },
      });
      
      ticketId = ticket.id;
      ticketCreated = true;

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
            ticketType: ticket.ticketType,
            category: ticket.category || undefined,
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
    } catch (error) {
      console.error('Error creating IT support ticket:', error);
    }
  }

  // Build context for AI with vendor-specific information
  let systemContext = `You are an expert IT support assistant helping users with ${isITSupportRequest ? 'IT support requests' : `${vendorConfig.displayName} (${vendor.toUpperCase()}) firewall policies`}.
${isITSupportRequest 
  ? `You help users create IT support tickets for issues like email, VPN, software installation, hardware requests, and access requests. You can provide helpful guidance and route tickets appropriately.`
  : `You have deep knowledge of ${vendorConfig.displayName} configuration syntax, CLI commands, and best practices.
${vendorConfig.id === 'fortigate' ? `FortiGate policies use CLI syntax like "config firewall policy" with fields: srcintf, dstintf, srcaddr, dstaddr, action (accept/deny), service (port numbers or service names), schedule, and logtraffic.` : ''}
${vendorConfig.id === 'paloalto' ? `Palo Alto policies use XML-based configuration with zones (from/to), source/destination addresses, applications, services, and actions (allow/deny).` : ''}
${vendorConfig.id === 'cisco' ? `Cisco ASA policies use access-list commands with permit/deny actions, protocols, source/destination addresses, and port specifications.` : ''}
You can help create policies, answer questions about firewall configurations, and provide security recommendations.`
}
Be concise and helpful.`;
  
  // Add IT support context if applicable
  if (isITSupportRequest && similarTickets.length > 0) {
    systemContext += `\n\nIMPORTANT: This is an IT support request classified as: ${classification.category} (${classification.ticketType}).
Priority: ${classification.priority}
Similar previous tickets found: ${similarTickets.length}

${similarTickets.map((t, i) => `${i + 1}. ${t.title} (Category: ${t.category}, Frequency: ${t.frequency})`).join('\n')}

${classification.matchedKnowledgeBase?.solution ? `Suggested solution: ${classification.matchedKnowledgeBase.solution}` : ''}

RESPONSE REQUIRED: Acknowledge the request and inform the user that a ticket has been created${ticketId ? ` (Ticket #${ticketId})` : ''}. ${classification.matchedKnowledgeBase?.solution ? `You may suggest: ${classification.matchedKnowledgeBase.solution}` : 'Provide helpful guidance if possible.'}${externalTicketCreated ? ` The ticket has also been created in ${externalSystem?.toUpperCase()}.` : ''}`;
  }

  // Add policy list context if user requested it
    if (shouldListPolicies) {
      // Check for FortiGate connection errors first
      if (fortigateConnectionError) {
        if (fortigateConnectionError === 'NO_DEVICES') {
          systemContext += `\n\nIMPORTANT: The user is asking to list policies, but NO FORTIGATE DEVICES ARE CONFIGURED.\n\nRESPONSE REQUIRED: Inform the user clearly with a warning emoji (⚠️) that no FortiGate firewall devices are connected. Provide clear instructions:\n1. Go to Settings page\n2. Navigate to Device Management section\n3. Enter FortiGate device credentials (Hostname/IP, API Username, API Key)\n4. Test the connection and save the device\n\nExplain that once connected, they can list policies directly from the FortiGate firewall. Do NOT show database policies as they may be outdated.`;
        } else {
          systemContext += `\n\nIMPORTANT: The user is asking to list policies, but FORTIGATE CONNECTION FAILED.\n\nERROR: ${fortigateConnectionError}\n\nRESPONSE REQUIRED: Inform the user clearly with a warning emoji (⚠️) that the FortiGate firewall connection failed. Show the specific error message. Provide troubleshooting steps:\n1. Go to Settings → Device Management\n2. Verify FortiGate credentials are correct\n3. Test the connection\n4. Ensure firewall is reachable and API access is enabled\n\nExplain that you cannot show policies from the database as they may be outdated. The user must connect to their FortiGate firewall to view current policies.`;
        }
      } else if (policiesList.length > 0) {
        systemContext += `\n\nIMPORTANT: The user is asking to view/list existing policies. Here are ALL the policies from the FORTIGATE FIREWALL with FULL DETAILS:\n\n${formatPoliciesList(policiesList)}\n\nRESPONSE REQUIRED: Format your response with clear sections. Start with the summary, then list each policy with clear spacing between policies. Use proper line breaks and formatting so each policy is easily readable. Include ALL details for each policy: Policy ID, Name, Source, Destination:Port, Action, Status, Vendor, Requested By, Business Justification, and Created date. Make sure to use line breaks (\n) between policies so the response is well-formatted and easy to read.`;
      } else {
        systemContext += `\n\nIMPORTANT: The user is asking to view existing policies from FortiGate firewall, but no policies were found.\n\nRESPONSE REQUIRED: Inform the user that no policies are currently configured on the FortiGate firewall and offer to help create one.`;
      }
    } else if (hasValidPolicyData && parsedRequest) {
    // User has a valid policy request (parsing succeeded) - check for duplicates FIRST
    if (duplicateFound && matchedPolicies && matchedPolicies.length > 0) {
      const firstPolicy = matchedPolicies[0];
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy, but a DUPLICATE/EXISTING POLICY WAS FOUND.

EXISTING POLICY:
- Policy ID: ${firstPolicy.id}
- Source: ${firstPolicy.source}
- Destination: ${firstPolicy.destination}:${firstPolicy.destPort}
- Status: ${firstPolicy.status}
- Created by: ${firstPolicy.requestedBy || 'Unknown'}
- Business Justification: ${firstPolicy.businessJustification || 'N/A'}

${matchedPolicies.length > 1 ? `Note: ${matchedPolicies.length} total matching policies found.` : ''}

RESPONSE REQUIRED: Give a clear, concise response informing the user that a similar policy already exists (Policy ID: ${firstPolicy.id}). DO NOT create a new policy or ticket. Mention that the existing policy details will be shown below. Ask if they want to proceed with the existing policy or if they need a different configuration. Keep your response to 2-3 sentences maximum.`;
    } else if (duplicateFound) {
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy, but DUPLICATE POLICIES WERE FOUND.

RESPONSE REQUIRED: Inform the user that a similar policy already exists and ask if they still wish to proceed. DO NOT create a new policy or ticket. Keep your response concise (1-2 sentences).`;
    } else if (missingJustification) {
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy, but BUSINESS JUSTIFICATION IS MISSING:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}

RESPONSE REQUIRED: Warn the user that business justification is missing and may delay approval. Ask them to provide justification or proceed without it.`;
    } else {
      systemContext += `\n\nIMPORTANT: The user wants to create a ${vendor.toUpperCase()} firewall policy:
- Source: ${parsedRequest.sourceIp}
- Destination: ${parsedRequest.destinationIp || parsedRequest.destinationFqdn || parsedRequest.destinationUrl}
- Port: ${parsedRequest.port}
- Business Justification: ${parsedRequest.businessJustification}

RESPONSE REQUIRED: Confirm the policy details for ${vendorConfig.displayName}. Inform them that a ${vendorConfig.displayName}-specific CLI configuration will be generated and a change ticket will be created for admin approval. Mention that the policy will be formatted according to ${vendorConfig.displayName} syntax and standards.`;
    }
  } else if (mightBePolicyRequest && !hasValidPolicyData) {
    // User mentioned policy keywords but validation failed
    if (parseError) {
      systemContext += `\n\nIMPORTANT: The user wants to create a firewall policy, but VALIDATION FAILED.\n\nERROR: ${parseError}\n\nRESPONSE REQUIRED: Inform the user about the validation error. DO NOT create any policy or ticket. Clearly explain what's missing or invalid, and ask them to provide the correct information. Be helpful and specific about what needs to be corrected.`;
    } else {
      systemContext += `\n\nIMPORTANT: The user seems to want to create a firewall policy, but the request is missing required information.\n\nRESPONSE REQUIRED: Inform the user that to create a policy, they need to provide:\n- Source IP address (e.g., "10.1.1.5")\n- Destination (IP address, FQDN, or URL)\n- Port number (e.g., ":443", "port 8080")\n\nDO NOT create any policy or ticket. Ask them to provide the missing information so you can help create the policy.`;
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
  
  let aiResponse = output?.response || 'I apologize, I encountered an error processing your request.';

  // If this is a policy request and no duplicates found, create a ticket and draft policy
  if (shouldCreatePolicy && parsedRequest && !duplicateFound) {
    try {
      // Get the selected vendor configuration
      const selectedVendorConfig = getVendorById(vendor) || getDefaultVendor();
      
      // Convert to vendor-specific format (add action since parsedRequest doesn't have it)
      const policyWithAction = { ...parsedRequest, action: 'Allow' };
      
      // Debug: Log parsed request to verify destination is extracted correctly
      if (!parsedRequest.destinationIp && !parsedRequest.destinationFqdn && !parsedRequest.destinationUrl) {
        console.warn('Warning: Parsed request missing destination:', {
          sourceIp: parsedRequest.sourceIp,
          destinationIp: parsedRequest.destinationIp,
          destinationFqdn: parsedRequest.destinationFqdn,
          destinationUrl: parsedRequest.destinationUrl,
          port: parsedRequest.port,
          businessJustification: parsedRequest.businessJustification,
        });
      }
      
      const vendorPolicy = convertToVendorFormat(policyWithAction, selectedVendorConfig);
      
      // Validate the policy
      const validation = validatePolicy(vendorPolicy, selectedVendorConfig);
      if (!validation.valid) {
        console.error('Policy validation failed:', validation.errors);
        // Don't create ticket if validation fails
        aiResponse = `I couldn't create the policy because validation failed: ${validation.errors.join(', ')}. Please provide valid source IP, destination, and port information.`;
        shouldCreatePolicy = false;
      } else {
        // Generate CLI configuration for the selected vendor
        cliConfig = generateVendorCLI(vendorPolicy, selectedVendorConfig);
        
        // Validate CLI configuration - check for invalid values
        if (cliConfig && cliConfig.includes('[object Object]')) {
          console.error('CLI configuration contains invalid values');
          // Don't create ticket if CLI config is invalid
          aiResponse = `I couldn't create the policy because the configuration extraction failed. Please provide clear information with:\n- Source IP address (e.g., "10.1.1.5")\n- Destination IP or domain (e.g., "192.168.1.10" or "api.example.com")\n- Port number (e.g., "443" or ":443")`;
          shouldCreatePolicy = false;
        } else if (!parsedRequest.sourceIp || !parsedRequest.port || (!parsedRequest.destinationIp && !parsedRequest.destinationFqdn && !parsedRequest.destinationUrl)) {
          // Validate that all required fields are present
          console.error('Missing required policy fields');
          aiResponse = `I couldn't create the policy because required information is missing. Please provide:\n- Source IP address\n- Destination (IP address, domain, or URL)\n- Port number`;
          shouldCreatePolicy = false;
        }
      }
      
      // Only create policy and ticket if validation passed
      if (!shouldCreatePolicy) {
        // Skip ticket creation - aiResponse already set above
      } else {
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
          action: parsedRequest.action || 'Allow', // Use parsed action or default to Allow
          status: 'PendingApproval',
          vendor: vendor,
          rawConfig: vendorPolicy,
          cliConfig: cliConfig,
          businessJustification: parsedRequest.businessJustification,
          requestedBy: userId,
          targetDevice: input.targetDevice || parsedRequest.targetDevice, // Use provided device from selection
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

      // Note: Policy is created as a ticket and will be deployed when approved by admin
      // Do NOT auto-deploy - wait for admin approval at /admin/approvals
      }
    } catch (error) {
      console.error('Error creating policy and ticket:', error);
      // Update response to inform user of the error
      if (shouldCreatePolicy) {
        aiResponse = `I encountered an error while creating the policy: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with clearer information.`;
      }
    }
  }

  // Save AI response to conversation (after all modifications)
  await prisma.chatMessage.create({
    data: {
      conversationId: convId,
      role: 'Assistant',
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
    ticketType: classification.ticketType,
    ticketCategory: classification.category,
    isITSupport: isITSupportRequest,
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
  let service = 'ALL';
  if (policy.service) {
    // Handle array format from API
    if (Array.isArray(policy.service) && policy.service.length > 0) {
      service = policy.service[0].name || 'ALL';
    } else if (typeof policy.service === 'string') {
      service = policy.service;
    }
  }
  
  if (policy.destPort && service === 'ALL') {
    service = `port-${policy.destPort}`;
  }
  
  // Extract values from arrays or objects if needed
  const extractValue = (value: any): string => {
    if (Array.isArray(value) && value.length > 0) {
      // Handle array format: [{ name: "any" }]
      return value[0].name || value[0] || 'any';
    }
    if (value && typeof value === 'object' && value.name) {
      // Handle object format: { name: "any" }
      return value.name;
    }
    if (typeof value === 'string') {
      // Already a string
      return value;
    }
    return 'any';
  };
  
  const srcintf = extractValue(policy.srcintf);
  const dstintf = extractValue(policy.dstintf);
  const srcaddr = extractValue(policy.srcaddr);
  const dstaddr = extractValue(policy.dstaddr);
  
  return `config firewall policy
  edit 0
    set name "${policy.name || 'Policy'}"
    set srcintf "${srcintf}"
    set dstintf "${dstintf}"
    set srcaddr "${srcaddr}"
    set dstaddr "${dstaddr}"
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


