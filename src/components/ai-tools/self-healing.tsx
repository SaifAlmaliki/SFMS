'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { selfHealingAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Sparkles } from 'lucide-react';
import type { SelfHealingMisconfigurationsOutput } from '@/ai/flows/self-healing-misconfigurations';

const initialState: {
  data?: SelfHealingMisconfigurationsOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Sparkles className="mr-2 h-4 w-4" />
      {pending ? 'Analyzing...' : 'Analyze and Correct'}
    </Button>
  );
}

export function SelfHealing() {
  const [state, formAction] = useActionState(selfHealingAction, initialState);
  const [result, setResult] = useState<SelfHealingMisconfigurationsOutput | null>(null);
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
          <Label htmlFor="firewallConfiguration">Firewall Configuration (JSON/YAML)</Label>
          <Textarea
            id="firewallConfiguration"
            name="firewallConfiguration"
            placeholder="Paste your configuration here..."
            className="h-32 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="guardrails">Guardrails (JSON/YAML)</Label>
          <Textarea
            id="guardrails"
            name="guardrails"
            placeholder="Paste your guardrails here..."
            className="h-32 bg-background"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="auto-correct" name="auto-correct" />
          <Label htmlFor="auto-correct">Auto-Correct</Label>
        </div>
        <SubmitButton />
      </form>
      {result && (
        <div className="space-y-4">
          <div className="rounded-md border bg-secondary/50 p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary" /> Analysis Result
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium">Misconfigurations Detected:</p>
                {result.misconfigurationsDetected.length > 0 ? (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {result.misconfigurationsDetected.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">None</p>
                )}
              </div>
              <div>
                <p className="font-medium">Suggested Corrections:</p>
                {result.suggestedCorrections.length > 0 ? (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {result.suggestedCorrections.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                ) : (
                  <p className="text-muted-foreground">None</p>
                )}
              </div>
            </div>
          </div>
          {result.correctedConfiguration && (
            <div className="rounded-md border bg-secondary/50 p-4">
               <h4 className="font-semibold mb-2 flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-primary" /> Corrected Configuration (YAML)
              </h4>
              <pre className="text-sm bg-background p-3 rounded-md overflow-x-auto">
                <code>{result.correctedConfiguration}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

    