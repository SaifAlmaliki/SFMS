/**
 * FortiGate REST API Integration (Legacy Compatibility Layer)
 * This file provides backward compatibility with the old API structure
 * while using the new modular FortiGate API client under the hood
 */

import { FORTIGATE_VENDOR, FortiGatePolicy, validatePolicy } from './firewall-vendors';
import { FortiGateClient, FortiGateDevice as NewFortiGateDevice, FortiGateApiResponse as NewFortiGateApiResponse } from './fortigate/index';
import { MockFortiGateClient } from './fortigate/mock-client';

// Re-export types for backward compatibility
export interface FortiGateDevice {
  id?: string;
  name: string;
  ip: string;
  apiKey: string;
  version?: string;
}

export interface FortiGateApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export interface FortiGatePolicyResponse {
  id: string;
  name: string;
  srcintf: string;
  dstintf: string;
  srcaddr: string;
  dstaddr: string;
  action: string;
  schedule: string;
  service: string;
  logtraffic: string;
  comments?: string;
}

/**
 * Legacy FortiGate API Client (wraps new modular client)
 * @deprecated Use FortiGateClient from './fortigate' for new code
 */
export class FortiGateApiClient {
  protected client: FortiGateClient;

  constructor(device: FortiGateDevice) {
    const newDevice: NewFortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version,
    };
    this.client = new FortiGateClient(newDevice);
  }

  /**
   * Test connection to FortiGate device
   */
  async testConnection(): Promise<FortiGateApiResponse> {
    return this.client.testConnection();
  }

  /**
   * Get all firewall policies
   */
  async getPolicies(): Promise<FortiGateApiResponse> {
    return this.client.firewall.getPolicies();
  }

  /**
   * Create a new firewall policy
   */
  async createPolicy(policy: FortiGatePolicy): Promise<FortiGateApiResponse> {
    // Validate policy against FortiGate rules
    const validation = validatePolicy(policy, FORTIGATE_VENDOR);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    return this.client.firewall.createPolicy(policy);
  }

  /**
   * Update an existing firewall policy
   */
  async updatePolicy(policyId: string, policy: FortiGatePolicy): Promise<FortiGateApiResponse> {
    const validation = validatePolicy(policy, FORTIGATE_VENDOR);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    return this.client.firewall.updatePolicy(policyId, policy);
  }

  /**
   * Delete a firewall policy
   */
  async deletePolicy(policyId: string): Promise<FortiGateApiResponse> {
    return this.client.firewall.deletePolicy(policyId);
  }

  /**
   * Get system status and information
   */
  async getSystemInfo(): Promise<FortiGateApiResponse> {
    return this.client.system.getGlobal();
  }

  /**
   * Get address objects
   */
  async getAddressObjects(): Promise<FortiGateApiResponse> {
    return this.client.firewall.getAddresses();
  }

  /**
   * Get service objects
   */
  async getServiceObjects(): Promise<FortiGateApiResponse> {
    return this.client.firewall.getCustomServices();
  }
}

/**
 * Mock FortiGate API for development/testing
 * @deprecated Use MockFortiGateClient from './fortigate/mock-client' for new code
 */
export class MockFortiGateApiClient extends FortiGateApiClient {
  constructor(device: FortiGateDevice) {
    super(device);
    const newDevice: NewFortiGateDevice = {
      id: device.id,
      name: device.name,
      ip: device.ip,
      apiKey: device.apiKey,
      version: device.version,
    };
    this.client = new MockFortiGateClient(newDevice);
  }
}

/**
 * Create a FortiGate API client (real or mock based on environment)
 */
export function createFortiGateClient(device: FortiGateDevice, useMock: boolean = false): FortiGateApiClient {
  if (useMock || process.env.NODE_ENV === 'development') {
    return new MockFortiGateApiClient(device);
  }
  return new FortiGateApiClient(device);
}
