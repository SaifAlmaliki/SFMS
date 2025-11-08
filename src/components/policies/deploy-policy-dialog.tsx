
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getDevicesSync, type Policy } from '@/lib/data';
import { deployPolicy } from '@/lib/deployment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, CircleDashed, Rocket, Server, XCircle } from 'lucide-react';

type DeploymentStatus = 'Pending' | 'Syncing' | 'Synced' | 'Failed';

type DeviceDeployment = {
    name: string;
    ip: string;
    status: DeploymentStatus;
};

const statusConfig: Record<DeploymentStatus, { className: string; icon: React.ReactNode }> = {
    'Pending': { className: 'bg-gray-500/20 text-gray-500 border-gray-500/20', icon: <CircleDashed className="h-4 w-4" /> },
    'Syncing': { className: 'bg-blue-500/20 text-blue-500 border-blue-500/20 animate-pulse', icon: <Rocket className="h-4 w-4 animate-pulse" /> },
    'Synced': { className: 'bg-green-500/20 text-green-500 border-green-500/20', icon: <CheckCircle className="h-4 w-4" /> },
    'Failed': { className: 'bg-red-500/20 text-red-500 border-red-500/20', icon: <XCircle className="h-4 w-4" /> },
};


export function DeployPolicyDialog({ policy, children, disabled }: { policy: Policy, children: React.ReactNode, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [deployments, setDeployments] = useState<DeviceDeployment[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const devices = getDevicesSync();
      setDeployments(devices.map(d => ({ ...d, status: 'Pending' })));
      setIsDeploying(false);
    }
  }, [open]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    const updatedDeployments = [...deployments];
    let successCount = 0;
    let failCount = 0;

    // Deploy to each device sequentially
    for (let index = 0; index < updatedDeployments.length; index++) {
      const device = updatedDeployments[index];
      
      // Update status to Syncing
      updatedDeployments[index] = { ...device, status: 'Syncing' };
      setDeployments([...updatedDeployments]);
      
      try {
        // Deploy policy to this device
        await deployPolicy({
          policyId: policy.id,
          deployedBy: 'user', // TODO: Get actual user from auth
          targetDevice: device.name,
        });
        
        // Update status to Synced
        updatedDeployments[index] = { ...device, status: 'Synced' };
        successCount++;
      } catch (error: any) {
        // Update status to Failed
        updatedDeployments[index] = { ...device, status: 'Failed' };
        failCount++;
        console.error(`Failed to deploy to ${device.name}:`, error);
      }
      
      // Update state after each deployment
      setDeployments([...updatedDeployments]);
    }

    setIsDeploying(false);
    
    // Show toast based on results
    if (successCount === updatedDeployments.length) {
      toast({
        title: "Deployment Successful",
        description: `Policy ${policy.id} has been deployed to all ${successCount} device(s).`
      });
    } else if (failCount === updatedDeployments.length) {
      toast({
        title: "Deployment Failed",
        description: `Failed to deploy policy ${policy.id} to any device.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: "Deployment Completed with Errors",
        description: `Policy ${policy.id}: ${successCount} succeeded, ${failCount} failed.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploy Policy: <span className='font-mono'>{policy.id}</span></DialogTitle>
          <DialogDescription>
            Push this policy configuration to multiple devices. This simulates an incremental, non-disruptive update.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className='text-right'>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {deployments.map(device => (
                    <TableRow key={device.name}>
                        <TableCell className='font-medium flex items-center gap-2'>
                            <Server className='h-4 w-4 text-muted-foreground' />
                            {device.name}
                        </TableCell>
                        <TableCell className='font-mono'>{device.ip}</TableCell>
                        <TableCell className='text-right'>
                            <Badge variant="outline" className={cn('w-28 justify-center gap-1.5', statusConfig[device.status].className)}>
                                {statusConfig[device.status].icon}
                                {device.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeploying}>
            {isDeploying ? 'Close' : 'Cancel'}
          </Button>
          <Button type="submit" onClick={handleDeploy} disabled={isDeploying}>
            <Rocket className="mr-2 h-4 w-4" />
            {isDeploying ? 'Deploying...' : 'Start Deployment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
