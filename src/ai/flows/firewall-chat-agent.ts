/**
 * @fileOverview Enhanced AI chatbot for firewall management with FortiGate-specific support
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PrismaClient } from '../../generated/prisma';
import { FORTIGATE_VENDOR, convertToVendorFormat, validatePolicy } from '@/lib/firewall-vendors';

const prisma = new PrismaClient();

const FirewallChatAgentInputSchema = z.object({
  query: z.string().describe('The user\'s natural language query or request'),
  userId: z.string().describe('The ID of the user making the request'),
  conversationId: z.string().optional().describe('Optional conversation ID for context'),
  vendor: z.string().optional().describe('Firewall vendor (fortigate, paloalto, cisco)'),
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
  ];
  
  const lowerQuery = query.toLowerCase();
  return policyKeywords.some(keyword => lowerQuery.includes(keyword));
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
  const { query, userId, conversationId, vendor = 'fortigate' } = input;
  
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

  // Check if this is a policy request
  const shouldCreatePolicy = isPolicyRequest(query);
  const policyDetails = shouldCreatePolicy ? parsePolicyRequest(query) : null;
  
  let ticketId: string | undefined;
  let ticketCreated = false;
  let policyGenerated = false;
  let cliConfig: string | undefined;

  // Build context for AI with vendor-specific information
  let systemContext = `You are an expert firewall administrator assistant helping users manage ${vendor.toUpperCase()} firewall policies.
You can help create policies, answer questions about firewall configurations, and provide security recommendations.
Be concise and helpful.`;
  
  if (shouldCreatePolicy && policyDetails) {
    systemContext += `\n\nThe user wants to create a ${vendor.toUpperCase()} firewall policy:
- Action: ${policyDetails.action}
- Source: ${policyDetails.source}
- Destination: ${policyDetails.destination}
- Policy Name: ${policyDetails.name}

Generate this policy in ${vendor.toUpperCase()} format and explain what it does. Then create a change ticket for admin approval.`;
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

  // If this is a policy request, create a ticket and draft policy
  if (shouldCreatePolicy && policyDetails) {
    try {
      // Convert to vendor-specific format
      const vendorPolicy = convertToVendorFormat(policyDetails, FORTIGATE_VENDOR);
      
      // Validate the policy
      const validation = validatePolicy(vendorPolicy, FORTIGATE_VENDOR);
      if (!validation.valid) {
        console.error('Policy validation failed:', validation.errors);
      }
      
      // Generate CLI configuration for FortiGate
      cliConfig = generateFortiGateCLI(vendorPolicy);
      
      // Create draft policy
      const policyCount = await prisma.policy.count();
      const policyId = `POL-${String(policyCount + 1).padStart(3, '0')}`;
      
      const policy = await prisma.policy.create({
        data: {
          id: policyId,
          name: policyDetails.name,
          source: policyDetails.source,
          destination: policyDetails.destination,
          action: policyDetails.action,
          status: 'PendingApproval',
          vendor: vendor,
          rawConfig: vendorPolicy,
          cliConfig: cliConfig,
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
          title: `Create ${vendor.toUpperCase()} Policy: ${policyDetails.name}`,
          description: `${vendor.toUpperCase()} policy requested via AI chat: ${query}`,
          status: 'PendingApproval',
          priority: 'Medium',
        },
      });
      
      ticketId = ticket.id;
      ticketCreated = true;
      policyGenerated = true;
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
  };
}

/**
 * Generate FortiGate CLI configuration from policy
 */
function generateFortiGateCLI(policy: any): string {
  return `config firewall policy
  edit 0
    set name "${policy.name}"
    set srcintf "${policy.srcintf}"
    set dstintf "${policy.dstintf}"
    set srcaddr "${policy.srcaddr}"
    set dstaddr "${policy.dstaddr}"
    set action ${policy.action}
    set schedule "${policy.schedule}"
    set service "${policy.service}"
    set logtraffic ${policy.logtraffic}
    ${policy.comments ? `set comments "${policy.comments}"` : ''}
  next
end`;
}

