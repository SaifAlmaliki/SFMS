'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getSnapshotDiff, Snapshot } from '@/lib/data';
import { Diff } from 'lucide-react';

export function SnapshotDiffDialog({ snapshot }: { snapshot: Snapshot }) {
    // In a real app, you'd fetch the diff. Here we simulate it.
    const diff = getSnapshotDiff(snapshot.version);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Diff className="mr-2 h-4 w-4" />
            View Diff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Configuration Diff</DialogTitle>
          <DialogDescription>
            Showing changes for version <span className="font-mono">{snapshot.version}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-auto rounded-md bg-secondary/50 p-4 font-mono text-sm">
            <pre>
                {diff.split('\n').map((line, i) => {
                    const color = line.startsWith('+') ? 'text-green-500' : line.startsWith('-') ? 'text-red-500' : 'text-muted-foreground';
                    return (
                        <div key={i} className={color}>
                            <span>{line}</span>
                        </div>
                    )
                })}
            </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
