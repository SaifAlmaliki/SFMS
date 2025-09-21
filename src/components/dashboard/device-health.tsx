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

type DeviceStatus = 'Online' | 'Offline' | 'Warning';
type Device = {
  name: string;
  status: DeviceStatus;
  ip: string;
};

const initialDevices: Device[] = [
  { name: 'FW-Primary-DC1', status: 'Online', ip: '10.1.1.1' },
  { name: 'FW-Secondary-DC1', status: 'Online', ip: '10.1.1.2' },
  { name: 'FW-Branch-Office-A', status: 'Warning', ip: '192.168.1.1' },
  { name: 'FW-Cloud-VPC', status: 'Online', ip: '172.16.0.1' },
  { name: 'FW-DMZ', status: 'Offline', ip: '10.100.1.5' },
];

const statusStyles = {
  Online: 'bg-accent',
  Offline: 'bg-destructive',
  Warning: 'bg-yellow-500',
};

const possibleStatuses: DeviceStatus[] = ['Online', 'Offline', 'Warning'];

export function DeviceHealth() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((currentDevices) =>
        currentDevices.map((device) => {
          if (Math.random() < 0.1) { // 10% chance to change status
            const newStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
            return { ...device, status: newStatus };
          }
          return device;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);


  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl">Device Health</CardTitle>
        <CardDescription>Real-time status of your firewalls.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {devices.map((device) => (
            <li key={device.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-muted-foreground">{device.ip}</p>
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
      </CardContent>
    </Card>
  );
}
