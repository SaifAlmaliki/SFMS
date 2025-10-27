'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Server,
  Ticket
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExternalSystemConfig {
  id?: string;
  name: string;
  displayName: string;
  isActive: boolean;
  config: {
    // ServiceNow config
    instanceUrl?: string;
    username?: string;
    password?: string;
    tableName?: string;
    apiVersion?: string;
    // Jira config
    baseUrl?: string;
    apiToken?: string;
    projectKey?: string;
    issueType?: string;
  };
}

export function ExternalSystemConfig() {
  const [systems, setSystems] = useState<ExternalSystemConfig[]>([
    {
      name: 'servicenow',
      displayName: 'ServiceNow',
      isActive: false,
      config: {
        instanceUrl: '',
        username: '',
        password: '',
        tableName: 'change_request',
        apiVersion: 'v1'
      }
    },
    {
      name: 'jira',
      displayName: 'Jira',
      isActive: false,
      config: {
        baseUrl: '',
        username: '',
        apiToken: '',
        projectKey: '',
        issueType: 'Task'
      }
    }
  ]);

  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const updateSystemConfig = (systemName: string, updates: Partial<ExternalSystemConfig>) => {
    setSystems(prev => prev.map(system => 
      system.name === systemName 
        ? { ...system, ...updates }
        : system
    ));
  };

  const updateSystemField = (systemName: string, field: string, value: any) => {
    setSystems(prev => prev.map(system => 
      system.name === systemName 
        ? { 
            ...system, 
            config: { ...system.config, [field]: value }
          }
        : system
    ));
  };

  const testConnection = async (systemName: string) => {
    setTesting(prev => ({ ...prev, [systemName]: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result (90% success rate)
      const success = Math.random() > 0.1;
      
      setTestResults(prev => ({
        ...prev,
        [systemName]: {
          success,
          error: success ? undefined : 'Connection failed: Invalid credentials'
        }
      }));

      toast({
        title: success ? 'Connection Successful' : 'Connection Failed',
        description: success 
          ? `${systemName} connection test passed`
          : `Failed to connect to ${systemName}`,
        variant: success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [systemName]: {
          success: false,
          error: error.message || 'Connection test failed'
        }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [systemName]: false }));
    }
  };

  const saveConfiguration = async () => {
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Configuration Saved',
        description: 'External ticket system configuration has been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">External Ticket Systems</h2>
          <p className="text-muted-foreground">
            Configure integration with ServiceNow and Jira for change management
          </p>
        </div>
        <Button onClick={saveConfiguration} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>

      <Tabs defaultValue="servicenow" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="servicenow" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            ServiceNow
          </TabsTrigger>
          <TabsTrigger value="jira" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Jira
          </TabsTrigger>
        </TabsList>

        {systems.map((system) => (
          <TabsContent key={system.name} value={system.name} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {system.displayName}
                      <Badge variant={system.isActive ? 'default' : 'secondary'}>
                        {system.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Configure {system.displayName} integration for change ticket management
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${system.name}-active`}>Enable</Label>
                    <Switch
                      id={`${system.name}-active`}
                      checked={system.isActive}
                      onCheckedChange={(checked) => updateSystemConfig(system.name, { isActive: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {system.name === 'servicenow' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="servicenow-instance">Instance URL</Label>
                        <Input
                          id="servicenow-instance"
                          placeholder="https://your-instance.service-now.com"
                          value={system.config.instanceUrl || ''}
                          onChange={(e) => updateSystemField('servicenow', 'instanceUrl', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="servicenow-table">Table Name</Label>
                        <Input
                          id="servicenow-table"
                          placeholder="change_request"
                          value={system.config.tableName || ''}
                          onChange={(e) => updateSystemField('servicenow', 'tableName', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="servicenow-username">Username</Label>
                        <Input
                          id="servicenow-username"
                          placeholder="admin"
                          value={system.config.username || ''}
                          onChange={(e) => updateSystemField('servicenow', 'username', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="servicenow-password">Password</Label>
                        <Input
                          id="servicenow-password"
                          type="password"
                          placeholder="••••••••"
                          value={system.config.password || ''}
                          onChange={(e) => updateSystemField('servicenow', 'password', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servicenow-api">API Version</Label>
                      <Input
                        id="servicenow-api"
                        placeholder="v1"
                        value={system.config.apiVersion || ''}
                        onChange={(e) => updateSystemField('servicenow', 'apiVersion', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {system.name === 'jira' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jira-baseurl">Base URL</Label>
                        <Input
                          id="jira-baseurl"
                          placeholder="https://your-domain.atlassian.net"
                          value={system.config.baseUrl || ''}
                          onChange={(e) => updateSystemField('jira', 'baseUrl', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jira-project">Project Key</Label>
                        <Input
                          id="jira-project"
                          placeholder="PROJ"
                          value={system.config.projectKey || ''}
                          onChange={(e) => updateSystemField('jira', 'projectKey', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jira-username">Username/Email</Label>
                        <Input
                          id="jira-username"
                          placeholder="user@company.com"
                          value={system.config.username || ''}
                          onChange={(e) => updateSystemField('jira', 'username', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jira-token">API Token</Label>
                        <Input
                          id="jira-token"
                          type="password"
                          placeholder="••••••••"
                          value={system.config.apiToken || ''}
                          onChange={(e) => updateSystemField('jira', 'apiToken', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jira-issuetype">Issue Type</Label>
                      <Input
                        id="jira-issuetype"
                        placeholder="Task"
                        value={system.config.issueType || ''}
                        onChange={(e) => updateSystemField('jira', 'issueType', e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Connection Test</h4>
                    <p className="text-xs text-muted-foreground">
                      Test the connection to {system.displayName}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => testConnection(system.name)}
                    disabled={testing[system.name] || !system.isActive}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    {testing[system.name] ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                {testResults[system.name] && (
                  <Alert className={testResults[system.name].success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-center gap-2">
                      {testResults[system.name].success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={testResults[system.name].success ? 'text-green-800' : 'text-red-800'}>
                        {testResults[system.name].success 
                          ? `Successfully connected to ${system.displayName}`
                          : testResults[system.name].error || 'Connection test failed'
                        }
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {system.isActive && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm font-medium">Integration Active</span>
                    </div>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      Tickets will be automatically created in {system.displayName} when users request firewall policy changes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
