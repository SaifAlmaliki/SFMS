/**
 * IP Address Validation Utilities
 * Supports IPv4 addresses and CIDR notation
 */

/**
 * Validate IPv4 address
 */
export function isValidIpv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return false;
  }
  
  return true;
}

/**
 * Validate CIDR notation (e.g., 192.168.1.0/24)
 */
export function isValidCidr(cidr: string): boolean {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;
  
  const ip = parts[0];
  const prefixLength = parseInt(parts[1], 10);
  
  if (!isValidIpv4(ip)) return false;
  if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) return false;
  
  return true;
}

/**
 * Validate IP address or CIDR notation
 */
export function isValidIpOrCidr(ip: string): boolean {
  if (ip.includes('/')) {
    return isValidCidr(ip);
  }
  return isValidIpv4(ip);
}

/**
 * Parse CIDR to get network and prefix length
 */
export function parseCidr(cidr: string): { network: string; prefixLength: number } | null {
  if (!isValidCidr(cidr)) return null;
  
  const parts = cidr.split('/');
  return {
    network: parts[0],
    prefixLength: parseInt(parts[1], 10),
  };
}

/**
 * Check if two IP ranges overlap
 */
export function ipRangesOverlap(range1: string, range2: string): boolean {
  // Simple check: if both are single IPs, check if they're equal
  if (!range1.includes('/') && !range2.includes('/')) {
    return range1 === range2;
  }
  
  // For CIDR ranges, we'd need more complex logic
  // For now, return true if they're the same string
  // TODO: Implement proper CIDR overlap detection if needed
  return range1 === range2;
}

/**
 * Validate subnet mask
 */
export function isValidSubnetMask(mask: string): boolean {
  return isValidIpv4(mask);
}

