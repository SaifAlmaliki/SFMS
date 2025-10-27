/**
 * External Ticket System Integration Service
 * Handles integration with ServiceNow and Jira
 */

import { PrismaClient } from '../generated/prisma';
import { ServiceNowApiClient, MockServiceNowApiClient, ServiceNowConfig } from './servicenow-api';
import { JiraApiClient, MockJiraApiClient, JiraConfig } from './jira-api';

const prisma = new PrismaClient();

export interface ExternalTicketSystem {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  config: any;
}

export interface CreateExternalTicketRequest {
  ticketId: string;
  system: 'servicenow' | 'jira';
  title: string;
  description: string;
  priority: string;
  requestedBy: string;
  policyId?: string;
}

export interface SyncExternalTicketRequest {
  ticketId: string;
  externalSystem: string;
  externalId: string;
}

export class ExternalTicketService {
  /**
   * Get all configured external ticket systems
   */
  async getExternalSystems(): Promise<ExternalTicketSystem[]> {
    const systems = await prisma.externalTicketSystem.findMany({
      orderBy: { displayName: 'asc' }
    });
    
    return systems.map(system => ({
      id: system.id,
      name: system.name,
      displayName: system.displayName,
      isActive: system.isActive,
      config: system.config
    }));
  }

  /**
   * Get active external ticket systems
   */
  async getActiveExternalSystems(): Promise<ExternalTicketSystem[]> {
    const systems = await prisma.externalTicketSystem.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' }
    });
    
    return systems.map(system => ({
      id: system.id,
      name: system.name,
      displayName: system.displayName,
      isActive: system.isActive,
      config: system.config
    }));
  }

  /**
   * Create a ticket in external system
   */
  async createExternalTicket(request: CreateExternalTicketRequest): Promise<{ success: boolean; externalId?: string; externalUrl?: string; error?: string }> {
    try {
      // Get the ticket from database
      const ticket = await prisma.changeTicket.findUnique({
        where: { id: request.ticketId }
      });

      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      let result: { success: boolean; data?: any; error?: string };

      if (request.system === 'servicenow') {
        result = await this.createServiceNowTicket(request);
      } else if (request.system === 'jira') {
        result = await this.createJiraTicket(request);
      } else {
        return { success: false, error: 'Unsupported external system' };
      }

      if (result.success && result.data) {
        // Update ticket with external system information
        const externalId = result.data.sys_id || result.data.key || result.data.id;
        const externalUrl = this.generateExternalUrl(request.system, externalId, result.data);

        await prisma.changeTicket.update({
          where: { id: request.ticketId },
          data: {
            externalSystem: request.system,
            externalId: externalId,
            externalUrl: externalUrl,
            lastSyncAt: new Date(),
            syncStatus: 'Synced'
          }
        });

        return {
          success: true,
          externalId: externalId,
          externalUrl: externalUrl
        };
      } else {
        // Update ticket with sync failure
        await prisma.changeTicket.update({
          where: { id: request.ticketId },
          data: {
            externalSystem: request.system,
            syncStatus: 'Failed',
            lastSyncAt: new Date()
          }
        });

        return {
          success: false,
          error: result.error || 'Failed to create external ticket'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create external ticket'
      };
    }
  }

  /**
   * Sync ticket status from external system
   */
  async syncExternalTicket(request: SyncExternalTicketRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const ticket = await prisma.changeTicket.findUnique({
        where: { id: request.ticketId }
      });

      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      let externalStatus: string | undefined;

      if (request.externalSystem === 'servicenow') {
        const result = await this.getServiceNowTicketStatus(request.externalId);
        if (result.success) {
          externalStatus = result.data?.state;
        }
      } else if (request.externalSystem === 'jira') {
        const result = await this.getJiraTicketStatus(request.externalId);
        if (result.success) {
          externalStatus = result.data?.status?.name;
        }
      }

      if (externalStatus) {
        // Map external status to internal status
        const internalStatus = this.mapExternalStatusToInternal(externalStatus, request.externalSystem);
        
        await prisma.changeTicket.update({
          where: { id: request.ticketId },
          data: {
            status: internalStatus,
            lastSyncAt: new Date(),
            syncStatus: 'Synced'
          }
        });

        return { success: true };
      } else {
        await prisma.changeTicket.update({
          where: { id: request.ticketId },
          data: {
            syncStatus: 'Failed',
            lastSyncAt: new Date()
          }
        });

        return { success: false, error: 'Failed to get external ticket status' };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sync external ticket'
      };
    }
  }

  /**
   * Create ServiceNow ticket
   */
  private async createServiceNowTicket(request: CreateExternalTicketRequest): Promise<{ success: boolean; data?: any; error?: string }> {
    const systemConfig = await this.getServiceNowConfig();
    if (!systemConfig) {
      return { success: false, error: 'ServiceNow not configured' };
    }

    const client = new MockServiceNowApiClient(systemConfig); // Use mock for now
    
    return await client.createChangeRequest({
      short_description: request.title,
      description: request.description,
      priority: request.priority,
      requested_by: request.requestedBy,
      work_notes: `Created by AI Firewall Agent for policy: ${request.policyId || 'N/A'}`
    });
  }

  /**
   * Create Jira ticket
   */
  private async createJiraTicket(request: CreateExternalTicketRequest): Promise<{ success: boolean; data?: any; error?: string }> {
    const systemConfig = await this.getJiraConfig();
    if (!systemConfig) {
      return { success: false, error: 'Jira not configured' };
    }

    const client = new MockJiraApiClient(systemConfig); // Use mock for now
    
    return await client.createIssue({
      summary: request.title,
      description: request.description,
      priority: { name: request.priority },
      labels: ['firewall', 'ai-generated', 'policy-change']
    });
  }

  /**
   * Get ServiceNow ticket status
   */
  private async getServiceNowTicketStatus(externalId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const systemConfig = await this.getServiceNowConfig();
    if (!systemConfig) {
      return { success: false, error: 'ServiceNow not configured' };
    }

    const client = new MockServiceNowApiClient(systemConfig);
    return await client.getChangeRequest(externalId);
  }

  /**
   * Get Jira ticket status
   */
  private async getJiraTicketStatus(externalId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const systemConfig = await this.getJiraConfig();
    if (!systemConfig) {
      return { success: false, error: 'Jira not configured' };
    }

    const client = new MockJiraApiClient(systemConfig);
    return await client.getIssue(externalId);
  }

  /**
   * Get ServiceNow configuration
   */
  private async getServiceNowConfig(): Promise<ServiceNowConfig | null> {
    const system = await prisma.externalTicketSystem.findFirst({
      where: { name: 'servicenow', isActive: true }
    });

    if (!system) return null;

    return {
      instanceUrl: system.config.instanceUrl,
      username: system.config.username,
      password: system.config.password,
      tableName: system.config.tableName || 'change_request',
      apiVersion: system.config.apiVersion || 'v1'
    };
  }

  /**
   * Get Jira configuration
   */
  private async getJiraConfig(): Promise<JiraConfig | null> {
    const system = await prisma.externalTicketSystem.findFirst({
      where: { name: 'jira', isActive: true }
    });

    if (!system) return null;

    return {
      baseUrl: system.config.baseUrl,
      username: system.config.username,
      apiToken: system.config.apiToken,
      projectKey: system.config.projectKey,
      issueType: system.config.issueType || 'Task'
    };
  }

  /**
   * Map external status to internal status
   */
  private mapExternalStatusToInternal(externalStatus: string, system: string): 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Scheduled' | 'Deployed' | 'Failed' {
    if (system === 'servicenow') {
      const statusMap: Record<string, any> = {
        '1': 'PendingApproval', // New
        '2': 'PendingApproval', // In Progress
        '3': 'Approved',       // On Hold
        '4': 'Approved',       // Closed Complete
        '5': 'Rejected',       // Closed Incomplete
        '6': 'Rejected',       // Closed Skipped
        '7': 'Rejected'        // Closed Cancelled
      };
      return statusMap[externalStatus] || 'PendingApproval';
    } else if (system === 'jira') {
      const statusMap: Record<string, any> = {
        'To Do': 'PendingApproval',
        'In Progress': 'PendingApproval',
        'Done': 'Approved',
        'Closed': 'Deployed',
        'Cancelled': 'Rejected'
      };
      return statusMap[externalStatus] || 'PendingApproval';
    }
    
    return 'PendingApproval';
  }

  /**
   * Generate external URL
   */
  private generateExternalUrl(system: string, externalId: string, data: any): string {
    if (system === 'servicenow') {
      const instanceUrl = data.instanceUrl || 'https://your-instance.service-now.com';
      return `${instanceUrl}/nav_to.do?uri=change_request.do?sys_id=${externalId}`;
    } else if (system === 'jira') {
      const baseUrl = data.baseUrl || 'https://your-domain.atlassian.net';
      return `${baseUrl}/browse/${externalId}`;
    }
    
    return '';
  }

  /**
   * Test connection to external system
   */
  async testExternalSystemConnection(systemName: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (systemName === 'servicenow') {
        const config = await this.getServiceNowConfig();
        if (!config) {
          return { success: false, error: 'ServiceNow not configured' };
        }
        
        const client = new MockServiceNowApiClient(config);
        return await client.testConnection();
      } else if (systemName === 'jira') {
        const config = await this.getJiraConfig();
        if (!config) {
          return { success: false, error: 'Jira not configured' };
        }
        
        const client = new MockJiraApiClient(config);
        return await client.testConnection();
      }
      
      return { success: false, error: 'Unsupported system' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection test failed'
      };
    }
  }
}
