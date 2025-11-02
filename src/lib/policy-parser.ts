/**
 * Policy Request Parser
 * Parses natural language firewall policy requests to extract structured data
 */

export interface ParsedPolicyRequest {
  sourceIp: string;          // Required
  destinationIp?: string;    // One of these required
  destinationFqdn?: string;
  destinationUrl?: string;
  port: number;              // Required
  protocol?: string;
  businessJustification?: string;
  targetDevice?: string;
  sourceZone?: string;
  destinationZone?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedPolicyRequest;
  error?: string;
  warnings?: string[];
}

export class PolicyRequestParser {
  /**
   * Parse natural language policy request
   */
  static parse(query: string): ParseResult {
    const warnings: string[] = [];
    
    try {
      // Extract source IP
      const sourceIp = this.extractSourceIp(query);
      if (!sourceIp) {
        return {
          success: false,
          error: 'Source IP address is required. Please specify the source IP (e.g., "10.1.1.5")'
        };
      }

      // Extract destination
      const destination = this.extractDestination(query);
      if (!destination.ip && !destination.fqdn && !destination.url) {
        return {
          success: false,
          error: 'Destination is required. Please specify destination IP, FQDN, or URL (e.g., "192.168.1.10", "api.example.com", "https://service.company.com")'
        };
      }

      // Extract port
      const port = this.extractPort(query);
      if (!port) {
        return {
          success: false,
          error: 'Port number is required. Please specify the destination port (e.g., ":443", "port 8080")'
        };
      }

      // Extract business justification
      const businessJustification = this.extractBusinessJustification(query);
      if (!businessJustification) {
        warnings.push('Business justification is missing. This may delay approval.');
      }

      // Extract other optional fields
      const protocol = this.extractProtocol(query);
      const targetDevice = this.extractTargetDevice(query);
      const sourceZone = this.extractSourceZone(query);
      const destinationZone = this.extractDestinationZone(query);

      const result: ParsedPolicyRequest = {
        sourceIp,
        port,
        protocol,
        businessJustification,
        targetDevice,
        sourceZone,
        destinationZone
      };

      // Add destination based on what was found
      if (destination.ip) {
        result.destinationIp = destination.ip;
      } else if (destination.fqdn) {
        result.destinationFqdn = destination.fqdn;
      } else if (destination.url) {
        result.destinationUrl = destination.url;
      }

      return {
        success: true,
        data: result,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to parse policy request'
      };
    }
  }

  /**
   * Extract source IP address
   */
  private static extractSourceIp(query: string): string | null {
    // Patterns for source IP extraction
    const patterns = [
      /(?:from|source|src)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i,
      /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(?:to|towards|->)/i,
      /allow\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i,
      /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(?:access|connection)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && this.isValidIp(match[1])) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract destination (IP, FQDN, or URL)
   */
  private static extractDestination(query: string): { ip?: string; fqdn?: string; url?: string } {
    const result: { ip?: string; fqdn?: string; url?: string } = {};

    // Extract IP address
    const ipPattern = /(?:to|towards|->)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i;
    const ipMatch = query.match(ipPattern);
    if (ipMatch && this.isValidIp(ipMatch[1])) {
      result.ip = ipMatch[1];
      return result;
    }

    // Extract URL
    const urlPattern = /(https?:\/\/[^\s]+)/i;
    const urlMatch = query.match(urlPattern);
    if (urlMatch) {
      result.url = urlMatch[1];
      return result;
    }

    // Extract FQDN
    const fqdnPattern = /(?:to|towards|->)\s+([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*)/i;
    const fqdnMatch = query.match(fqdnPattern);
    if (fqdnMatch && !this.isValidIp(fqdnMatch[1])) {
      result.fqdn = fqdnMatch[1];
      return result;
    }

    return result;
  }

  /**
   * Extract port number
   * Must not extract numbers that are part of IP addresses
   */
  private static extractPort(query: string): number | null {
    // First, extract all IP addresses to exclude them from port matching
    const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
    const ips = query.match(ipPattern) || [];
    
    // Patterns for port extraction (in order of specificity)
    const patterns = [
      /:(\d{1,5})\b/g,                    // :443, :8080 (must be after colon)
      /port\s+(\d{1,5})\b/gi,             // port 443, port 8080
      /(?:on|at)\s+port\s+(\d{1,5})\b/gi, // on port 443, at port 8080
      /(?:on|at)\s+(\d{1,5})\b/gi,        // on 443, at 8080 (but not part of IP)
    ];

    for (const pattern of patterns) {
      const matches = query.matchAll(pattern);
      for (const match of matches) {
        const portNum = parseInt(match[1]);
        if (portNum >= 1 && portNum <= 65535) {
          // Check if this number is part of an IP address
          const matchIndex = match.index || 0;
          const matchText = match[0];
          
          // Check if the matched number is within any IP address in the query
          let isPartOfIp = false;
          for (const ip of ips) {
            const ipIndex = query.indexOf(ip);
            if (ipIndex !== -1 && matchIndex >= ipIndex && matchIndex < ipIndex + ip.length) {
              isPartOfIp = true;
              break;
            }
          }
          
          // Also check if the number appears right before "to" and might be part of IP
          // Skip if it's a single digit followed by " to" (likely part of IP like "x.x.x.5 to")
          if (!isPartOfIp && matchText.match(/^\d\s+to$/i)) {
            isPartOfIp = true;
          }
          
          if (!isPartOfIp) {
            return portNum;
          }
        }
      }
    }

    // Default ports for common protocols (only if explicitly mentioned)
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('https') || lowerQuery.includes('ssl')) return 443;
    if (lowerQuery.includes('http') && !lowerQuery.includes('https')) return 80;
    if (lowerQuery.includes('ssh')) return 22;
    if (lowerQuery.includes('ftp')) return 21;
    if (lowerQuery.includes('smtp')) return 25;
    if (lowerQuery.includes('dns')) return 53;
    if (lowerQuery.includes('pop3')) return 110;
    if (lowerQuery.includes('imap')) return 143;
    if (lowerQuery.includes('ldap')) return 389;
    if (lowerQuery.includes('mysql')) return 3306;
    if (lowerQuery.includes('postgresql') || lowerQuery.includes('postgres')) return 5432;
    if (lowerQuery.includes('oracle')) return 1521;
    if (lowerQuery.includes('mssql') || lowerQuery.includes('sql server')) return 1433;

    return null;
  }

  /**
   * Extract business justification
   */
  private static extractBusinessJustification(query: string): string | null {
    const patterns = [
      /(?:for|because|reason|justification|purpose|need|require)\s+(.+?)(?:\s+(?:from|to|port|on|at)|$)/i,
      /(?:to|in order to|so that)\s+(.+?)(?:\s+(?:from|to|port|on|at)|$)/i,
      /(?:access|connect|reach|use)\s+(.+?)(?:\s+(?:from|to|port|on|at)|$)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1].trim().length > 3) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract protocol
   */
  private static extractProtocol(query: string): string | null {
    const protocols = ['tcp', 'udp', 'icmp', 'http', 'https', 'ssh', 'ftp', 'smtp', 'dns'];
    
    for (const protocol of protocols) {
      if (query.toLowerCase().includes(protocol)) {
        return protocol.toUpperCase();
      }
    }

    return null;
  }

  /**
   * Extract target device
   */
  private static extractTargetDevice(query: string): string | null {
    const patterns = [
      /(?:on|device|firewall)\s+([a-zA-Z0-9\-_]+)/i,
      /(?:deploy|apply)\s+(?:to|on)\s+([a-zA-Z0-9\-_]+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1].length > 2) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract source zone
   */
  private static extractSourceZone(query: string): string | null {
    const zones = ['internal', 'dmz', 'external', 'wan', 'lan', 'trust', 'untrust'];
    
    for (const zone of zones) {
      if (query.toLowerCase().includes(`from ${zone}`) || 
          query.toLowerCase().includes(`source ${zone}`)) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Extract destination zone
   */
  private static extractDestinationZone(query: string): string | null {
    const zones = ['internal', 'dmz', 'external', 'wan', 'lan', 'trust', 'untrust'];
    
    for (const zone of zones) {
      if (query.toLowerCase().includes(`to ${zone}`) || 
          query.toLowerCase().includes(`destination ${zone}`)) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Validate IP address (public method for validation)
   */
  static isValidIp(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    for (const part of parts) {
      const num = parseInt(part);
      if (isNaN(num) || num < 0 || num > 255) return false;
    }
    
    return true;
  }

  /**
   * Extract domain from URL
   */
  static extractDomainFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Get default port for protocol
   */
  static getDefaultPort(protocol: string): number | null {
    const defaultPorts: Record<string, number> = {
      'HTTP': 80,
      'HTTPS': 443,
      'SSH': 22,
      'FTP': 21,
      'SMTP': 25,
      'DNS': 53,
      'POP3': 110,
      'IMAP': 143,
      'LDAP': 389,
      'MYSQL': 3306,
      'POSTGRESQL': 5432,
      'ORACLE': 1521,
      'MSSQL': 1433,
      'RDP': 3389,
      'TELNET': 23,
      'SNMP': 161
    };

    return defaultPorts[protocol.toUpperCase()] || null;
  }
}
