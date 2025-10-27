/**
 * Log Simulator - Generates realistic firewall logs for monitoring and testing
 */

import { PrismaClient } from '../generated/prisma';

export type LogPattern = 'normal' | 'anomaly' | 'attack';

export interface FirewallLogEntry {
  sourceIp: string;
  destIp: string;
  sourcePort: number;
  destPort: number;
  protocol: string;
  action: 'Allow' | 'Deny' | 'Drop';
  policyId?: string;
  deviceName: string;
  severity: 'Info' | 'Warning' | 'Critical';
  message: string | null;
}

const prisma = new PrismaClient();

// Predefined IP ranges for simulation
const INTERNAL_IPS = [
  '10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4', '10.0.0.5',
  '10.1.1.10', '10.1.1.11', '10.1.1.12', '10.1.1.13', '10.1.1.14',
  '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103'
];

const EXTERNAL_IPS = [
  '203.0.113.45', '198.51.100.123', '203.0.113.67', '198.51.100.89',
  '203.0.113.23', '198.51.100.34', '203.0.113.156', '198.51.100.78',
  '45.67.89.123', '98.76.54.32', '23.45.67.89', '12.34.56.78'
];

const DEVICES = ['FW-Primary-DC1', 'FW-Secondary-DC1', 'FW-Branch-Office-A', 'FW-Cloud-VPC', 'FW-DMZ'];

const PROTOCOLS = ['TCP', 'UDP', 'ICMP'];
const COMMON_PORTS = [80, 443, 22, 53, 3389, 3306, 5432, 8080];

/**
 * Generate a random IP from predefined lists
 */
function randomIp(type: 'internal' | 'external'): string {
  return type === 'internal' 
    ? INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)]
    : EXTERNAL_IPS[Math.floor(Math.random() * EXTERNAL_IPS.length)];
}

/**
 * Generate a normal traffic log entry
 */
function generateNormalLog(): FirewallLogEntry {
  const isExternalToInternal = Math.random() > 0.5;
  const sourceIp = isExternalToInternal ? randomIp('external') : randomIp('internal');
  const destIp = isExternalToInternal ? randomIp('internal') : randomIp('external');
  
  return {
    sourceIp,
    destIp,
    sourcePort: Math.floor(Math.random() * 50000) + 1024,
    destPort: COMMON_PORTS[Math.floor(Math.random() * COMMON_PORTS.length)],
    protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
    action: Math.random() > 0.2 ? 'Allow' : 'Deny',
    deviceName: DEVICES[Math.floor(Math.random() * DEVICES.length)],
    severity: 'Info',
    message: null,
  };
}

/**
 * Generate an anomaly traffic log entry
 */
function generateAnomalyLog(): FirewallLogEntry {
  return {
    sourceIp: randomIp('external'),
    destIp: randomIp('internal'),
    sourcePort: Math.floor(Math.random() * 65535),
    destPort: Math.floor(Math.random() * 65535),
    protocol: 'TCP',
    action: 'Deny',
    deviceName: DEVICES[Math.floor(Math.random() * DEVICES.length)],
    severity: 'Warning',
    message: 'Unusual connection pattern detected',
  };
}

/**
 * Generate an attack signature log entry
 */
function generateAttackLog(): FirewallLogEntry {
  const attackType = ['PortScan', 'BruteForce', 'Malware', 'DDoS'];
  const attack = attackType[Math.floor(Math.random() * attackType.length)];
  
  return {
    sourceIp: randomIp('external'),
    destIp: randomIp('internal'),
    sourcePort: Math.floor(Math.random() * 65535),
    destPort: COMMON_PORTS[Math.floor(Math.random() * COMMON_PORTS.length)],
    protocol: 'TCP',
    action: 'Drop',
    deviceName: DEVICES[Math.floor(Math.random() * DEVICES.length)],
    severity: 'Critical',
    message: `Potential ${attack} attack detected from source`,
  };
}

/**
 * Generate logs based on pattern
 */
export function generateLogs(pattern: LogPattern, count: number): FirewallLogEntry[] {
  const logs: FirewallLogEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    let log: FirewallLogEntry;
    
    switch (pattern) {
      case 'normal':
        log = generateNormalLog();
        break;
      case 'anomaly':
        log = Math.random() > 0.5 ? generateAnomalyLog() : generateNormalLog();
        break;
      case 'attack':
        log = Math.random() > 0.7 ? generateAttackLog() : generateAnomalyLog();
        break;
      default:
        log = generateNormalLog();
    }
    
    logs.push(log);
  }
  
  return logs;
}

/**
 * Store generated logs in database
 */
export async function storeLogs(logs: FirewallLogEntry[]): Promise<void> {
  for (const log of logs) {
    await prisma.firewallLog.create({
      data: {
        timestamp: new Date(),
        sourceIp: log.sourceIp,
        destIp: log.destIp,
        sourcePort: log.sourcePort,
        destPort: log.destPort,
        protocol: log.protocol,
        action: log.action,
        policyId: log.policyId,
        deviceName: log.deviceName,
        severity: log.severity,
        message: log.message,
      },
    });
  }
}

/**
 * Generate and store logs in one operation
 */
export async function generateAndStoreLogs(pattern: LogPattern = 'normal', count: number = 10): Promise<void> {
  const logs = generateLogs(pattern, count);
  await storeLogs(logs);
}

