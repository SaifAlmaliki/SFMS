/**
 * Jira API Integration
 * Handles ticket creation, updates, and synchronization with Jira
 */

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
  issueType?: string;
}

export interface JiraIssue {
  id?: string;
  key?: string;
  summary: string;
  description: string;
  issuetype: {
    name: string;
  };
  project: {
    key: string;
  };
  priority: {
    name: string;
  };
  status?: {
    name: string;
  };
  assignee?: {
    displayName: string;
    emailAddress: string;
  };
  reporter?: {
    displayName: string;
    emailAddress: string;
  };
  labels?: string[];
  customfield_10000?: string; // Story points
  customfield_10001?: string; // Epic link
  created?: string;
  updated?: string;
}

export interface JiraResponse {
  id: string;
  key: string;
  self: string;
  fields: JiraIssue;
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraResponse[];
}

export class JiraApiClient {
  private config: JiraConfig;
  private baseUrl: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `${config.baseUrl}/rest/api/3`;
  }

  /**
   * Test connection to Jira
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/myself`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
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
   * Create a ticket in Jira
   */
  async createIssue(issue: Partial<JiraIssue>): Promise<{ success: boolean; data?: JiraIssue; error?: string }> {
    try {
      const jiraIssue: JiraIssue = {
        summary: issue.summary || 'Firewall Policy Change Request',
        description: issue.description || '',
        issuetype: {
          name: issue.issuetype?.name || this.config.issueType || 'Task'
        },
        project: {
          key: issue.project?.key || this.config.projectKey
        },
        priority: {
          name: issue.priority?.name || this.mapPriorityToJira(issue.priority?.name || 'Medium')
        },
        labels: issue.labels || ['firewall', 'ai-generated'],
        ...issue
      };

      const response = await fetch(`${this.baseUrl}/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          fields: jiraIssue
        })
      });

      if (response.ok) {
        const data: JiraResponse = await response.json();
        return {
          success: true,
          data: data.fields
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errorMessages?.join(', ') || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create issue'
      };
    }
  }

  /**
   * Update a Jira issue
   */
  async updateIssue(issueKey: string, updates: Partial<JiraIssue>): Promise<{ success: boolean; data?: JiraIssue; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/issue/${issueKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          fields: updates
        })
      });

      if (response.ok) {
        const data: JiraResponse = await response.json();
        return {
          success: true,
          data: data.fields
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errorMessages?.join(', ') || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update issue'
      };
    }
  }

  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<{ success: boolean; data?: JiraIssue; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/issue/${issueKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data: JiraResponse = await response.json();
        return {
          success: true,
          data: data.fields
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errorMessages?.join(', ') || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get issue'
      };
    }
  }

  /**
   * Search issues
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<{ success: boolean; data?: JiraIssue[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jql,
          maxResults,
          fields: ['summary', 'description', 'status', 'priority', 'assignee', 'reporter', 'labels', 'created', 'updated']
        })
      });

      if (response.ok) {
        const data: JiraSearchResponse = await response.json();
        return {
          success: true,
          data: data.issues.map(issue => issue.fields)
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errorMessages?.join(', ') || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search issues'
      };
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment
                  }
                ]
              }
            ]
          }
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errorMessages?.join(', ') || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add comment'
      };
    }
  }

  /**
   * Transition issue status
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/issue/${issueKey}/transitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.apiToken}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          transition: {
            id: transitionId
          }
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.errorMessages?.join(', ') || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to transition issue'
      };
    }
  }

  /**
   * Map priority to Jira priority names
   */
  private mapPriorityToJira(priority: string): string {
    const priorityMap: Record<string, string> = {
      'Low': 'Lowest',
      'Medium': 'Medium',
      'High': 'High',
      'Critical': 'Highest'
    };
    return priorityMap[priority] || 'Medium';
  }
}

/**
 * Mock Jira API for development/testing
 */
export class MockJiraApiClient extends JiraApiClient {
  private mockIssues: JiraIssue[] = [];
  private nextId = 1;

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  async createIssue(issue: Partial<JiraIssue>): Promise<{ success: boolean; data?: JiraIssue; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'Jira instance unavailable'
      };
    }
    
    const newIssue: JiraIssue = {
      id: `mock-${this.nextId++}`,
      key: `${this.config.projectKey}-${this.nextId}`,
      summary: issue.summary || 'Firewall Policy Change Request',
      description: issue.description || '',
      issuetype: {
        name: issue.issuetype?.name || this.config.issueType || 'Task'
      },
      project: {
        key: issue.project?.key || this.config.projectKey
      },
      priority: {
        name: issue.priority?.name || this.mapPriorityToJira(issue.priority?.name || 'Medium')
      },
      status: {
        name: 'To Do'
      },
      labels: issue.labels || ['firewall', 'ai-generated'],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      ...issue
    };
    
    this.mockIssues.push(newIssue);
    
    return {
      success: true,
      data: newIssue
    };
  }

  async updateIssue(issueKey: string, updates: Partial<JiraIssue>): Promise<{ success: boolean; data?: JiraIssue; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const issueIndex = this.mockIssues.findIndex(i => i.key === issueKey);
    if (issueIndex === -1) {
      return {
        success: false,
        error: 'Issue not found'
      };
    }
    
    this.mockIssues[issueIndex] = {
      ...this.mockIssues[issueIndex],
      ...updates,
      updated: new Date().toISOString()
    };
    
    return {
      success: true,
      data: this.mockIssues[issueIndex]
    };
  }

  async getIssue(issueKey: string): Promise<{ success: boolean; data?: JiraIssue; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const issue = this.mockIssues.find(i => i.key === issueKey);
    if (!issue) {
      return {
        success: false,
        error: 'Issue not found'
      };
    }
    
    return {
      success: true,
      data: issue
    };
  }

  async searchIssues(jql: string, maxResults: number = 50): Promise<{ success: boolean; data?: JiraIssue[]; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: this.mockIssues.slice(0, maxResults)
    };
  }

  async addComment(issueKey: string, comment: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const issueIndex = this.mockIssues.findIndex(i => i.key === issueKey);
    if (issueIndex === -1) {
      return {
        success: false,
        error: 'Issue not found'
      };
    }
    
    return { success: true };
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<{ success: boolean; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const issueIndex = this.mockIssues.findIndex(i => i.key === issueKey);
    if (issueIndex === -1) {
      return {
        success: false,
        error: 'Issue not found'
      };
    }
    
    // Mock status transitions
    const statusMap: Record<string, string> = {
      '1': 'In Progress',
      '2': 'Done',
      '3': 'Closed'
    };
    
    if (statusMap[transitionId]) {
      this.mockIssues[issueIndex].status = { name: statusMap[transitionId] };
    }
    
    return { success: true };
  }
}
