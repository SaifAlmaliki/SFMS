/**
 * ServiceNow (SNOW) API Integration
 * Handles ticket creation, updates, and synchronization with ServiceNow
 */

import 'server-only';
import { serverFetch } from '@/lib/http-client';

export interface ServiceNowConfig {
  instanceUrl: string;
  username: string;
  password: string;
  tableName: string; // e.g., 'change_request' or 'incident'
  apiVersion?: string;
}

export interface ServiceNowTicket {
  sys_id?: string;
  number?: string;
  short_description: string;
  description: string;
  state: string;
  priority: string;
  urgency: string;
  impact: string;
  category: string;
  subcategory?: string;
  assigned_to?: string;
  requested_by?: string;
  work_notes?: string;
  sys_created_on?: string;
  sys_updated_on?: string;
}

export interface ServiceNowResponse {
  result: ServiceNowTicket | ServiceNowTicket[];
  error?: {
    message: string;
    detail: string;
  };
}

export class ServiceNowApiClient {
  private config: ServiceNowConfig;
  private baseUrl: string;

  constructor(config: ServiceNowConfig) {
    this.config = config;
    this.baseUrl = `${config.instanceUrl}/api/now/${config.apiVersion || 'v1'}`;
  }

  /**
   * Test connection to ServiceNow
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await serverFetch(`${this.baseUrl}/table/sys_user?sysparm_limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
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
   * Create a change request ticket in ServiceNow
   */
  async createChangeRequest(ticket: Partial<ServiceNowTicket>): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    try {
      const changeRequest: ServiceNowTicket = {
        short_description: ticket.short_description || 'Firewall Policy Change Request',
        description: ticket.description || '',
        state: '1', // New
        priority: this.mapPriorityToServiceNow(ticket.priority || 'Medium'),
        urgency: this.mapUrgencyToServiceNow(ticket.priority || 'Medium'),
        impact: '3', // Low impact
        category: 'Network',
        subcategory: 'Firewall',
        requested_by: ticket.requested_by || 'system',
        work_notes: ticket.work_notes || 'Created by AI Firewall Agent',
        ...ticket
      };

      const response = await serverFetch(`${this.baseUrl}/table/change_request`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(changeRequest)
      });

      if (response.ok) {
        const data: ServiceNowResponse = await response.json();
        return {
          success: true,
          data: Array.isArray(data.result) ? data.result[0] : data.result
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create change request'
      };
    }
  }

  /**
   * Create an incident ticket in ServiceNow for IT support requests
   */
  async createIncident(ticket: Partial<ServiceNowTicket>): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    try {
      const incident: ServiceNowTicket = {
        short_description: ticket.short_description || 'IT Support Request',
        description: ticket.description || '',
        state: '1', // New
        priority: this.mapPriorityToServiceNow(ticket.priority || 'Medium'),
        urgency: this.mapUrgencyToServiceNow(ticket.priority || 'Medium'),
        impact: '3', // Low impact
        category: ticket.category || 'IT Support',
        subcategory: ticket.subcategory || 'General',
        requested_by: ticket.requested_by || 'system',
        work_notes: ticket.work_notes || 'Created by AI IT Support Agent',
        ...ticket
      };

      const response = await serverFetch(`${this.baseUrl}/table/incident`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(incident)
      });

      if (response.ok) {
        const data: ServiceNowResponse = await response.json();
        return {
          success: true,
          data: Array.isArray(data.result) ? data.result[0] : data.result
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create incident'
      };
    }
  }

  /**
   * Update a change request ticket
   */
  async updateChangeRequest(sysId: string, updates: Partial<ServiceNowTicket>): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    try {
      const response = await serverFetch(`${this.baseUrl}/table/change_request/${sysId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data: ServiceNowResponse = await response.json();
        return {
          success: true,
          data: Array.isArray(data.result) ? data.result[0] : data.result
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update change request'
      };
    }
  }

  /**
   * Get change request by sys_id
   */
  async getChangeRequest(sysId: string): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    try {
      const response = await serverFetch(`${this.baseUrl}/table/change_request/${sysId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data: ServiceNowResponse = await response.json();
        return {
          success: true,
          data: Array.isArray(data.result) ? data.result[0] : data.result
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get change request'
      };
    }
  }

  /**
   * Search change requests
   */
  async searchChangeRequests(query: string): Promise<{ success: boolean; data?: ServiceNowTicket[]; error?: string }> {
    try {
      const response = await serverFetch(`${this.baseUrl}/table/change_request?sysparm_query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data: ServiceNowResponse = await response.json();
        return {
          success: true,
          data: Array.isArray(data.result) ? data.result : [data.result]
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search change requests'
      };
    }
  }

  /**
   * Add work notes to a change request
   */
  async addWorkNotes(sysId: string, notes: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await serverFetch(`${this.baseUrl}/table/change_request/${sysId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          work_notes: notes
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add work notes'
      };
    }
  }

  /**
   * Map priority to ServiceNow priority values
   */
  private mapPriorityToServiceNow(priority: string): string {
    const priorityMap: Record<string, string> = {
      'Low': '4',
      'Medium': '3',
      'High': '2',
      'Critical': '1'
    };
    return priorityMap[priority] || '3';
  }

  /**
   * Map priority to ServiceNow urgency values
   */
  private mapUrgencyToServiceNow(priority: string): string {
    const urgencyMap: Record<string, string> = {
      'Low': '3',
      'Medium': '2',
      'High': '2',
      'Critical': '1'
    };
    return urgencyMap[priority] || '2';
  }
}

/**
 * Mock ServiceNow API for development/testing
 */
export class MockServiceNowApiClient extends ServiceNowApiClient {
  private mockTickets: ServiceNowTicket[] = [];
  private nextSysId = 1;

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  async createChangeRequest(ticket: Partial<ServiceNowTicket>): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'ServiceNow instance unavailable'
      };
    }
    
    const newTicket: ServiceNowTicket = {
      sys_id: `mock-${this.nextSysId++}`,
      number: `CHG${String(this.nextSysId).padStart(7, '0')}`,
      short_description: ticket.short_description || 'Firewall Policy Change Request',
      description: ticket.description || '',
      state: '1',
      priority: this.mapPriorityToServiceNow(ticket.priority || 'Medium'),
      urgency: this.mapUrgencyToServiceNow(ticket.priority || 'Medium'),
      impact: '3',
      category: 'Network',
      subcategory: 'Firewall',
      requested_by: ticket.requested_by || 'system',
      work_notes: ticket.work_notes || 'Created by AI Firewall Agent',
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString(),
      ...ticket
    };
    
    this.mockTickets.push(newTicket);
    
    return {
      success: true,
      data: newTicket
    };
  }

  async createIncident(ticket: Partial<ServiceNowTicket>): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'ServiceNow instance unavailable'
      };
    }
    
    const newTicket: ServiceNowTicket = {
      sys_id: `mock-${this.nextSysId++}`,
      number: `INC${String(this.nextSysId).padStart(7, '0')}`,
      short_description: ticket.short_description || 'IT Support Request',
      description: ticket.description || '',
      state: '1',
      priority: this.mapPriorityToServiceNow(ticket.priority || 'Medium'),
      urgency: this.mapUrgencyToServiceNow(ticket.priority || 'Medium'),
      impact: '3',
      category: ticket.category || 'IT Support',
      subcategory: ticket.subcategory || 'General',
      requested_by: ticket.requested_by || 'system',
      work_notes: ticket.work_notes || 'Created by AI IT Support Agent',
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString(),
      ...ticket
    };
    
    this.mockTickets.push(newTicket);
    
    return {
      success: true,
      data: newTicket
    };
  }

  async updateChangeRequest(sysId: string, updates: Partial<ServiceNowTicket>): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const ticketIndex = this.mockTickets.findIndex(t => t.sys_id === sysId);
    if (ticketIndex === -1) {
      return {
        success: false,
        error: 'Change request not found'
      };
    }
    
    this.mockTickets[ticketIndex] = {
      ...this.mockTickets[ticketIndex],
      ...updates,
      sys_updated_on: new Date().toISOString()
    };
    
    return {
      success: true,
      data: this.mockTickets[ticketIndex]
    };
  }

  async getChangeRequest(sysId: string): Promise<{ success: boolean; data?: ServiceNowTicket; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const ticket = this.mockTickets.find(t => t.sys_id === sysId);
    if (!ticket) {
      return {
        success: false,
        error: 'Change request not found'
      };
    }
    
    return {
      success: true,
      data: ticket
    };
  }

  async searchChangeRequests(query: string): Promise<{ success: boolean; data?: ServiceNowTicket[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: this.mockTickets
    };
  }

  async addWorkNotes(sysId: string, notes: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const ticketIndex = this.mockTickets.findIndex(t => t.sys_id === sysId);
    if (ticketIndex === -1) {
      return {
        success: false,
        error: 'Change request not found'
      };
    }
    
    this.mockTickets[ticketIndex].work_notes = 
      (this.mockTickets[ticketIndex].work_notes || '') + `\n${new Date().toISOString()}: ${notes}`;
    
    return { success: true };
  }
}
