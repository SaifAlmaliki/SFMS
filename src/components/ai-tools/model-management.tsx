'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { modelManagementAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bot, SlidersHorizontal } from 'lucide-react';
import type { ManageRetrainEvaluateVersionOutput } from '@/ai/flows/ai-manage-retrain-evaluate-version';

const initialState: {
  data?: ManageRetrainEvaluateVersionOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <SlidersHorizontal className="mr-2 h-4 w-4" />
      {pending ? 'Running...' : 'Run Management Task'}
    </Button>
  );
}

export function ModelManagement() {
  const [state, formAction] = useActionState(modelManagementAction, initialState);
  const [result, setResult] = useState<ManageRetrainEvaluateVersionOutput | null>(null);
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
        toast({
            title: 'Task Submitted',
            description: 'The model management task has been submitted successfully.',
          });
      setResult(state.data);
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="modelName">Model Name</Label>
          <Input
            id="modelName"
            name="modelName"
            placeholder="Enter model name..."
            className="bg-background"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="retrain" name="retrain" />
          <Label htmlFor="retrain">Retrain</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="evaluate" name="evaluate" />
          <Label htmlFor="evaluate">Evaluate</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="version" name="version" />
          <Label htmlFor="version">Version</Label>
        </div>
        <SubmitButton />
      </form>
      {result && (
        <div className="rounded-md border bg-secondary/50 p-4 mt-4">
          <h4 className="font-semibold mb-2 flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" /> Task Result
          </h4>
          <div className="space-y-2 text-sm">
              <p><strong>Model:</strong> {result.modelName}</p>
              <p><strong>Retrained:</strong> {result.retrained ? 'Yes' : 'No'}</p>
              <p><strong>Evaluated:</strong> {result.evaluated ? 'Yes' : 'No'}</p>
              <p><strong>Versioned:</strong> {result.versioned}</p>
              {result.evaluationResults && <p><strong>Evaluation Results:</strong> {result.evaluationResults}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

    