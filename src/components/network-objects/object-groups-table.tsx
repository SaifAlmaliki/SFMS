
'use client';

import { ObjectGroup } from '@/lib/data';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ObjectGroupsTableProps {
  objects: ObjectGroup[];
}

export function ObjectGroupsTable({ objects }: ObjectGroupsTableProps) {

  return (
    <div className="space-y-4">
        <div className='flex justify-end'>
            <Button>
                <PlusCircle className='h-4 w-4 mr-2' />
                New Group
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objects.map((obj) => (
            <TableRow key={obj.id}>
              <TableCell className="font-medium font-mono">{obj.name}</TableCell>
              <TableCell>
                <Badge variant={obj.type === 'Address' ? 'secondary' : 'default'} className={obj.type === 'Address' ? '' : 'bg-blue-500/20 text-blue-500 border-blue-500/20'}>{obj.type}</Badge>
              </TableCell>
              <TableCell className='font-mono'>{obj.members.join(', ')}</TableCell>
              <TableCell>{obj.description}</TableCell>
              <TableCell className="text-right">
                <div className='flex justify-end gap-2'>
                    <Button variant="ghost" size="icon"><Pencil className='h-4 w-4'/></Button>
                    <Button variant="ghost" size="icon" className='text-destructive hover:text-destructive'><Trash2 className='h-4 w-4'/></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
