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
import { createPolicyAction } from '@/app/actions';
import { Library, PlusCircle } from 'lucide-react';
import { PolicyForm } from './policy-form';
import Link from 'next/link';

const initialState = {
    errors: {},
    success: false,
};

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
            Fill in the details to create a new firewall policy, or start from a template.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <PolicyForm errors={state.errors} submitButtonText="Create Policy" />
        </form>
        <DialogFooter className='pt-4 sm:justify-start border-t'>
          <Button variant="outline" asChild>
            <Link href="/templates">
              <Library className="mr-2 h-4 w-4" />
              Browse Templates
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
