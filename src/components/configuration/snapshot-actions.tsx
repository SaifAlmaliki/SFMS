'use client';

import type { Snapshot } from "@/lib/data";
import { SnapshotDiffDialog } from "./snapshot-diff-dialog";
import { RollbackAction } from "./rollback-action";


export function SnapshotActions({ snapshot }: { snapshot: Snapshot }) {
    return (
        <div className='flex items-center justify-end gap-2'>
            <SnapshotDiffDialog snapshot={snapshot} />
            <RollbackAction snapshot={snapshot} />
        </div>
    )
}
