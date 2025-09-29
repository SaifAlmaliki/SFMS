'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { generatePolicyAction } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bot, Sparkles } from 'lucide-react';

const initialState = {
  error: { description: [] as string[] },
  data: undefined,
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Sparkles className="mr-2" />
      {pending ? 'Generating...' : 'Generate Policy'}
    </Button>
  );
}

export function PolicyGenerator() {
  const [state, formAction] = useActionState(generatePolicyAction, initialState);
  const [policy, setPolicy] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      let errorMsg: string[] = [];
      
      if ('_server' in state.error && state.error._server) {
        errorMsg = state.error._server;
      } else if ('description' in state.error && state.error.description) {
        errorMsg = state.error.description;
      }
      
      if (errorMsg.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMsg.join(', '),
        });
      }
    }
    if (state?.data) {
      setPolicy(state.data);
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-4">
        <Textarea
          name="description"
          placeholder="e.g., 'Allow HTTPS traffic from the internal network to the DMZ.'"
          className="min-h-[100px] bg-background"
        />
        <SubmitButton />
      </form>
      {policy && (
        <div className="rounded-md border bg-secondary/50 p-4">
          <h4 className="font-semibold mb-2 flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" /> Generated Policy (YAML)
          </h4>
          <pre className="text-sm bg-background p-3 rounded-md overflow-x-auto">
            <code>{policy}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
