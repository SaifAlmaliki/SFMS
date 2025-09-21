
'use client';

import { getSnapshots } from '@/lib/data';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function SnapshotList() {
  const snapshots = getSnapshots();

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
                <div className='flex items-center justify-end gap-2'>
                    <Button variant="outline" size="sm">View Diff</Button>
                    <Button variant="outline" size="sm">Rollback</Button>
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
