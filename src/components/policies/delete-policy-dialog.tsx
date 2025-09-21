'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { deletePolicyAction } from '@/app/actions';
import { Trash2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState = {
    error: null,
    success: false,
};

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction asChild>
            <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? 'Deleting...' : 'Delete'}
            </Button>
        </AlertDialogAction>
    )
}


export function DeletePolicyDialog({ policyId }: { policyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(deletePolicyAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: 'Policy has been deleted.',
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
  }, [state]);


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Policy</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the policy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <form action={formAction} className='flex gap-2'>
                <input type="hidden" name="id" value={policyId} />
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <DeleteButton />
            </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    