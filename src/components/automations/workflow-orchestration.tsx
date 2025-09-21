'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';

const automations = [
  {
    id: 'AUTO-001',
    name: 'Nightly Backup',
    trigger: 'Scheduled (Daily at 2 AM)',
    status: 'Active',
    lastRun: '2024-07-28 02:00:15',
  },
  {
    id: 'AUTO-002',
    name: 'High-Impact Policy Approval',
    trigger: 'Event (Policy Creation)',
    status: 'Active',
    lastRun: '2024-07-27 15:30:00',
  },
  {
    id: 'AUTO-003',
    name: 'Weekly Compliance Report',
    trigger: 'Scheduled (Mondays at 9 AM)',
    status: 'Inactive',
    lastRun: '2024-07-22 09:00:45',
  },
];

export function WorkflowOrchestration() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Workflow Orchestration</CardTitle>
                <CardDescription>
                Build and manage automated workflows.
                </CardDescription>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Workflow
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4">
            <ul className='space-y-4'>
                {automations.map(automation => (
                    <li key={automation.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                        <div className="flex items-center gap-4">
                            <Zap className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-medium">{automation.name}</p>
                                <p className="text-sm text-muted-foreground">{automation.trigger}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <Badge
                                variant={automation.status === 'Active' ? 'secondary' : 'outline'}
                                className={automation.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}
                            >
                                {automation.status}
                            </Badge>
                            <div className='text-sm text-muted-foreground hidden md:block'>
                                <p>Last run: {automation.lastRun}</p>
                            </div>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}
