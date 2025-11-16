'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Server, Key, Globe, Eye, EyeOff } from 'lucide-react';
import { testFortiGateConnection, saveFortiGateDevice, getFortiGateDevice } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ConnectionStatus {
  success: boolean;
  data?: {
    serial?: string;
    version?: string;
    build?: number;
    hostname?: string;
  };
  error?: string;
  serial?: string;
  version?: string;
  build?: number;
  saved?: boolean;
  deviceUpdated?: boolean; // Indicates if device status was updated
}

export function FortiGateConnection() {
  const { toast } = useToast();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [formData, setFormData] = useState({
    hostname: '',
    apiUsername: '',
    apiKey: '',
    deviceName: '',
  });

  // Load saved device data on mount
  useEffect(() => {
    const loadSavedDevice = async () => {
      try {
        // Try to get the last used device name from localStorage
        const lastDeviceName = typeof window !== 'undefined' 
          ? localStorage.getItem('fortigate_last_device_name') 
          : null;
        
        // Load device by name if we have it, otherwise get the most recent device
        const result = await getFortiGateDevice(lastDeviceName || undefined);
        if (result.success && result.device) {
          setFormData({
            hostname: result.device.hostname || '',
            apiUsername: result.device.apiUsername || '',
            apiKey: result.device.apiKey || '',
            deviceName: result.device.name || '',
          });
          // Store the device name for next time
          if (typeof window !== 'undefined' && result.device.name) {
            localStorage.setItem('fortigate_last_device_name', result.device.name);
          }
        } else {
          // Set default values if no device found
          setFormData({
            hostname: 'apiprod.viewdns.net',
            apiUsername: 'aiprod',
            apiKey: '',
            deviceName: 'apiprod-01',
          });
        }
      } catch (error) {
        console.error('Error loading saved device:', error);
        // Set default values on error
        setFormData({
          hostname: 'apiprod.viewdns.net',
          apiUsername: 'aiprod',
          apiKey: '',
          deviceName: 'apiprod-01',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedDevice();
  }, []);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      const result = await testFortiGateConnection({
        hostname: formData.hostname,
        apiUsername: formData.apiUsername,
        apiKey: formData.apiKey,
        deviceName: formData.deviceName, // Pass device name for auto-save
      });

      setConnectionStatus(result);
      
      if (result.success) {
        const savedMessage = result.saved 
          ? ' Credentials have been saved to the database.' 
          : '';
        toast({
          title: 'Connection Successful',
          description: `Connected to FortiGate ${result.version || ''} (Serial: ${result.serial || 'N/A'})${savedMessage}`,
        });
        
        // Reload saved device data after successful save to show updated credentials
        if (result.saved) {
          const savedDevice = await getFortiGateDevice(formData.deviceName);
          if (savedDevice.success && savedDevice.device) {
            setFormData(prev => ({
              ...prev,
              apiUsername: savedDevice.device!.apiUsername || prev.apiUsername,
              apiKey: savedDevice.device!.apiKey || prev.apiKey,
            }));
            // Store the device name for next time
            if (typeof window !== 'undefined' && savedDevice.device.name) {
              localStorage.setItem('fortigate_last_device_name', savedDevice.device.name);
            }
          }
        }
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Unable to connect to FortiGate device',
          variant: 'destructive',
        });
        // Trigger device list refresh if device status was updated
        if (result.deviceUpdated) {
          console.log('[FortiGateConnection] Device status was updated, refreshing device list...');
          // First immediate refresh
          window.dispatchEvent(new Event('deviceStatusUpdated'));
          // Then refresh after delay to ensure DB update is complete
          setTimeout(() => {
            window.dispatchEvent(new Event('deviceStatusUpdated'));
            router.refresh();
          }, 1000);
        }
      }
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        error: error.message || 'Failed to test connection',
      });
      toast({
        title: 'Connection Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      // Note: deviceUpdated will be in the error response if the catch block in the server action updated it
      // For now, we'll trigger refresh if deviceName exists (the server action will handle the update)
      if (formData.deviceName) {
        console.log('[FortiGateConnection] Connection error occurred, triggering device list refresh...');
        // Trigger refresh after delay to allow server action to complete
        setTimeout(() => {
          window.dispatchEvent(new Event('deviceStatusUpdated'));
          router.refresh();
        }, 1500);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveDevice = async () => {
    if (!connectionStatus?.success) {
      toast({
        title: 'Cannot Save',
        description: 'Please test connection first and ensure it is successful',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveFortiGateDevice({
        name: formData.deviceName,
        hostname: formData.hostname,
        apiUsername: formData.apiUsername,
        apiKey: formData.apiKey,
        serial: connectionStatus.serial,
        version: connectionStatus.version,
        build: connectionStatus.build,
      });

      if (result.success) {
        toast({
          title: 'Device Saved',
          description: `FortiGate device "${formData.deviceName}" has been saved successfully`,
        });
        
        // Store the device name for next time
        if (typeof window !== 'undefined' && formData.deviceName) {
          localStorage.setItem('fortigate_last_device_name', formData.deviceName);
        }
        
        // Reload saved device data to ensure form shows the saved credentials
        const savedDevice = await getFortiGateDevice(formData.deviceName);
        if (savedDevice.success && savedDevice.device) {
          setFormData(prev => ({
            ...prev,
            apiUsername: savedDevice.device!.apiUsername || prev.apiUsername,
            apiKey: savedDevice.device!.apiKey || prev.apiKey,
          }));
        }
      } else {
        toast({
          title: 'Save Failed',
          description: result.error || 'Failed to save device configuration',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          FortiGate Device Connection
        </CardTitle>
        <CardDescription>
          Connect to your FortiGate firewall device using REST API credentials.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading saved device...</span>
          </div>
        ) : (
        <form onSubmit={handleTestConnection} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostname" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Hostname / IP Address
            </Label>
            <Input
              id="hostname"
              name="hostname"
              type="text"
              placeholder="apiprod.viewdns.net"
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiUsername">API Username</Label>
            <Input
              id="apiUsername"
              name="apiUsername"
              type="text"
              placeholder="aiprod"
              value={formData.apiUsername}
              onChange={(e) => setFormData({ ...formData, apiUsername: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name (for saving)</Label>
            <Input
              id="deviceName"
              name="deviceName"
              type="text"
              placeholder="apiprod-01"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              required
            />
          </div>

          <Button type="submit" disabled={isConnecting} className="w-full">
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Server className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
        </form>
        )}

        {connectionStatus && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Connection Status</h3>
                {connectionStatus.success ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Failed
                  </Badge>
                )}
              </div>

              {connectionStatus.success ? (
                <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Serial Number:</span>
                      <p className="mt-1 font-mono">{connectionStatus.serial || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Version:</span>
                      <p className="mt-1">{connectionStatus.version || 'N/A'}</p>
                    </div>
                    {connectionStatus.build && (
                      <div>
                        <span className="font-medium text-muted-foreground">Build:</span>
                        <p className="mt-1">{connectionStatus.build}</p>
                      </div>
                    )}
                    {connectionStatus.data?.hostname && (
                      <div>
                        <span className="font-medium text-muted-foreground">Hostname:</span>
                        <p className="mt-1">{connectionStatus.data.hostname}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveDevice}
                    disabled={isSaving}
                    className="w-full"
                    variant="default"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Device Configuration'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    <strong>Error:</strong> {connectionStatus.error || 'Unknown error occurred'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

