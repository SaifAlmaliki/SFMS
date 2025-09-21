'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { rollbackSnapshotAction } from '@/app/actions';
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
import { History } from 'lucide-react';
import type { Snapshot } from '@/lib/data';

const initialState = {
  success: false,
  error: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction asChild>
            <Button type="submit" variant="destructive" disabled={pending}>
                <History className="mr-2 h-4 w-4" />
                {pending ? 'Rolling back...' : 'Confirm Rollback'}
            </Button>
        </AlertDialogAction>
    )
}

export function RollbackAction({ snapshot }: { snapshot: Snapshot }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(rollbackSnapshotAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Rollback Successful',
        description: `Successfully rolled back to version ${snapshot.version}.`,
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
  }, [state, toast, snapshot.version]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={snapshot.status === 'Live'}>
            <History className="mr-2 h-4 w-4" />
            Rollback
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to roll back?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will revert the live configuration to version <strong className='font-mono'>{snapshot.version}</strong>. This may cause service interruptions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <form action={formAction} className='flex gap-2'>
                <input type="hidden" name="version" value={snapshot.version} />
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <SubmitButton />
            </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
