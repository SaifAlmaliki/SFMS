'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { validatePolicyAction } from '@/app/actions';
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
import { Bot, ShieldCheck, ShieldAlert, ShieldQuestion, Info, AlertTriangle, GitMerge, Fingerprint, LucideIcon } from 'lucide-react';
import type { ValidateFirewallPolicyOutput } from '@/ai/flows/validate-firewall-policy';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const initialState: {
  data?: ValidateFirewallPolicyOutput;
  error?: any;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <ShieldCheck className="mr-2 h-4 w-4" />
      {pending ? 'Validating...' : 'Validate Policy'}
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

const typeIcons: Record<string, React.ReactNode> = {
    'Conflict': <GitMerge className="h-4 w-4 text-orange-500" />,
    'Security': <ShieldAlert className="h-4 w-4 text-red-500" />,
    'Best Practice': <Fingerprint className="h-4 w-4 text-blue-500" />,
    'General': <Info className="h-4 w-4 text-gray-500" />,
};

const severityIcons: Record<string, React.FC<{className?: string}>> = {
    'Critical': (props) => <ShieldAlert {...props} />,
    'High': (props) => <ShieldAlert {...props} />,
    'Medium': (props) => <AlertTriangle {...props} />,
    'Low': (props) => <ShieldQuestion {...props} />,
    'Info': (props) => <Info {...props} />,
};

export function PolicyValidation() {
  const [state, formAction] = useActionState(validatePolicyAction, initialState);
  const [result, setResult] = useState<ValidateFirewallPolicyOutput | null>(null);
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
        <CardTitle>Policy Validation & Conflict Detection</CardTitle>
        <CardDescription>
          Check a firewall policy against security best practices and for conflicts like shadowing or redundancy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="policy">Policy Set (YAML or JSON)</Label>
            <Textarea
              id="policy"
              name="policy"
              placeholder="Paste your policy set configuration here..."
              className="h-40 bg-background font-mono"
            />
          </div>
          <SubmitButton />
        </form>
        {result && (
          <div className="rounded-md border bg-secondary/50 p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary" /> Validation Result
            </h4>
            <div className="space-y-4 text-sm">
                <div className='flex items-center gap-2'>
                    {result.isValid ? (
                        <><ShieldCheck className="h-5 w-5 text-accent" /> <span className='font-medium'>Policy is valid. No issues found.</span></>
                    ) : (
                        <><ShieldAlert className="h-5 w-5 text-destructive" /> <span className='font-medium'>Policy has issues.</span></>
                    )}
                </div>

                {result.findings.length > 0 && (
                    <div>
                        <p className="font-medium mb-2">Findings:</p>
                        <ul className='space-y-2'>
                            {result.findings.map((finding, index) => {
                                const Icon = severityIcons[finding.severity];
                                return (
                                    <li key={index} className="flex items-start gap-3 p-2 rounded-md bg-background/50 border">
                                        <div className="pt-0.5">
                                            {Icon && <Icon className={cn('h-4 w-4', severityStyles[finding.severity]?.replace('bg-', 'text-'))} />}
                                        </div>
                                        <div className='flex-1'>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <Badge className={cn(severityStyles[finding.severity])}>{finding.severity}</Badge>
                                                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                                    {typeIcons[finding.type]}
                                                    <span>{finding.type}</span>
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground">{finding.message}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
