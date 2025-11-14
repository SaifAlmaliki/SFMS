'use client';

import { DeletePolicyDialog } from "./delete-policy-dialog";
import { EditPolicyDialog } from "./edit-policy-dialog";
import { CreateTicketDialog } from "./create-ticket-dialog";
import type { Policy, UserRole } from "@/lib/data";
import { ApproveAction } from "./approve-action";
import { RejectAction } from "./reject-action";

interface PolicyActionsProps {
    policy: Policy;
    currentUserRole: UserRole;
}

export function PolicyActions({ policy, currentUserRole }: PolicyActionsProps) {
    const isPending = policy.status === 'Pending Approval';
    const isAdmin = currentUserRole === 'Administrator';

    return (
        <div className="flex items-center justify-end gap-2">
            {isPending && isAdmin && (
                <>
                    <ApproveAction policyId={policy.id} />
                    <RejectAction policyId={policy.id} />
                </>
            )}
            {!isPending && (
                <>
                    <CreateTicketDialog policyId={policy.id} />
                    <EditPolicyDialog policy={policy} />
                    <DeletePolicyDialog policyId={policy.id} />
                </>
            )}
        </div>
    )
}
