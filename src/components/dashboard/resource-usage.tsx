'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Cpu, HardDrive, MemoryStick, Network, Activity, Database, Cloud } from 'lucide-react';
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
    session: number;
    session6: number;
    setuprate: number;
    setuprate6: number;
    npu_session: number;
    npu_session6: number;
    nturbo_session: number;
    nturbo_session6: number;
    disk_lograte: number;
    faz_lograte: number;
    forticloud_lograte: number;
    faz_cloud_lograte: number;
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

  const getStatusColor = (value: number, isPercentage: boolean = true) => {
    if (isPercentage) {
      if (value >= 90) return 'destructive';
      if (value >= 70) return 'default';
      return 'secondary';
    }
    // For non-percentage values, use normal status
    return 'secondary';
  };

  const getStatusBadge = (value: number, isPercentage: boolean = true) => {
    if (isPercentage) {
      if (value >= 90) return { label: 'Critical', variant: 'destructive' as const };
      if (value >= 70) return { label: 'Warning', variant: 'default' as const };
      return { label: 'Normal', variant: 'secondary' as const };
    }
    return { label: 'Normal', variant: 'secondary' as const };
  };

  const formatValue = (value: number, type: 'percentage' | 'count' | 'rate'): string => {
    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else if (type === 'rate') {
      return `${value.toFixed(2)}/s`;
    } else {
      return value.toLocaleString();
    }
  };

  const renderMetric = (
    label: string,
    value: number,
    icon: React.ReactNode,
    type: 'percentage' | 'count' | 'rate' = 'percentage',
    showProgress: boolean = true
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatValue(value, type)}
          </span>
          {type === 'percentage' && (
            <Badge variant={getStatusColor(value, true)}>
              {getStatusBadge(value, true).label}
            </Badge>
          )}
        </div>
      </div>
      {showProgress && type === 'percentage' && (
        <Progress value={value} className="h-2" />
      )}
    </div>
  );

  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Resource Usage
        </CardTitle>
        <CardDescription>System resource utilization and metrics</CardDescription>
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
                  <div className="space-y-6">
                    {/* System Resources Section */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        System Resources
                      </h5>
                      {renderMetric(
                        'CPU',
                        device.data.cpu,
                        <Cpu className="h-4 w-4 text-muted-foreground" />,
                        'percentage'
                      )}
                      {renderMetric(
                        'Memory',
                        device.data.memory,
                        <MemoryStick className="h-4 w-4 text-muted-foreground" />,
                        'percentage'
                      )}
                      {renderMetric(
                        'Disk',
                        device.data.disk,
                        <HardDrive className="h-4 w-4 text-muted-foreground" />,
                        'percentage'
                      )}
                    </div>

                    {/* Sessions Section */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Sessions
                      </h5>
                      {renderMetric(
                        'Active Sessions',
                        device.data.session,
                        <Network className="h-4 w-4 text-muted-foreground" />,
                        'count',
                        false
                      )}
                      {renderMetric(
                        'IPv6 Sessions',
                        device.data.session6,
                        <Network className="h-4 w-4 text-muted-foreground" />,
                        'count',
                        false
                      )}
                      {renderMetric(
                        'NPU Sessions',
                        device.data.npu_session,
                        <Activity className="h-4 w-4 text-muted-foreground" />,
                        'count',
                        false
                      )}
                      {renderMetric(
                        'NPU IPv6 Sessions',
                        device.data.npu_session6,
                        <Activity className="h-4 w-4 text-muted-foreground" />,
                        'count',
                        false
                      )}
                      {renderMetric(
                        'NTurbo Sessions',
                        device.data.nturbo_session,
                        <Activity className="h-4 w-4 text-muted-foreground" />,
                        'count',
                        false
                      )}
                      {renderMetric(
                        'NTurbo IPv6 Sessions',
                        device.data.nturbo_session6,
                        <Activity className="h-4 w-4 text-muted-foreground" />,
                        'count',
                        false
                      )}
                    </div>

                    {/* Setup Rates Section */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Setup Rates
                      </h5>
                      {renderMetric(
                        'Session Setup Rate',
                        device.data.setuprate,
                        <Activity className="h-4 w-4 text-muted-foreground" />,
                        'rate',
                        false
                      )}
                      {renderMetric(
                        'IPv6 Setup Rate',
                        device.data.setuprate6,
                        <Activity className="h-4 w-4 text-muted-foreground" />,
                        'rate',
                        false
                      )}
                    </div>

                    {/* Log Rates Section */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Log Rates
                      </h5>
                      {renderMetric(
                        'Disk Log Rate',
                        device.data.disk_lograte,
                        <Database className="h-4 w-4 text-muted-foreground" />,
                        'rate',
                        false
                      )}
                      {renderMetric(
                        'FAZ Log Rate',
                        device.data.faz_lograte,
                        <Database className="h-4 w-4 text-muted-foreground" />,
                        'rate',
                        false
                      )}
                      {renderMetric(
                        'FortiCloud Log Rate',
                        device.data.forticloud_lograte,
                        <Cloud className="h-4 w-4 text-muted-foreground" />,
                        'rate',
                        false
                      )}
                      {renderMetric(
                        'FAZ Cloud Log Rate',
                        device.data.faz_cloud_lograte,
                        <Cloud className="h-4 w-4 text-muted-foreground" />,
                        'rate',
                        false
                      )}
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

