'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Network } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getActiveSessionsAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';

type DeviceSessions = {
  deviceName: string;
  success: boolean;
  data?: {
    total: number;
    tcp: number;
    udp: number;
  };
  error?: string;
};

export function ActiveSessions() {
  const [devices, setDevices] = useState<DeviceSessions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const result = await getActiveSessionsAction();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
      }
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Network className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>Current firewall session counts</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading active sessions...
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
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Error</Badge>
                  )}
                </div>

                {device.success && device.data ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatNumber(device.data.total)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total Sessions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        {formatNumber(device.data.tcp)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        TCP
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold">
                        {formatNumber(device.data.udp)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        UDP
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    {device.error || 'Failed to fetch sessions'}
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

