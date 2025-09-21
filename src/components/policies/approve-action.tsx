'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { approvePolicyAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

const initialState = {
  success: false,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" className="text-green-500 hover:text-green-600" disabled={pending}>
      <CheckCircle className="h-4 w-4 mr-1" />
      {pending ? 'Approving...' : 'Approve'}
    </Button>
  );
}

export function ApproveAction({ policyId }: { policyId: string }) {
  const [state, formAction] = useActionState(approvePolicyAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Policy Approved',
        description: 'The policy is now active.',
      });
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
    <form action={formAction}>
      <input type="hidden" name="id" value={policyId} />
      <SubmitButton />
    </form>
  );
}
