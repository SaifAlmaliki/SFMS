/**
 * FortiGate REST API Integration
 * Handles communication with FortiGate firewalls
 */

import { FORTIGATE_VENDOR, FortiGatePolicy, validatePolicy } from './firewall-vendors';

export interface FortiGateDevice {
  id: string;
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
 * FortiGate API Client
 */
export class FortiGateApiClient {
  private device: FortiGateDevice;
  private baseUrl: string;

  constructor(device: FortiGateDevice) {
    this.device = device;
    this.baseUrl = `https://${device.ip}`;
  }

  /**
   * Test connection to FortiGate device
   */
  async testConnection(): Promise<FortiGateApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/system/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data,
          status: response.status
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  /**
   * Get all firewall policies
   */
  async getPolicies(): Promise<FortiGateApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/firewall/policy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.results || [],
          status: response.status
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch policies'
      };
    }
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

    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/firewall/policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data,
          status: response.status
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create policy'
      };
    }
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

    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/firewall/policy/${policyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data,
          status: response.status
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update policy'
      };
    }
  }

  /**
   * Delete a firewall policy
   */
  async deletePolicy(policyId: string): Promise<FortiGateApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/firewall/policy/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          status: response.status
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete policy'
      };
    }
  }

  /**
   * Get system status and information
   */
  async getSystemInfo(): Promise<FortiGateApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/system/global`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data,
          status: response.status
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get system info'
      };
    }
  }

  /**
   * Get address objects
   */
  async getAddressObjects(): Promise<FortiGateApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/firewall/address`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.results || [],
          status: response.status
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get address objects'
      };
    }
  }

  /**
   * Get service objects
   */
  async getServiceObjects(): Promise<FortiGateApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/cmdb/firewall.service/custom`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.device.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.results || [],
          status: response.status
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get service objects'
      };
    }
  }
}

/**
 * Mock FortiGate API for development/testing
 */
export class MockFortiGateApiClient extends FortiGateApiClient {
  private mockPolicies: FortiGatePolicyResponse[] = [
    {
      id: '1',
      name: 'Allow Internal to DMZ',
      srcintf: 'internal',
      dstintf: 'dmz',
      srcaddr: 'all',
      dstaddr: 'all',
      action: 'accept',
      schedule: 'always',
      service: 'ALL',
      logtraffic: 'all',
      comments: 'Allow internal traffic to DMZ'
    }
  ];

  async testConnection(): Promise<FortiGateApiResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        hostname: this.device.name,
        version: '7.0.5',
        serial: 'FGVM08TM12345678'
      }
    };
  }

  async getPolicies(): Promise<FortiGateApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: this.mockPolicies
    };
  }

  async createPolicy(policy: FortiGatePolicy): Promise<FortiGateApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate occasional failures (10% failure rate)
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: 'Policy name already exists'
      };
    }
    
    const newPolicy: FortiGatePolicyResponse = {
      id: String(this.mockPolicies.length + 1),
      ...policy
    };
    
    this.mockPolicies.push(newPolicy);
    
    return {
      success: true,
      data: newPolicy
    };
  }

  async updatePolicy(policyId: string, policy: FortiGatePolicy): Promise<FortiGateApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = this.mockPolicies.findIndex(p => p.id === policyId);
    if (index === -1) {
      return {
        success: false,
        error: 'Policy not found'
      };
    }
    
    this.mockPolicies[index] = { ...this.mockPolicies[index], ...policy };
    
    return {
      success: true,
      data: this.mockPolicies[index]
    };
  }

  async deletePolicy(policyId: string): Promise<FortiGateApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.mockPolicies.findIndex(p => p.id === policyId);
    if (index === -1) {
      return {
        success: false,
        error: 'Policy not found'
      };
    }
    
    this.mockPolicies.splice(index, 1);
    
    return {
      success: true
    };
  }

  async getSystemInfo(): Promise<FortiGateApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: {
        hostname: this.device.name,
        version: '7.0.5',
        serial: 'FGVM08TM12345678',
        uptime: 86400
      }
    };
  }
}
