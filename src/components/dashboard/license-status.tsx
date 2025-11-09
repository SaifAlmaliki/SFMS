'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck, Calendar, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLicenseStatusAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

type DeviceLicense = {
  deviceName: string;
  success: boolean;
  data?: {
    status: string;
    expiry: string | null;
    contract: string | null;
    vmQuota: number | null;
    vmUsed: number | null;
  };
  error?: string;
};

export function LicenseStatus() {
  const [devices, setDevices] = useState<DeviceLicense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const result = await getLicenseStatusAction();
      
      if (result.success && result.devices) {
        setDevices(result.devices);
      }
    } catch (err) {
      console.error('Error fetching license status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
    const interval = setInterval(fetchLicenses, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getLicenseStatusBadge = (status: string, expiry: string | null) => {
    if (status?.toLowerCase().includes('valid') || status?.toLowerCase().includes('active')) {
      if (expiry) {
        try {
          const expiryDate = parseISO(expiry);
          const daysUntilExpiry = Math.floor(
            (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExpiry < 30) {
            return { label: 'Expiring Soon', variant: 'default' as const };
          }
        } catch (e) {
          // Invalid date format
        }
      }
      return { label: 'Valid', variant: 'secondary' as const };
    }
    if (status?.toLowerCase().includes('expired')) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    return { label: status || 'Unknown', variant: 'outline' as const };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          License Status
        </CardTitle>
        <CardDescription>FortiGate license and subscription information</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && devices.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading license status...
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
                  {device.success && device.data ? (
                    <Badge {...getLicenseStatusBadge(device.data.status, device.data.expiry)}>
                      {getLicenseStatusBadge(device.data.status, device.data.expiry).label}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Error</Badge>
                  )}
                </div>

                {device.success && device.data ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Status:</span>
                      </div>
                      <p className="font-medium">{device.data.status}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Expiry:</span>
                      </div>
                      <p className="font-medium">
                        {formatDate(device.data.expiry)}
                      </p>
                    </div>

                    {device.data.contract && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Contract:</span>
                        </div>
                        <p className="font-medium font-mono text-xs">
                          {device.data.contract}
                        </p>
                      </div>
                    )}

                    {(device.data.vmQuota !== null || device.data.vmUsed !== null) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>VM Usage:</span>
                        </div>
                        <p className="font-medium">
                          {device.data.vmUsed ?? 0} / {device.data.vmQuota ?? 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    {device.error || 'Failed to fetch license status'}
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

