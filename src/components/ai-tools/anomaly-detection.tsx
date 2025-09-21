'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { anomalyDetectionAction } from '@/app/actions';
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
import { Bot, ShieldAlert } from 'lucide-react';
import type { DetectAdminAnomaliesOutput } from '@/ai/flows/detect-admin-anomalies';

const initialState: {
  data?: DetectAdminAnomaliesOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <ShieldAlert className="mr-2 h-4 w-4" />
      {pending ? 'Detecting...' : 'Detect Anomalies'}
    </Button>
  );
}

export function AnomalyDetection() {
  const [state, formAction] = useActionState(anomalyDetectionAction, initialState);
  const [result, setResult] = useState<DetectAdminAnomaliesOutput | null>(null);
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
          <Label htmlFor="adminActions">Admin Actions Log</Label>
          <Textarea
            id="adminActions"
            name="adminActions"
            placeholder="Paste admin action logs here..."
            className="h-32 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="accessPatterns">Access Patterns Log</Label>
          <Textarea
            id="accessPatterns"
            name="accessPatterns"
            placeholder="Paste access pattern logs here..."
            className="h-32 bg-background"
          />
        </div>
        <SubmitButton />
      </form>
      {result && (
        <div className="rounded-md border bg-secondary/50 p-4">
          <h4 className="font-semibold mb-2 flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" /> Detection Result
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-medium">Anomalies:</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.anomalies}</p>
            </div>
            <div>
              <p className="font-medium">Risk Score:</p>
              <p className="text-muted-foreground">{result.riskScore}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
