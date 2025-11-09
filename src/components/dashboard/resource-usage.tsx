'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getResourceUsageAction } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

type DeviceResource = {
  deviceName: string;
  success: boolean;
  data?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  error?: string;
};

export function ResourceUsage() {
  const [devices, setDevices] = useState<DeviceResource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const result = await getResourceUsageAction();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
      }
    } catch (err) {
      console.error('Error fetching resource usage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number) => {
    if (value >= 90) return 'destructive';
    if (value >= 70) return 'default';
    return 'secondary';
  };

  const getStatusBadge = (value: number) => {
    if (value >= 90) return { label: 'Critical', variant: 'destructive' as const };
    if (value >= 70) return { label: 'Warning', variant: 'default' as const };
    return { label: 'Normal', variant: 'secondary' as const };
  };

  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Resource Usage
        </CardTitle>
        <CardDescription>CPU, memory, and disk utilization</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading resource usage...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No FortiGate devices configured.
          </div>
        ) : (
          <div className="space-y-6">
            {devices.map((device) => (
              <div key={device.deviceName} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{device.deviceName}</h4>
                  {!device.success && (
                    <Badge variant="destructive">Error</Badge>
                  )}
                </div>

                {device.success && device.data ? (
                  <div className="space-y-4">
                    {/* CPU Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">CPU</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {device.data.cpu.toFixed(1)}%
                          </span>
                          <Badge variant={getStatusColor(device.data.cpu)}>
                            {getStatusBadge(device.data.cpu).label}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={device.data.cpu} className="h-2" />
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MemoryStick className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Memory</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {device.data.memory.toFixed(1)}%
                          </span>
                          <Badge variant={getStatusColor(device.data.memory)}>
                            {getStatusBadge(device.data.memory).label}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={device.data.memory} className="h-2" />
                    </div>

                    {/* Disk Usage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Disk</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {device.data.disk.toFixed(1)}%
                          </span>
                          <Badge variant={getStatusColor(device.data.disk)}>
                            {getStatusBadge(device.data.disk).label}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={device.data.disk} className="h-2" />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    {device.error || 'Failed to fetch resource usage'}
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

