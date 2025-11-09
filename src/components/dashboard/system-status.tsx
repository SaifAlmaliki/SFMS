'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Server, Clock, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSystemStatusAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';

type DeviceStatus = {
  deviceName: string;
  success: boolean;
  data?: {
    hostname: string;
    version: string;
    serial: string;
    uptime: number;
    model: string;
  };
  error?: string;
};

export function SystemStatus() {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const result = await getSystemStatusAction();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds === 0) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Status
        </CardTitle>
        <CardDescription>Device information and uptime</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading system status...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No FortiGate devices configured.
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.deviceName}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{device.deviceName}</h4>
                  {device.success ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                      Error
                    </Badge>
                  )}
                </div>

                {device.success && device.data ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Server className="h-4 w-4" />
                        <span>Hostname:</span>
                      </div>
                      <p className="font-medium">{device.data.hostname}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Serial:</span>
                      </div>
                      <p className="font-medium font-mono text-xs">
                        {device.data.serial || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Version:</span>
                      </div>
                      <p className="font-medium">{device.data.version}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Uptime:</span>
                      </div>
                      <p className="font-medium">
                        {formatUptime(device.data.uptime)}
                      </p>
                    </div>

                    {device.data.model && (
                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Model:</span>
                        </div>
                        <p className="font-medium">{device.data.model}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    {device.error || 'Failed to fetch system status'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

