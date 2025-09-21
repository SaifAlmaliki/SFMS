
'use client';

import { Button } from '@/components/ui/button';
import { DeployPolicyDialog } from './deploy-policy-dialog';
import type { Policy } from '@/lib/data';
import { Rocket } from 'lucide-react';

interface DeployActionProps {
    policy: Policy;
}

export function DeployAction({ policy }: DeployActionProps) {
    const isPending = policy.status === 'Pending Approval';
    const isInactive = policy.status === 'Inactive';
    const canDeploy = !isPending;

    return (
        <DeployPolicyDialog policy={policy} disabled={!canDeploy}>
            <Button
                variant="outline"
                size="sm"
                className="w-24"
                disabled={!canDeploy}
                aria-label={isPending ? 'Policy must be approved before deploying' : (isInactive ? 'Policy is inactive' : 'Deploy Policy')}
            >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy
            </Button>
        </DeployPolicyDialog>
    );
}
