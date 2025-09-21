'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createIncidentAction } from '@/app/actions';
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
import { Bot, Siren } from 'lucide-react';
import type { CreateIncidentOutput } from '@/ai/flows/create-incident';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const initialState: {
  data?: CreateIncidentOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Siren className="mr-2 h-4 w-4" />
      {pending ? 'Creating...' : 'Create Incident'}
    </Button>
  );
}

const severityStyles: Record<string, string> = {
    'Critical': 'bg-red-700 text-white',
    'High': 'bg-red-500 text-white',
    'Medium': 'bg-yellow-500 text-white',
    'Low': 'bg-blue-500 text-white',
    'Info': 'bg-gray-500 text-white',
};

export function IncidentManagement() {
  const [state, formAction] = useActionState(createIncidentAction, initialState);
  const [result, setResult] = useState<CreateIncidentOutput | null>(null);
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
      toast({
        title: `Incident ${state.data.incidentId} Created`,
        description: `Severity: ${state.data.severity}`
      })
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Response & Case Management</CardTitle>
        <CardDescription>
          Open a new incident from an alert or event description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="eventDescription">Event Description</Label>
            <Textarea
              id="eventDescription"
              name="eventDescription"
              placeholder="Describe the security event, alert, or observation..."
              className="h-52 bg-background"
            />
          </div>
          <SubmitButton />
        </form>
        {result && (
          <div className="rounded-md border bg-secondary/50 p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary" /> Incident Report
            </h4>
            <div className="space-y-3 text-sm">
                <div>
                    <p className="font-medium">Incident ID:</p>
                    <p className="text-muted-foreground font-mono">{result.incidentId}</p>
                </div>
                <div>
                    <p className="font-medium">Title:</p>
                    <p className="text-muted-foreground">{result.title}</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="font-medium">Severity:</p>
                    <Badge className={cn(severityStyles[result.severity as keyof typeof severityStyles])}>{result.severity}</Badge>
                </div>
              <div>
                <p className="font-medium">Summary:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
              </div>
              <div>
                <p className="font-medium">Recommended Actions:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.recommendedActions}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
