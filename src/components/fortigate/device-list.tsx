'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Power, PowerOff, RefreshCw, Server } from 'lucide-react';
import { getAllFortiGateDevices, updateDeviceStatus, deleteDevice } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Device {
  id: string;
  name: string;
  ip: string;
  status: 'Active' | 'Inactive';
  version?: string | null;
  updatedAt: Date;
  hasApiKey: boolean;
}

export function DeviceList() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const result = await getAllFortiGateDevices();
      if (result.success) {
        console.log('[DeviceList] Loaded devices:', result.devices.map(d => ({ name: d.name, status: d.status })));
        setDevices(result.devices);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load devices',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load devices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    
    // Listen for device status update events
    const handleDeviceStatusUpdate = () => {
      console.log('[DeviceList] Received deviceStatusUpdated event, refreshing devices...');
      // Add a small delay to ensure database update is complete
      setTimeout(() => {
        loadDevices();
      }, 100);
    };
    
    window.addEventListener('deviceStatusUpdated', handleDeviceStatusUpdate);
    
    return () => {
      window.removeEventListener('deviceStatusUpdated', handleDeviceStatusUpdate);
    };
  }, []);

  const handleStatusChange = async (deviceId: string, newStatus: 'Active' | 'Inactive') => {
    setUpdating(deviceId);
    try {
      const result = await updateDeviceStatus(deviceId, newStatus);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        await loadDevices();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update device status',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update device status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (deviceId: string, deviceName: string) => {
    setUpdating(deviceId);
    try {
      const result = await deleteDevice(deviceId);
      if (result.success) {
        toast({
          title: 'Success',
          description: `Device "${deviceName}" deleted successfully`,
        });
        await loadDevices();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete device',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete device',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Managed Devices
          </CardTitle>
          <CardDescription>View and manage your FortiGate firewall devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading devices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Managed Devices
            </CardTitle>
            <CardDescription>View and manage your FortiGate firewall devices</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDevices}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No devices configured. Add a device using the form above.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{device.name}</h3>
                    <Badge
                      variant={device.status === 'Active' ? 'default' : 'secondary'}
                      className={device.status === 'Active' ? 'bg-green-500' : ''}
                    >
                      {device.status}
                    </Badge>
                    {!device.hasApiKey && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        No API Key
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <div>IP: {device.ip}</div>
                    {device.version && <div>Version: {device.version}</div>}
                    <div>
                      Last updated: {new Date(device.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.status === 'Active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(device.id, 'Inactive')}
                      disabled={updating === device.id}
                    >
                      {updating === device.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PowerOff className="h-4 w-4 mr-2" />
                      )}
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(device.id, 'Active')}
                      disabled={updating === device.id}
                    >
                      {updating === device.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4 mr-2" />
                      )}
                      Activate
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={updating === device.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Device</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{device.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(device.id, device.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

