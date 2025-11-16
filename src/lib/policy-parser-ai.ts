/**
 * AI-Powered Policy Request Parser
 * Uses Google AI (Gemini) via genkit to extract structured policy information from natural language queries
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Re-export types from policy-parser for compatibility
export type { ParsedPolicyRequest, ParseResult } from './policy-parser';
import type { ParsedPolicyRequest, ParseResult } from './policy-parser';

// Schema for structured output from AI
const ParsedPolicyRequestSchema = z.object({
  sourceIp: z.string().describe('Source IP address (required, must be valid IPv4 or CIDR)'),
  destinationIp: z.string().optional().describe('Destination IP address (if specified, must be valid IPv4 or CIDR)'),
  destinationFqdn: z.string().optional().describe('Fully qualified domain name (if specified instead of IP)'),
  destinationUrl: z.string().optional().describe('URL (if specified instead of IP/FQDN)'),
  port: z.number().describe('Port number (required, must be between 1-65535)'),
  protocol: z.string().optional().describe('Network protocol (TCP, UDP, ICMP, etc.) if mentioned'),
  action: z.enum(['Allow', 'Deny']).optional().describe('Action: Allow or Deny based on keywords like "block", "deny", "allow", "permit"'),
  sourceZone: z.string().optional().describe('Source zone/interface name if mentioned (e.g., "Internal", "DMZ", "Public")'),
  destinationZone: z.string().optional().describe('Destination zone/interface name if mentioned'),
  businessJustification: z.string().optional().describe('Business reason or justification mentioned in the query'),
  targetDevice: z.string().optional().describe('Target device name if mentioned'),
});

// Define the AI prompt for policy parsing
const policyParsePrompt = ai.definePrompt({
  name: 'policyParsePrompt',
  inputSchema: z.object({
    query: z.string().describe('The natural language firewall policy request'),
  }),
  outputSchema: ParsedPolicyRequestSchema,
  config: {
    model: 'googleai/gemini-2.5-flash',
    temperature: 0.1, // Low temperature for consistent extraction
  },
  prompt: `You are an expert firewall policy parser. Extract structured information from natural language firewall policy requests.

Your task is to parse user queries and extract:
- sourceIp: The source IP address (required, must be a valid IPv4 address or CIDR notation like 192.168.1.0/24)
- destinationIp: Destination IP address (if specified, must be valid IPv4 or CIDR)
- destinationFqdn: Fully qualified domain name (if specified instead of IP, e.g., "api.example.com")
- destinationUrl: URL (if specified instead of IP/FQDN, e.g., "https://service.company.com")
- port: Port number (required, must be between 1-65535)
- protocol: Network protocol (TCP, UDP, ICMP, etc.) if mentioned
- action: Either "Allow" or "Deny" based on keywords like "block", "deny", "allow", "permit"
- sourceZone: Source zone/interface name if mentioned (e.g., "Internal", "DMZ", "Public", "WAN", "LAN")
- destinationZone: Destination zone/interface name if mentioned
- businessJustification: Any business reason or justification mentioned in the query
- targetDevice: Target device name if mentioned

Examples:
- "Block 192.168.1.100 from accessing 10.0.0.5 on port 80" 
  → { sourceIp: "192.168.1.100", destinationIp: "10.0.0.5", port: 80, action: "Deny" }
  
- "Allow 10.1.1.5 to connect to api.example.com on port 443"
  → { sourceIp: "10.1.1.5", destinationFqdn: "api.example.com", port: 443, action: "Allow" }
  
- "Permit traffic from Internal zone to DMZ zone for 192.168.1.0/24 to 10.0.0.0/24 on port 8080"
  → { sourceIp: "192.168.1.0/24", destinationIp: "10.0.0.0/24", port: 8080, sourceZone: "Internal", destinationZone: "DMZ", action: "Allow" }

- "Allow 10.1.1.5 to access https://api.service.com on port 443 for database synchronization"
  → { sourceIp: "10.1.1.5", destinationUrl: "https://api.service.com", port: 443, action: "Allow", businessJustification: "database synchronization" }

IMPORTANT RULES:
1. sourceIp is REQUIRED - if not found, return null for all fields
2. At least one destination (destinationIp, destinationFqdn, or destinationUrl) is REQUIRED
3. port is REQUIRED - if not explicitly mentioned, infer from protocol (HTTP=80, HTTPS=443, SSH=22, etc.)
4. If action is not specified, default to "Allow" unless keywords like "block", "deny", "prevent" are present
5. Extract CIDR notation if present (e.g., "192.168.1.0/24")
6. Extract zones if mentioned (Internal, DMZ, External, WAN, LAN, Trust, Untrust)
7. Extract business justification if mentioned (phrases like "for", "because", "to enable", "for the purpose of")

User Query: {{{query}}}
`,
});

/**
 * AI-powered parser that uses Google AI (Gemini) to extract policy information
 */
export class AIPolicyRequestParser {
  /**
   * Parse natural language policy request using Google AI
   */
  static async parse(query: string): Promise<ParseResult> {
    try {
      // Call the AI prompt to extract policy information
      const result = await policyParsePrompt({ query });

      if (!result.output) {
        return {
          success: false,
          error: 'AI parser returned no output. Please provide a valid policy request with source IP, destination, and port.'
        };
      }

      const parsedData = result.output;

      // Validate required fields
      if (!parsedData.sourceIp) {
        return {
          success: false,
          error: 'Source IP address is required. Please specify the source IP (e.g., "10.1.1.5" or "192.168.1.0/24")'
        };
      }

      // Validate IP format (basic check for IPv4 or CIDR)
      const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/(\d{1,2}))?$/;
      if (!ipPattern.test(parsedData.sourceIp)) {
        return {
          success: false,
          error: `Invalid source IP address format: "${parsedData.sourceIp}". Please provide a valid IPv4 address (e.g., 10.1.1.5) or CIDR notation (e.g., 192.168.1.0/24)`
        };
      }

      // Validate destination (at least one must be present)
      if (!parsedData.destinationIp && !parsedData.destinationFqdn && !parsedData.destinationUrl) {
        return {
          success: false,
          error: 'Destination is required. Please specify destination IP, FQDN, or URL (e.g., "192.168.1.10", "api.example.com", "https://service.company.com")'
        };
      }

      // Validate destination IP if provided
      if (parsedData.destinationIp && !ipPattern.test(parsedData.destinationIp)) {
        return {
          success: false,
          error: `Invalid destination IP address format: "${parsedData.destinationIp}". Please provide a valid IPv4 address or CIDR notation`
        };
      }

      // Validate port
      if (!parsedData.port || parsedData.port < 1 || parsedData.port > 65535) {
        return {
          success: false,
          error: `Invalid port number: "${parsedData.port}". Port must be between 1 and 65535`
        };
      }

      // Build the parsed request
      const resultData: ParsedPolicyRequest = {
        sourceIp: parsedData.sourceIp,
        port: parsedData.port,
      };

      // Add destination (one of IP, FQDN, or URL)
      if (parsedData.destinationIp) {
        resultData.destinationIp = parsedData.destinationIp;
      } else if (parsedData.destinationFqdn) {
        resultData.destinationFqdn = parsedData.destinationFqdn;
      } else if (parsedData.destinationUrl) {
        resultData.destinationUrl = parsedData.destinationUrl;
      }

      // Add optional fields
      if (parsedData.protocol) {
        resultData.protocol = parsedData.protocol;
      }
      if (parsedData.sourceZone) {
        resultData.sourceZone = parsedData.sourceZone;
      }
      if (parsedData.destinationZone) {
        resultData.destinationZone = parsedData.destinationZone;
      }
      if (parsedData.businessJustification) {
        resultData.businessJustification = parsedData.businessJustification;
      }
      if (parsedData.targetDevice) {
        resultData.targetDevice = parsedData.targetDevice;
      }
      if (parsedData.action) {
        resultData.action = parsedData.action;
      }

      return {
        success: true,
        data: resultData
      };

    } catch (error: any) {
      // Handle Google AI API errors
      if (error.message?.includes('GOOGLE_API_KEY') || error.message?.includes('API key')) {
        return {
          success: false,
          error: 'Google AI API key is not configured. Please set GOOGLE_API_KEY environment variable.'
        };
      }

      if (error.status === 401 || error.status === 403) {
        return {
          success: false,
          error: 'Google AI API authentication failed. Please check your API key.'
        };
      }

      if (error.status === 429) {
        return {
          success: false,
          error: 'Google AI API rate limit exceeded. Please try again later.'
        };
      }

      console.error('AI Policy Parser Error:', error);
      return {
        success: false,
        error: `Failed to parse policy request: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Check if a query looks like a policy request (quick check before calling AI)
   * This is a synchronous method that doesn't call the API
   */
  static isPolicyRequest(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Keywords that suggest a policy request
    const policyKeywords = [
      'block', 'allow', 'deny', 'permit',
      'firewall', 'policy', 'rule',
      'access', 'connect', 'connection',
      'port', 'protocol', 'tcp', 'udp',
      'zone', 'interface'
    ];

    // IP address pattern
    const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    
    // Port pattern
    const portPattern = /(?:port|:)\s*\d{1,5}/i;

    const hasKeyword = policyKeywords.some(keyword => lowerQuery.includes(keyword));
    const hasIp = ipPattern.test(query);
    const hasPort = portPattern.test(query);

    // If it has policy keywords AND (IP or port), it's likely a policy request
    return hasKeyword && (hasIp || hasPort);
  }

  /**
   * Validate IP address (public method for validation)
   */
  static isValidIp(ip: string): boolean {
    // Support both IP and CIDR notation
    const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(\/(\d{1,2}))?$/;
    if (!ipPattern.test(ip)) return false;
    
    const parts = ip.split('/')[0].split('.');
    if (parts.length !== 4) return false;
    
    for (const part of parts) {
      const num = parseInt(part);
      if (isNaN(num) || num < 0 || num > 255) return false;
    }
    
    // If CIDR notation, validate subnet mask
    if (ip.includes('/')) {
      const mask = parseInt(ip.split('/')[1]);
      if (isNaN(mask) || mask < 0 || mask > 32) return false;
    }
    
    return true;
  }
}

