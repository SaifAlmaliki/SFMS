'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FortiGatePolicyViewerProps {
  policy: {
    id: string;
    name: string;
    vendor?: string;
    rawConfig?: any;
    cliConfig?: string;
    status: string;
    createdAt: string;
  };
}

export function FortiGatePolicyViewer({ policy }: FortiGatePolicyViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "FortiGate CLI configuration copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Try fallback method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "FortiGate CLI configuration copied successfully",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'PendingApproval':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'Inactive':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{policy.name}</span>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                FortiGate
              </Badge>
            </CardTitle>
            <CardDescription>
              Policy ID: {policy.id} • Created: {new Date(policy.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor(policy.status)}>
              {policy.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cli" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cli">CLI Configuration</TabsTrigger>
            <TabsTrigger value="json">JSON Config</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cli" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">FortiGate CLI Commands</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(policy.cliConfig || '')}
                  disabled={!policy.cliConfig}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy CLI'}
                </Button>
              </div>
              <ScrollArea className="h-64 w-full rounded-md border bg-muted p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {policy.cliConfig || 'No CLI configuration available'}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Raw Configuration</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(policy.rawConfig, null, 2))}
                  disabled={!policy.rawConfig}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
              </div>
              <ScrollArea className="h-64 w-full rounded-md border bg-muted p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {policy.rawConfig ? JSON.stringify(policy.rawConfig, null, 2) : 'No raw configuration available'}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {policy.rawConfig && (
          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-medium">Policy Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Source Interface:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.srcintf || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Destination Interface:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.dstintf || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Source Address:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.srcaddr || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Destination Address:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.dstaddr || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Action:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.action || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Service:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.service || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Schedule:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.schedule || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Log Traffic:</span>
                <span className="ml-2 text-muted-foreground">{policy.rawConfig.logtraffic || 'N/A'}</span>
              </div>
            </div>
            {policy.rawConfig.comments && (
              <div>
                <span className="font-medium">Comments:</span>
                <p className="mt-1 text-sm text-muted-foreground">{policy.rawConfig.comments}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
