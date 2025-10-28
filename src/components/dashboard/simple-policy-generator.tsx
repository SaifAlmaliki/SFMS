'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SimplePolicyGenerator() {
  const [description, setDescription] = useState('');
  const [policy, setPolicy] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePolicy = async () => {
    if (!description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a policy description.',
      });
      return;
    }

    setLoading(true);
    
    // Simulate policy generation with a simple template
    setTimeout(() => {
      const generatedPolicy = `name: "Generated Policy"
description: "${description}"
source: "internal"
destination: "external"
action: "Allow"
protocol: "TCP"
port: "443"
status: "PendingApproval"
created_at: "${new Date().toISOString()}"
business_justification: "${description}"`;
      
      setPolicy(generatedPolicy);
      setLoading(false);
      toast({
        title: 'Success',
        description: 'Policy generated successfully!',
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., 'Allow HTTPS traffic from the internal network to the DMZ.'"
          className="min-h-[100px] bg-background"
        />
        <Button onClick={generatePolicy} disabled={loading}>
          <Sparkles className="mr-2" />
          {loading ? 'Generating...' : 'Generate Policy'}
        </Button>
      </div>
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
