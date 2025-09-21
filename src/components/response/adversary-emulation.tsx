'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { emulateAdversaryAction } from '@/app/actions';
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
import { Bot, Swords } from 'lucide-react';
import type { EmulateAdversaryOutput } from '@/ai/flows/emulate-adversary';
import { Input } from '../ui/input';

const initialState: {
  data?: EmulateAdversaryOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Swords className="mr-2 h-4 w-4" />
      {pending ? 'Emulating...' : 'Emulate Adversary'}
    </Button>
  );
}

export function AdversaryEmulation() {
  const [state, formAction] = useActionState(emulateAdversaryAction, initialState);
  const [result, setResult] = useState<EmulateAdversaryOutput | null>(null);
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
    <Card>
      <CardHeader>
        <CardTitle>Automated Adversary Emulation</CardTitle>
        <CardDescription>
          Simulate attack patterns against your firewall to test resiliency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Label htmlFor="attackTechniqueId">MITRE ATT&CK Technique ID</Label>
            <Input
              id="attackTechniqueId"
              name="attackTechniqueId"
              placeholder="e.g., T1566"
              className="bg-background font-mono"
            />
          </div>
          <SubmitButton />
        </form>
        {result && (
          <div className="rounded-md border bg-secondary/50 p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary" /> Emulation Report
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium">Summary:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
              </div>
              <div>
                <p className="font-medium">Affected Rules:</p>
                <ul className='list-disc pl-5 text-muted-foreground'>
                    {result.affectedRules.map((rule, i) => <li key={i} className="font-mono">{rule}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium">Recommendations:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.recommendations}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
