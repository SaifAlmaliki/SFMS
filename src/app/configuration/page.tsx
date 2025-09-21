
import { SnapshotList } from '@/components/configuration/snapshot-list';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { ScheduleSnapshotDialog } from '@/components/configuration/schedule-snapshot-dialog';
  
  export default function ConfigurationPage() {
    return (
      <div className="space-y-4">
         <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold">Configuration Management</h1>
                <p className="text-muted-foreground">
                    Manage configuration snapshots, rollbacks, and policy deployments.
                </p>
            </div>
            <div className='flex items-center gap-2'>
                <ScheduleSnapshotDialog />
                <Button><Save className='h-4 w-4 mr-2' /> Create Snapshot</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Configuration Snapshots</CardTitle>
                <CardDescription>
                    Version-controlled snapshots of your firewall configuration with rollback points.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SnapshotList />
            </CardContent>
        </Card>
      </div>
    );
  }
  