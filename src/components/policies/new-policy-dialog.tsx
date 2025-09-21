'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createPolicyAction } from '@/app/actions';
import { PlusCircle } from 'lucide-react';

const initialState = {
    errors: {},
    success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Policy'}
        </Button>
    )
}

export function NewPolicyDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createPolicyAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: 'New policy has been created.',
      });
      setOpen(false);
    }
    if (state.errors?._server) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: state.errors._server[0],
        });
    }
  }, [state, toast]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new firewall policy.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                Name
                </Label>
                <Input id="name" name="name" className="col-span-3" placeholder="e.g., Allow HTTPS to web servers" />
                {state.errors?.name && <p className="col-span-4 text-xs text-red-500 text-right">{state.errors.name[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source" className="text-right">
                Source
                </Label>
                <Input id="source" name="source" className="col-span-3" placeholder="e.g., Internal-Network" />
                 {state.errors?.source && <p className="col-span-4 text-xs text-red-500 text-right">{state.errors.source[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="destination" className="text-right">
                Destination
                </Label>
                <Input id="destination" name="destination" className="col-span-3" placeholder="e.g., Web-Servers" />
                {state.errors?.destination && <p className="col-span-4 text-xs text-red-500 text-right">{state.errors.destination[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="action" className="text-right">
                Action
                </Label>
                <Select name="action" defaultValue='Allow'>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Allow">Allow</SelectItem>
                    <SelectItem value="Deny">Deny</SelectItem>
                </SelectContent>
                </Select>
                 {state.errors?.action && <p className="col-span-4 text-xs text-red-500 text-right">{state.errors.action[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                Status
                </Label>
                <Select name="status" defaultValue='Active'>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
                </Select>
                {state.errors?.status && <p className="col-span-4 text-xs text-red-500 text-right">{state.errors.status[0]}</p>}
            </div>
            </div>
            <DialogFooter>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
