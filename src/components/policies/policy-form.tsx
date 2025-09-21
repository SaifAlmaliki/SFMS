'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Policy = {
    id: string;
    name: string;
    source: string;
    destination: string;
    action: 'Allow' | 'Deny';
    status: 'Active' | 'Inactive';
};

interface PolicyFormProps {
    policy?: Policy;
    errors?: any;
    submitButtonText: string;
}

export function PolicyForm({ policy, errors, submitButtonText }: PolicyFormProps) {
  const { pending } = useFormStatus();

  return (
    <div className="grid gap-4 py-4">
        {policy?.id && <input type="hidden" name="id" value={policy.id} />}
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
            Name
            </Label>
            <Input id="name" name="name" className="col-span-3" placeholder="e.g., Allow HTTPS to web servers" defaultValue={policy?.name} />
            {errors?.name && <p className="col-span-4 text-xs text-red-500 text-right">{errors.name[0]}</p>}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source" className="text-right">
            Source
            </Label>
            <Input id="source" name="source" className="col-span-3" placeholder="e.g., Internal-Network" defaultValue={policy?.source} />
             {errors?.source && <p className="col-span-4 text-xs text-red-500 text-right">{errors.source[0]}</p>}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
            Destination
            </Label>
            <Input id="destination" name="destination" className="col-span-3" placeholder="e.g., Web-Servers" defaultValue={policy?.destination} />
            {errors?.destination && <p className="col-span-4 text-xs text-red-500 text-right">{errors.destination[0]}</p>}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="action" className="text-right">
            Action
            </Label>
            <Select name="action" defaultValue={policy?.action || 'Allow'}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an action" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Allow">Allow</SelectItem>
                <SelectItem value="Deny">Deny</SelectItem>
            </SelectContent>
            </Select>
             {errors?.action && <p className="col-span-4 text-xs text-red-500 text-right">{errors.action[0]}</p>}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
            Status
            </Label>
            <Select name="status" defaultValue={policy?.status || 'Active'}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
            </Select>
            {errors?.status && <p className="col-span-4 text-xs text-red-500 text-right">{errors.status[0]}</p>}
        </div>
        <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
                {pending ? 'Saving...' : submitButtonText}
            </Button>
        </div>
    </div>
  );
}
