'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updatePolicyAction } from '@/app/actions';
import { Pencil } from 'lucide-react';
import { PolicyForm } from './policy-form';
import type { Policy } from '@/lib/data';

const initialState = {
    errors: {},
    success: false,
};

export function EditPolicyDialog({ policy }: { policy: Policy }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updatePolicyAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: 'Policy has been updated.',
      });
      setOpen(false);
      formRef.current?.reset();
    }
    if (state.errors?._server) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: state.errors._server[0],
        });
    }
  }, [state]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit Policy</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
          <DialogDescription>
            Update the details for this firewall policy.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction}>
            <PolicyForm policy={policy} errors={state.errors} submitButtonText="Update Policy" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

    