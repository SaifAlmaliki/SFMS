'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HardDrive, Server, Hash, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDeviceHealthAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

type DeviceStatus = 'Online' | 'Offline' | 'Warning';
type Device = {
  name: string;
  status: DeviceStatus;
  dbStatus?: 'Active' | 'Inactive'; // Database status (Active/Inactive)
  ip: string;
  version?: string;
  serial?: string;
  build?: number;
  error?: string;
};

const statusStyles = {
  Online: 'bg-green-500',
  Offline: 'bg-destructive',
  Warning: 'bg-yellow-500',
};

const statusBadges = {
  Online: { label: 'Online', variant: 'default' as const },
  Offline: { label: 'Offline', variant: 'destructive' as const },
  Warning: { label: 'Warning', variant: 'default' as const },
};

export function DeviceHealth() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

  const fetchDeviceHealth = async () => {
    try {
      setLoading(true);
      const result = await getDeviceHealthAction();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch device health');
        // Keep existing devices on error
      }
    } catch (err) {
      console.error('Error fetching device health:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchDeviceHealth();
    
    // Then fetch every 30 seconds
    const interval = setInterval(fetchDeviceHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleDevice = (deviceName: string) => {
    const newExpanded = new Set(expandedDevices);
    if (newExpanded.has(deviceName)) {
      newExpanded.delete(deviceName);
    } else {
      newExpanded.add(deviceName);
    }
    setExpandedDevices(newExpanded);
  };

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Device Health
        </CardTitle>
        <CardDescription>Real-time status and details of your firewalls</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading device health...
          </div>
        ) : error && devices.length === 0 ? (
          <div className="text-center py-4 text-destructive">
            {error}
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No FortiGate devices configured. Add devices in Settings.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <Collapsible
                key={device.name}
                open={expandedDevices.has(device.name)}
                onOpenChange={() => toggleDevice(device.name)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <HardDrive className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{device.name}</p>
                          <Badge {...statusBadges[device.status]}>
                            {statusBadges[device.status].label}
                          </Badge>
                          {device.dbStatus && (
                            <Badge
                              variant={device.dbStatus === 'Active' ? 'default' : 'secondary'}
                              className={device.dbStatus === 'Active' ? 'bg-blue-500' : 'bg-gray-500'}
                            >
                              {device.dbStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {device.ip}
                          {device.version && (
                            <span className="ml-2">v{device.version}</span>
                          )}
                        </p>
                        {device.error && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                            <p className="text-xs text-destructive">{device.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                          statusStyles[device.status]
                        }`}
                      />
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedDevices.has(device.name) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Server className="h-4 w-4" />
                            <span>Device Name:</span>
                          </div>
                          <p className="font-medium">{device.name}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>IP Address:</span>
                          </div>
                          <p className="font-medium font-mono text-xs">{device.ip}</p>
                        </div>

                        {device.version && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>Version:</span>
                            </div>
                            <p className="font-medium">{device.version}</p>
                          </div>
                        )}

                        {device.serial && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Hash className="h-4 w-4" />
                              <span>Serial:</span>
                            </div>
                            <p className="font-medium font-mono text-xs">{device.serial}</p>
                          </div>
                        )}

                        {device.build && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>Build:</span>
                            </div>
                            <p className="font-medium">{device.build}</p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Connection Status:</span>
                          </div>
                          <Badge {...statusBadges[device.status]}>
                            {statusBadges[device.status].label}
                          </Badge>
                        </div>

                        {device.dbStatus && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>Device Status:</span>
                            </div>
                            <Badge
                              variant={device.dbStatus === 'Active' ? 'default' : 'secondary'}
                              className={device.dbStatus === 'Active' ? 'bg-blue-500' : 'bg-gray-500'}
                            >
                              {device.dbStatus}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {device.error && (
                        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium text-sm">Error</span>
                          </div>
                          <p className="text-sm text-destructive mt-1">{device.error}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
