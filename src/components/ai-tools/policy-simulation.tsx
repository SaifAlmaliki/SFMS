'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { simulatePolicyAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, PlayCircle } from 'lucide-react';
import type { SimulatePolicyOutput } from '@/ai/flows/simulate-policy';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const initialState: {
  data?: SimulatePolicyOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <PlayCircle className="mr-2 h-4 w-4" />
      {pending ? 'Simulating...' : 'Run Simulation'}
    </Button>
  );
}

const actionStyles = {
    'Allow': 'bg-accent text-accent-foreground',
    'Deny': 'bg-destructive text-destructive-foreground',
    'None': 'bg-yellow-500 text-white',
  };

export function PolicySimulation() {
  const [state, formAction] = useActionState(simulatePolicyAction, initialState);
  const [result, setResult] = useState<SimulatePolicyOutput | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      const errorMsg = state.error._server || Object.values(state.error).join(', ');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
      setResult(null);
    }
    if (state?.data) {
      setResult(state.data);
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="policySet">Policy Set (YAML)</Label>
          <Textarea
            id="policySet"
            name="policySet"
            placeholder="Paste your full policy set here..."
            className="h-40 bg-background font-mono"
          />
        </div>
        <div>
          <Label htmlFor="trafficFlow">Simulated Traffic Flow</Label>
          <Textarea
            id="trafficFlow"
            name="trafficFlow"
            placeholder="e.g., Traffic from 10.0.1.5 to 8.8.8.8 on TCP port 443"
            className="h-20 bg-background"
          />
        </div>
        <SubmitButton />
      </form>
      {result && (
        <div className="rounded-md border bg-secondary/50 p-4">
          <h4 className="font-semibold mb-2 flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" /> Simulation Result
          </h4>
          <div className="space-y-2 text-sm">
              <div className='flex items-center gap-4'>
                  <p className="font-medium">Action:</p>
                  <Badge className={cn('text-base', actionStyles[result.action as keyof typeof actionStyles])}>
                      {result.action}
                  </Badge>
              </div>
            <div>
              <p className="font-medium">Matched Rule:</p>
              <p className="text-muted-foreground font-mono">{result.matchedRule}</p>
            </div>
            <div>
              <p className="font-medium">Explanation:</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

    