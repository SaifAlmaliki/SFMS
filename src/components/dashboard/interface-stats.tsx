'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getInterfaceStatsAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

type Interface = {
  name: string;
  status: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  speed: number;
};

type DeviceInterfaces = {
  deviceName: string;
  success: boolean;
  data?: {
    interfaces: Interface[];
  };
  error?: string;
};

export function InterfaceStats() {
  const [devices, setDevices] = useState<DeviceInterfaces[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

  const fetchInterfaces = async () => {
    try {
      setLoading(true);
      const result = await getInterfaceStatsAction();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
      }
    } catch (err) {
      console.error('Error fetching interface stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterfaces();
    const interval = setInterval(fetchInterfaces, 30000); // Refresh every 30 seconds
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

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(2)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(2)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatPackets = (packets: number) => {
    if (packets >= 1000000) return `${(packets / 1000000).toFixed(2)}M`;
    if (packets >= 1000) return `${(packets / 1000).toFixed(2)}K`;
    return packets.toString();
  };

  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Interface Statistics
        </CardTitle>
        <CardDescription>Network interface traffic and status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading interface statistics...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No FortiGate devices configured.
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <Collapsible
                key={device.deviceName}
                open={expandedDevices.has(device.deviceName)}
                onOpenChange={() => toggleDevice(device.deviceName)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{device.deviceName}</h4>
                      {device.success && device.data && (
                        <Badge variant="outline">
                          {device.data.interfaces.length} interfaces
                        </Badge>
                      )}
                      {!device.success && (
                        <Badge variant="destructive">Error</Badge>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedDevices.has(device.deviceName) ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-3">
                      {device.success && device.data ? (
                        device.data.interfaces.length > 0 ? (
                          <div className="space-y-3">
                            {device.data.interfaces.map((iface, idx) => (
                              <div
                                key={idx}
                                className="border rounded p-3 space-y-2 text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{iface.name}</span>
                                  <Badge
                                    variant={
                                      iface.status === 'up' ? 'default' : 'secondary'
                                    }
                                  >
                                    {iface.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">RX:</span>{' '}
                                    {formatBytes(iface.rxBytes)} ({formatPackets(iface.rxPackets)} pkts)
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">TX:</span>{' '}
                                    {formatBytes(iface.txBytes)} ({formatPackets(iface.txPackets)} pkts)
                                  </div>
                                  {iface.speed > 0 && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Speed:</span>{' '}
                                      {iface.speed} Mbps
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No interface data available
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-destructive">
                          {device.error || 'Failed to fetch interface stats'}
                        </p>
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

