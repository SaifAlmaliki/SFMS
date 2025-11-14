'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2 } from 'lucide-react';
import { approveTicketAction, getActiveDevicesForVendor } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface ApproveTicketButtonProps {
  ticketId: string;
  policyTargetDevice?: string | null;
  policyVendor?: string | null;
}

interface Device {
  id: string;
  name: string;
  ip: string;
  status: string;
  version: string | null;
}

export function ApproveTicketButton({ ticketId, policyTargetDevice, policyVendor }: ApproveTicketButtonProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Determine if device selection is required
  const needsDeviceSelection = !policyTargetDevice;
  
  // Fetch available devices when dialog opens and device selection is needed
  useEffect(() => {
    if (open && needsDeviceSelection && devices.length === 0) {
      setLoadingDevices(true);
      getActiveDevicesForVendor(policyVendor || 'fortigate')
        .then((result) => {
          if (result.success && result.devices) {
            setDevices(result.devices);
            // Auto-select first device if only one is available
            if (result.devices.length === 1) {
              setSelectedDevice(result.devices[0].name);
            }
          } else {
            toast({
              title: 'Error',
              description: result.error || 'Failed to load devices',
              variant: 'destructive',
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching devices:', error);
          toast({
            title: 'Error',
            description: 'Failed to load available devices',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setLoadingDevices(false);
        });
    }
  }, [open, needsDeviceSelection, policyVendor, devices.length, toast]);

  const handleApprove = async () => {
    // Validate device selection if required
    if (needsDeviceSelection && !selectedDevice) {
      toast({
        title: 'Device Required',
        description: 'Please select a firewall device before approving.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      // Use selected device or policy's target device
      const targetDevice = selectedDevice || policyTargetDevice || undefined;
      const result = await approveTicketAction(ticketId, comment, targetDevice);
      
      if (result.success) {
        if (result.warning) {
          toast({
            title: 'Ticket Approved',
            description: result.warning,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Ticket Approved',
            description: 'The change request has been approved and deployed successfully.',
          });
        }
        setOpen(false);
        setComment('');
        setSelectedDevice('');
        // Refresh the page to update the list
        window.location.reload();
      } else {
        toast({
          title: 'Approval Failed',
          description: result.error || 'Failed to approve the ticket.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Change Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to approve this firewall policy change? This will trigger the deployment process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {needsDeviceSelection && (
            <div className="space-y-2">
              <Label htmlFor="target-device">
                Target Firewall Device <span className="text-red-500">*</span>
              </Label>
              {loadingDevices ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available devices...
                </div>
              ) : devices.length === 0 ? (
                <div className="text-sm text-red-600">
                  No active {policyVendor || 'FortiGate'} devices found. Please configure a device in Settings.
                </div>
              ) : (
                <Select value={selectedDevice} onValueChange={setSelectedDevice} required>
                  <SelectTrigger id="target-device">
                    <SelectValue placeholder="Select a firewall device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.name}>
                        {device.name} {device.ip && `(${device.ip})`}
                        {device.version && ` - ${device.version}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Select the firewall device where this policy will be deployed.
              </p>
            </div>
          )}
          
          {!needsDeviceSelection && policyTargetDevice && (
            <div className="space-y-2">
              <Label>Target Firewall Device</Label>
              <div className="text-sm font-medium p-2 bg-muted rounded-md">
                {policyTargetDevice}
              </div>
              <p className="text-xs text-muted-foreground">
                This policy will be deployed to the device specified in the policy.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="approval-comment">Approval Comment (Optional)</Label>
            <Textarea
              id="approval-comment"
              placeholder="Add any notes about this approval..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={loading || (needsDeviceSelection && !selectedDevice) || loadingDevices}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve & Deploy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}