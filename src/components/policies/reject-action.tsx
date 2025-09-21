'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { rejectPolicyAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { XCircle } from 'lucide-react';

const initialState = {
  success: false,
  error: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction asChild>
            <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? 'Rejecting...' : 'Reject & Delete'}
            </Button>
        </AlertDialogAction>
    )
}

export function RejectAction({ policyId }: { policyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(rejectPolicyAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Policy Rejected',
        description: 'The policy has been deleted.',
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <XCircle className="h-4 w-4 mr-1" />
            Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to reject this policy?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the pending policy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <form action={formAction} className='flex gap-2'>
                <input type="hidden" name="id" value={policyId} />
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <SubmitButton />
            </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
