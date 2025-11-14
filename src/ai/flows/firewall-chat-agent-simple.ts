/**
 * @fileOverview Simple firewall chat agent that works without AI API keys
 */

import { PrismaClient } from '../../generated/prisma';
import { PolicyRequestParser } from '@/lib/policy-parser';
import { PolicyMatcherService } from '@/lib/policy-matcher';
import { getVendorById, getDefaultVendor, convertToVendorFormat, validatePolicy, type FirewallVendor } from '@/lib/firewall-vendors';
import { FortiGateClient, FortiGateDevice } from '@/lib/fortigate';
import { convertFortiGateToPolicy } from '@/lib/fortigate-policy-converter';
import { checkFortiGateAvailability, checkSpecificFortiGateDevice } from '@/lib/fortigate-availability';

// Create a single Prisma instance
let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('Failed to create Prisma client:', error);
  throw error;
}

export interface FirewallChatAgentInput {
  query: string;
  userId: string;
  conversationId?: string;
  vendor?: string;
  targetDevice?: string; // Target firewall device name for policy deployment
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
  
  // Try to parse to see if there's actual policy data
  const parseResult = PolicyRequestParser.parse(query);
  
  // Only return true if:
  // 1. Has explicit keyword AND parsing succeeds (has actual data), OR
  // 2. Parsing succeeds without explicit keyword (user provided policy details directly)
  if (parseResult.success) {
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

/**
 * Generate a simple response without AI
 */
function generateSimpleResponse(query: string, parsedRequest?: any, duplicateFound?: boolean, missingJustification?: boolean, matchedPolicies?: any[]): string {
  if (duplicateFound && parsedRequest && matchedPolicies && matchedPolicies.length > 0) {
    const firstPolicy = matchedPolicies[0];
    return `A similar policy already exists (Policy ${firstPolicy.id}). Please review the policy details below and let me know if you still wish to proceed with creating a new policy.`;
  }
  
  if (duplicateFound && parsedRequest) {
    return `A similar policy already exists for this connection. Please review the policy details below and let me know if you still wish to proceed.`;
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
 * Generate vendor-specific CLI configuration
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
 * Generate FortiGate CLI configuration
 */
function generateFortiGateCLI(policy: any): string {
  // Handle port-specific service
  let service = 'ALL';
  if (policy.service) {
    // Handle array format from API
    if (Array.isArray(policy.service) && policy.service.length > 0) {
      service = policy.service[0].name || policy.service[0] || 'ALL';
    } else if (typeof policy.service === 'string') {
      service = policy.service;
    } else if (policy.service && typeof policy.service === 'object' && policy.service.name) {
      service = policy.service.name;
    }
  }
  
  if (policy.destPort && service === 'ALL') {
    service = `port-${policy.destPort}`;
  }
  
  // Extract values from arrays or objects if needed
  const extractValue = (value: any, defaultValue: string = 'any'): string => {
    if (Array.isArray(value) && value.length > 0) {
      // Handle array format: [{ name: "any" }]
      return value[0].name || value[0] || defaultValue;
    }
    if (value && typeof value === 'object' && value.name) {
      // Handle object format: { name: "any" }
      return value.name;
    }
    if (typeof value === 'string') {
      // Already a string
      return value;
    }
    return defaultValue;
  };
  
  const srcintf = extractValue(policy.srcintf, 'any');
  const dstintf = extractValue(policy.dstintf, 'any');
  const srcaddr = extractValue(policy.srcaddr, 'all');
  const dstaddr = extractValue(policy.dstaddr, 'all');
  
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
 * Generate Palo Alto CLI configuration
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
 * Generate Cisco ASA CLI configuration
 */
function generateCiscoASACLI(policy: any): string {
  const protocol = policy.protocol || 'tcp';
  const port = policy.destPort ? `eq ${policy.destPort}` : '';
  return `access-list ${policy['access-list'] || 'OUTSIDE_IN'} ${policy.action || 'permit'} ${protocol} ${policy.source || 'any'} ${policy.destination || 'any'} ${port}`.trim();
}

export async function firewallChatAgent(input: FirewallChatAgentInput): Promise<FirewallChatAgentOutput> {
  try {
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
        role: 'User',
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

    // Check if this is a list request
    const shouldListPolicies = isListPoliciesRequest(query);
    
    // Check if this might be a policy request (not a list request)
    const mightBePolicyRequest = !shouldListPolicies && isPolicyRequest(query);
    let policiesList: any[] = [];

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

    // Only proceed with policy creation if we have a potential policy request AND parsing succeeds
    // This ensures we only create policies when there's actual data (source IP, destination, port)
    let shouldCreatePolicy = false;
    if (mightBePolicyRequest) {
      try {
        // Parse policy request
        const parseResult = PolicyRequestParser.parse(query);
        if (parseResult.success && parseResult.data) {
          // Only set shouldCreatePolicy to true if parsing succeeded with valid data
          shouldCreatePolicy = true;
          parsedRequest = parseResult.data;
          missingJustification = !parsedRequest.businessJustification;
          
          // Check for duplicates/conflicts - this should happen for ALL valid policy requests
          const policyMatcher = new PolicyMatcherService();
          const matchResult = await policyMatcher.findExactMatches(parsedRequest);
          
          if (matchResult.hasMatch) {
            duplicateFound = true;
            matchedPolicies = matchResult.matchedPolicies;
          }
        }
      } catch (parseError) {
        console.error('Error parsing policy request:', parseError);
      }
    }

    // Generate response
    let aiResponse: string;
    if (shouldListPolicies) {
      // Check for FortiGate connection errors first
      if (fortigateConnectionError) {
        if (fortigateConnectionError === 'NO_DEVICES') {
          aiResponse = '⚠️ **FortiGate Firewall Not Connected**\n\nNo active FortiGate devices are configured. To list policies from your firewall:\n\n1. Go to **Settings** page\n2. Navigate to **Device Management** section\n3. Enter your FortiGate device credentials (Hostname/IP, API Username, API Key)\n4. Test the connection and save the device\n\nOnce connected, you can list policies directly from your FortiGate firewall.';
        } else {
          aiResponse = `⚠️ **FortiGate Firewall Connection Failed**\n\nUnable to connect to your FortiGate firewall device.\n\n**Error:** ${fortigateConnectionError}\n\n**To resolve:**\n1. Go to **Settings** → **Device Management**\n2. Verify your FortiGate credentials are correct\n3. Test the connection\n4. Ensure the firewall is reachable and API access is enabled\n\nI cannot show policies from the database as they may be outdated. Please connect to your FortiGate firewall to view current policies.`;
        }
      } else if (policiesList.length > 0) {
        aiResponse = formatPoliciesList(policiesList);
      } else {
        aiResponse = 'No policies found on the FortiGate firewall. Would you like me to help you create a new policy?';
      }
    } else {
      aiResponse = generateSimpleResponse(query, parsedRequest, duplicateFound, missingJustification, matchedPolicies);
    }

    // If this is a policy request and no duplicates found, create a ticket and draft policy
    if (shouldCreatePolicy && parsedRequest && !duplicateFound) {
      try {
        // Get the selected vendor configuration
        const selectedVendorConfig = getVendorById(vendor) || getDefaultVendor();
        
        // Convert to vendor-specific format (add action since parsedRequest doesn't have it)
        const policyWithAction = { ...parsedRequest, action: 'Allow' };
        const vendorPolicy = convertToVendorFormat(policyWithAction, selectedVendorConfig);
        
        // Validate the policy
        const validation = validatePolicy(vendorPolicy, selectedVendorConfig);
        if (!validation.valid) {
          console.error('Policy validation failed:', validation.errors);
          // Don't create ticket if validation fails
          aiResponse = `I couldn't create the policy because validation failed: ${validation.errors.join(', ')}. Please provide valid source IP, destination, and port information.`;
          shouldCreatePolicy = false;
        } else {
          // Generate vendor-specific CLI config first to validate it
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
          // Generate policy ID
          const policyId = `POL-${String(Date.now()).slice(-6)}`;
          
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

          // Create policy history entry
          try {
            const policyMatcher = new PolicyMatcherService();
            await policyMatcher.createPolicyHistory(
              policy.id,
              'created',
              userId,
              `Policy created via AI chat: ${query}`
            );
          } catch (historyError) {
            console.error('Error creating policy history:', historyError);
          }

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

    // Save bot response
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
    };
  } catch (error) {
    console.error('Error in firewallChatAgent:', error);
    return {
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
      conversationId: input.conversationId || 'error',
      ticketCreated: false,
      policyGenerated: false,
      duplicateFound: false,
      matchedPolicies: [],
      missingJustification: false,
    };
  }
}
