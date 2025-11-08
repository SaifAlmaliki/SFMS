'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDeviceHealthAction } from '@/app/actions';

type DeviceStatus = 'Online' | 'Offline' | 'Warning';
type Device = {
  name: string;
  status: DeviceStatus;
  ip: string;
  version?: string;
  serial?: string;
  error?: string;
};

const statusStyles = {
  Online: 'bg-accent',
  Offline: 'bg-destructive',
  Warning: 'bg-yellow-500',
};

export function DeviceHealth() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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


  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl">Device Health</CardTitle>
        <CardDescription>Real-time status of your firewalls.</CardDescription>
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
          <ul className="space-y-4">
            {devices.map((device) => (
              <li key={device.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.ip}
                      {device.version && (
                        <span className="ml-2 text-xs">v{device.version}</span>
                      )}
                    </p>
                    {device.error && (
                      <p className="text-xs text-destructive mt-1">{device.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      statusStyles[device.status]
                    }`}
                  />
                  <span className="text-sm font-medium">{device.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
