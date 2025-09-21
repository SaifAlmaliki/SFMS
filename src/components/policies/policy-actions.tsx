'use client';

import { DeletePolicyDialog } from "./delete-policy-dialog";
import { EditPolicyDialog } from "./edit-policy-dialog";

type Policy = {
    id: string;
    name: string;
    source: string;
    destination: string;
    action: 'Allow' | 'Deny';
    status: 'Active' | 'Inactive';
};


export function PolicyActions({ policy }: { policy: Policy }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <EditPolicyDialog policy={policy} />
            <DeletePolicyDialog policyId={policy.id} />
        </div>
    )
}
