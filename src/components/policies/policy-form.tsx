'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Policy } from '@/lib/data';
import { getAddressObjectsSync, getObjectGroupsSync } from '@/lib/data';

interface PolicyFormProps {
    policy?: Omit<Policy, 'id'> & { id?: string };
    errors?: any;
    submitButtonText: string;
}

export function PolicyForm({ policy, errors, submitButtonText }: PolicyFormProps) {
  const { pending } = useFormStatus();
  const availableStatuses = policy?.id ? ['Active', 'Inactive'] : [];
  
  const addressObjects = getAddressObjectsSync();
  const addressGroups = getObjectGroupsSync().filter(g => g.type === 'Address');
  const networkObjectOptions = [
    { label: 'Default Zones', options: [
        { value: 'Internal', label: 'Internal' },
        { value: 'Public', label: 'Public' },
        { value: 'DMZ', label: 'DMZ' },
        { value: 'Any', label: 'Any' },
    ] },
    { label: 'Address Groups', options: addressGroups.map(o => ({ value: o.name, label: o.name })) },
    { label: 'Address Objects', options: addressObjects.map(o => ({ value: o.name, label: o.name })) },
  ];

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
            <Select name="source" defaultValue={policy?.source}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a source..." />
                </SelectTrigger>
                <SelectContent>
                    {networkObjectOptions.map(group => (
                        <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
             {errors?.source && <p className="col-span-4 text-xs text-red-500 text-right">{errors.source[0]}</p>}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destination" className="text-right">
            Destination
            </Label>
            <Select name="destination" defaultValue={policy?.destination}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a destination..." />
                </SelectTrigger>
                <SelectContent>
                    {networkObjectOptions.map(group => (
                         <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.options.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
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
        {policy?.id && (
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
            Status
            </Label>
            <Select name="status" defaultValue={policy?.status || 'Active'}>
            <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
                {availableStatuses.map(status => (
                     <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
            </SelectContent>
            </Select>
            {errors?.status && <p className="col-span-4 text-xs text-red-500 text-right">{errors.status[0]}</p>}
        </div>
        )}
        <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
                {pending ? 'Saving...' : submitButtonText}
            </Button>
        </div>
    </div>
  );
}
