'use client';

import { AddressObject } from '@/lib/data';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Pencil, Trash2 } from 'lucide-react';

interface AddressObjectsTableProps {
  objects: AddressObject[];
}

export function AddressObjectsTable({ objects }: AddressObjectsTableProps) {

  return (
    <div className="space-y-4">
        <div className='flex justify-end'>
            <Button>
                New Address Object
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objects.map((obj) => (
            <TableRow key={obj.id}>
              <TableCell className="font-medium font-mono">{obj.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{obj.type}</Badge>
              </TableCell>
              <TableCell className='font-mono'>{obj.value}</TableCell>
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
