'use client';

import { useActionState, useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { createTicketForPolicyAction } from '@/app/actions';
import { Ticket } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState = {
    error: null,
    success: false,
};

function CreateTicketButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Ticket'}
        </Button>
    );
}

export function CreateTicketDialog({ policyId }: { policyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTicketForPolicyAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: 'Ticket has been created. It will appear in the approvals page.',
      });
      setOpen(false);
    }
    if (state.error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: state.error,
        });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600">
            <Ticket className="h-4 w-4" />
            <span className="sr-only">Create Ticket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Ticket for Policy</DialogTitle>
          <DialogDescription>
            Create a change ticket for this policy. The ticket will be sent for admin approval.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="policyId" value={policyId} />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <CreateTicketButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

