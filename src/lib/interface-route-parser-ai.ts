/**
 * AI-Powered Interface and Route Configuration Parser
 * Uses Google AI (Gemini) to extract interface and route configuration from natural language
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { isValidIpOrCidr } from './ip-validation';

// Schema for interface configuration request
const ParsedInterfaceRequestSchema = z.object({
  intent: z.enum(['create_interface', 'update_interface', 'delete_interface', 'list_interfaces']).describe('The intent of the request'),
  interfaceName: z.string().optional().describe('Interface name (e.g., port1, vlan100, loopback1)'),
  interfaceType: z.enum(['physical', 'vlan', 'loopback', 'aggregate', 'tunnel']).optional().describe('Interface type'),
  ipAddress: z.string().optional().describe('IP address (e.g., 10.10.10.1)'),
  subnetMask: z.string().optional().describe('Subnet mask (e.g., 255.255.255.0) or CIDR notation (e.g., /24)'),
  vdom: z.string().optional().describe('VDOM name if specified'),
  alias: z.string().optional().describe('Interface alias/description'),
  parentInterface: z.string().optional().describe('Parent interface for VLAN (e.g., port1)'),
  vlanId: z.number().optional().describe('VLAN ID for VLAN interfaces'),
});

// Schema for route configuration request
const ParsedRouteRequestSchema = z.object({
  intent: z.enum(['create_route', 'update_route', 'delete_route', 'list_routes']).describe('The intent of the request'),
  destination: z.string().optional().describe('Destination network (e.g., 0.0.0.0/0, 192.168.1.0/24)'),
  gateway: z.string().optional().describe('Gateway IP address (e.g., 10.0.0.1)'),
  device: z.string().optional().describe('Outgoing interface/device name'),
  distance: z.number().optional().describe('Route distance/priority'),
  priority: z.number().optional().describe('Route priority'),
  vdom: z.string().optional().describe('VDOM name if specified'),
  comment: z.string().optional().describe('Route comment/description'),
});

// Combined schema for interface or route request
const ParsedConfigRequestSchema = z.object({
  requestType: z.enum(['interface', 'route', 'unknown']).describe('Type of configuration request'),
  interface: ParsedInterfaceRequestSchema.optional(),
  route: ParsedRouteRequestSchema.optional(),
});

// AI prompt for parsing interface/route requests
const configParsePrompt = ai.definePrompt({
  name: 'configParsePrompt',
  input: {
    schema: z.object({
      query: z.string().describe('The natural language interface or route configuration request'),
    }),
  },
  output: {
    schema: ParsedConfigRequestSchema,
  },
  model: 'googleai/gemini-2.5-flash',
  config: {
    temperature: 0.1, // Low temperature for consistent extraction
  },
  prompt: `You are an expert network configuration parser. Extract structured information from natural language interface and route configuration requests.

Your task is to parse user queries and extract:
- requestType: Either "interface", "route", or "unknown"
- interface: If requestType is "interface", extract:
  - intent: "create_interface", "update_interface", "delete_interface", or "list_interfaces"
  - interfaceName: Interface name (e.g., "port1", "vlan100", "loopback1")
  - interfaceType: "physical", "vlan", "loopback", "aggregate", or "tunnel"
  - ipAddress: IP address (e.g., "10.10.10.1")
  - subnetMask: Subnet mask (e.g., "255.255.255.0") or CIDR prefix (e.g., "/24")
  - vdom: VDOM name if mentioned
  - alias: Interface description/alias
  - parentInterface: Parent interface for VLAN (e.g., "port1")
  - vlanId: VLAN ID number for VLAN interfaces

- route: If requestType is "route", extract:
  - intent: "create_route", "update_route", "delete_route", or "list_routes"
  - destination: Destination network in CIDR notation (e.g., "0.0.0.0/0", "192.168.1.0/24")
  - gateway: Gateway IP address (e.g., "10.0.0.1")
  - device: Outgoing interface name
  - distance: Route distance/priority (numeric)
  - priority: Route priority (numeric)
  - vdom: VDOM name if mentioned
  - comment: Route description/comment

Examples:
- "Create VLAN interface 100 with IP 10.10.10.1/24 on port1"
  → { requestType: "interface", interface: { intent: "create_interface", interfaceType: "vlan", vlanId: 100, ipAddress: "10.10.10.1", subnetMask: "/24", parentInterface: "port1" } }

- "Add static route to 192.168.1.0/24 via gateway 10.0.0.1"
  → { requestType: "route", route: { intent: "create_route", destination: "192.168.1.0/24", gateway: "10.0.0.1" } }

- "List all interfaces"
  → { requestType: "interface", interface: { intent: "list_interfaces" } }

- "Update interface port1 with IP 192.168.1.1/24"
  → { requestType: "interface", interface: { intent: "update_interface", interfaceName: "port1", ipAddress: "192.168.1.1", subnetMask: "/24" } }

IMPORTANT RULES:
1. Detect requestType first - look for keywords like "interface", "route", "vlan", "static route", "gateway"
2. For interfaces: interfaceName is often required for update/delete operations
3. For routes: destination and gateway are typically required for create operations
4. Extract CIDR notation if present (e.g., "10.10.10.1/24" should extract ipAddress: "10.10.10.1", subnetMask: "/24")
5. Infer interface type from name patterns: "vlan*" → vlan, "loopback*" → loopback, "port*" → physical
6. Extract VDOM if mentioned (e.g., "in vdom root", "on vdom1")

User Query: {{input.query}}
`,
});

export interface ParseResult {
  success: boolean;
  data?: {
    requestType: 'interface' | 'route' | 'unknown';
    interface?: {
      intent: 'create_interface' | 'update_interface' | 'delete_interface' | 'list_interfaces';
      interfaceName?: string;
      interfaceType?: 'physical' | 'vlan' | 'loopback' | 'aggregate' | 'tunnel';
      ipAddress?: string;
      subnetMask?: string;
      vdom?: string;
      alias?: string;
      parentInterface?: string;
      vlanId?: number;
    };
    route?: {
      intent: 'create_route' | 'update_route' | 'delete_route' | 'list_routes';
      destination?: string;
      gateway?: string;
      device?: string;
      distance?: number;
      priority?: number;
      vdom?: string;
      comment?: string;
    };
  };
  error?: string;
}

/**
 * AI-powered parser that uses Google AI (Gemini) to extract interface/route information
 */
export class AIInterfaceRouteParser {
  /**
   * Parse natural language interface/route request using Google AI
   */
  static async parse(query: string): Promise<ParseResult> {
    try {
      // Call the AI prompt to extract configuration information
      const result = await configParsePrompt({ input: { query } });

      if (!result.output) {
        return {
          success: false,
          error: 'AI parser returned no output. Please provide a valid interface or route configuration request.',
        };
      }

      const parsedData = result.output;

      // Validate based on request type
      if (parsedData.requestType === 'interface' && parsedData.interface) {
        const interfaceData = parsedData.interface;
        
        // Validate IP address if provided
        if (interfaceData.ipAddress && !isValidIpOrCidr(interfaceData.ipAddress)) {
          return {
            success: false,
            error: `Invalid IP address format: "${interfaceData.ipAddress}". Please provide a valid IPv4 address (e.g., 10.10.10.1)`,
          };
        }

        // For create/update operations, require interface name or type
        if ((interfaceData.intent === 'create_interface' || interfaceData.intent === 'update_interface') && 
            !interfaceData.interfaceName && !interfaceData.interfaceType) {
          return {
            success: false,
            error: 'Interface name or type is required for create/update operations.',
          };
        }
      }

      if (parsedData.requestType === 'route' && parsedData.route) {
        const routeData = parsedData.route;
        
        // Validate destination if provided
        if (routeData.destination && !isValidIpOrCidr(routeData.destination)) {
          return {
            success: false,
            error: `Invalid destination format: "${routeData.destination}". Please provide a valid CIDR notation (e.g., 192.168.1.0/24)`,
          };
        }

        // Validate gateway if provided
        if (routeData.gateway && !isValidIpOrCidr(routeData.gateway)) {
          return {
            success: false,
            error: `Invalid gateway IP address: "${routeData.gateway}". Please provide a valid IPv4 address`,
          };
        }

        // For create operations, require destination and gateway
        if (routeData.intent === 'create_route' && (!routeData.destination || !routeData.gateway)) {
          return {
            success: false,
            error: 'Destination network and gateway are required for creating a static route.',
          };
        }
      }

      return {
        success: true,
        data: parsedData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse request: ${error.message || String(error)}`,
      };
    }
  }

  /**
   * Quick check if query looks like an interface/route request (synchronous)
   */
  static isInterfaceRouteRequest(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const interfaceKeywords = ['interface', 'vlan', 'loopback', 'port', 'aggregate', 'tunnel'];
    const routeKeywords = ['route', 'static route', 'gateway', 'routing', 'next hop'];
    
    return interfaceKeywords.some(kw => lowerQuery.includes(kw)) || 
           routeKeywords.some(kw => lowerQuery.includes(kw));
  }
}

