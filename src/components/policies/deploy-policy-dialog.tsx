
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

  const handleDeploy = () => {
    setIsDeploying(true);

    // Simulate incremental deployment
    deployments.forEach((_, index) => {
        setTimeout(() => {
            setDeployments(prev => prev.map((d, i) => i === index ? { ...d, status: 'Syncing' } : d));
            
            setTimeout(() => {
                setDeployments(prev => prev.map((d, i) => {
                    if (i === index) {
                        // Simulate a failure for one device
                        const newStatus = d.name.includes('Branch-Office') ? 'Failed' : 'Synced';
                        return { ...d, status: newStatus };
                    }
                    return d;
                }));

                // Check if all deployments are done
                if (index === deployments.length - 1) {
                    setIsDeploying(false);
                    toast({
                        title: "Deployment Finished",
                        description: `Policy ${policy.id} deployment process has completed.`
                    });
                }

            }, 1000 + Math.random() * 500); // Simulate sync time

        }, index * 500); // Stagger the start of each deployment
    });
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
