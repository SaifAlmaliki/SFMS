
'use client';

import { getServiceObjects } from '@/lib/data';
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

export function ServiceObjectsTable() {
  const objects = getServiceObjects();

  return (
    <div className="space-y-4">
        <div className='flex justify-end'>
            <Button>
                <PlusCircle className='h-4 w-4 mr-2' />
                New Service Object
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Port Range</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objects.map((obj) => (
            <TableRow key={obj.id}>
              <TableCell className="font-medium font-mono">{obj.name}</TableCell>
              <TableCell className='font-mono'>{obj.protocol}</TableCell>
              <TableCell className='font-mono'>{obj.portRange}</TableCell>
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
