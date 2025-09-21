
'use client';

import { getSnapshots, Snapshot } from '@/lib/data';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { SnapshotActions } from './snapshot-actions';

export function SnapshotList() {
  const snapshots: Snapshot[] = getSnapshots();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Comment</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {snapshots.map((snapshot) => (
          <TableRow key={snapshot.version}>
            <TableCell className="font-mono">{snapshot.version}</TableCell>
            <TableCell>{snapshot.comment}</TableCell>
            <TableCell>{snapshot.author}</TableCell>
            <TableCell>{snapshot.date}</TableCell>
            <TableCell>
              <Badge variant={snapshot.status === 'Live' ? 'default' : 'outline'} className={snapshot.status === 'Live' ? 'bg-accent text-accent-foreground' : ''}>
                {snapshot.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
                <SnapshotActions snapshot={snapshot} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
