'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Sparkles, Bot } from 'lucide-react';
import { PolicyTemplate } from '@/lib/data';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryStyles: Record<PolicyTemplate['category'], string> = {
  'Security': 'bg-blue-500/20 text-blue-500 border-blue-500/20',
  'Compliance': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
  'Operations': 'bg-purple-500/20 text-purple-500 border-purple-500/20',
};

interface PolicyTemplateCardProps {
  template: PolicyTemplate;
  onUseTemplate?: (template: PolicyTemplate, customizations?: any) => void;
  onGenerateWithAI?: (template: PolicyTemplate) => void;
}

export function PolicyTemplateCard({ template, onUseTemplate, onGenerateWithAI }: PolicyTemplateCardProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customizations, setCustomizations] = useState({
    source: template.policy.source || '',
    destination: template.policy.destination || '',
    port: template.policy.destPort?.toString() || '',
    justification: '',
  });

  const handleUseTemplate = () => {
    if (onUseTemplate) {
      onUseTemplate(template, customizations);
    } else {
      // Default: Navigate to AI tools with template pre-filled
      const query = `Create firewall policy from template "${template.name}": Source: ${customizations.source}, Destination: ${customizations.destination}, Port: ${customizations.port || 'any'}. Business justification: ${customizations.justification || 'Using template for consistent policy creation'}`;
      router.push(`/ai-tools?template=${encodeURIComponent(template.id)}&query=${encodeURIComponent(query)}`);
    }
    setIsDialogOpen(false);
  };

  const handleGenerateWithAI = () => {
    if (onGenerateWithAI) {
      onGenerateWithAI(template);
    } else {
      // Navigate to AI tools with template context
      const query = `Using template "${template.name}" (${template.category}), help me customize this policy for my specific needs. ${template.description}`;
      router.push(`/ai-tools?template=${encodeURIComponent(template.id)}&query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <Badge variant="outline" className={categoryStyles[template.category]}>
              {template.category}
            </Badge>
          </div>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm flex-grow">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source:</span>
            <span className="font-mono text-xs">{template.policy.source || 'Any'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Destination:</span>
            <span className="font-mono text-xs">{template.policy.destination || 'Any'}</span>
          </div>
          {template.policy.destPort && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Port:</span>
              <span className="font-mono text-xs">{template.policy.destPort}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action:</span>
            <Badge 
              variant={template.policy.action === 'Allow' ? 'default' : 'destructive'} 
              className={template.policy.action === 'Allow' ? 'bg-green-500/20 text-green-500' : ''}
            >
              {template.policy.action || 'Deny'}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button 
            className="w-full" 
            onClick={() => setIsDialogOpen(true)}
          >
            <Layers className="mr-2 h-4 w-4" />
            Use Template
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGenerateWithAI}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Customize with AI
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Template: {template.name}</DialogTitle>
            <DialogDescription>
              Fill in the details for your policy. Leave fields empty to use template defaults.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder={template.policy.source || 'e.g., 10.0.0.0/8'}
                value={customizations.source}
                onChange={(e) => setCustomizations({ ...customizations, source: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder={template.policy.destination || 'e.g., 192.0.2.0/24'}
                value={customizations.destination}
                onChange={(e) => setCustomizations({ ...customizations, destination: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port (optional)</Label>
              <Input
                id="port"
                type="number"
                placeholder={template.policy.destPort?.toString() || 'e.g., 443'}
                value={customizations.port}
                onChange={(e) => setCustomizations({ ...customizations, port: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="justification">Business Justification</Label>
              <Textarea
                id="justification"
                placeholder="Why is this policy needed?"
                value={customizations.justification}
                onChange={(e) => setCustomizations({ ...customizations, justification: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate}>
              <Bot className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

