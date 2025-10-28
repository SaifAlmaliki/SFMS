'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ExternalLink,
  History,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface PolicyWithHistory {
  id: string;
  name: string;
  source: string;
  destination: string;
  destPort: number | null;
  action: string;
  status: string;
  businessJustification: string | null;
  requestedBy: string | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  targetDevice: string | null;
  history: PolicyHistoryEntry[];
}

interface PolicyHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  comment: string | null;
  previousStatus: string | null;
  newStatus: string | null;
}

interface DuplicatePolicyWarningProps {
  matchedPolicies: PolicyWithHistory[];
  onProceedAnyway: () => void;
  onCancel: () => void;
  onTestConnection?: () => void;
}

export function DuplicatePolicyWarning({ 
  matchedPolicies, 
  onProceedAnyway, 
  onCancel,
  onTestConnection 
}: DuplicatePolicyWarningProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyWithHistory | null>(
    matchedPolicies.length > 0 ? matchedPolicies[0] : null
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PendingApproval':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
      case 'Rejected':
        return 'bg-red-500/20 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <User className="h-3 w-3" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'deployed':
        return <ExternalLink className="h-3 w-3 text-blue-500" />;
      case 'deactivated':
        return <XCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <History className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Duplicate Policy Detected!</strong> Found {matchedPolicies.length} existing policy(ies) 
          that cover the same connection. Review the details below before proceeding.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="policies">Existing Policies</TabsTrigger>
          <TabsTrigger value="history">Policy History</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          {matchedPolicies.map((policy) => (
            <Card 
              key={policy.id} 
              className={`cursor-pointer transition-colors ${
                selectedPolicy?.id === policy.id ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedPolicy(policy)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{policy.name}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(policy.status)}>
                      {getStatusIcon(policy.status)}
                      <span className="ml-1">{policy.status}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {policy.id}
                  </div>
                </div>
                <CardDescription>
                  {policy.source} → {policy.destination}:{policy.destPort} ({policy.action})
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2 text-muted-foreground">
                      {policy.createdAt.toLocaleDateString()} by {policy.requestedBy || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Device:</span>
                    <span className="ml-2 text-muted-foreground">
                      {policy.targetDevice || 'Not specified'}
                    </span>
                  </div>
                  {policy.businessJustification && (
                    <div className="col-span-2">
                      <span className="font-medium">Business Justification:</span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {policy.businessJustification}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {selectedPolicy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Policy History: {selectedPolicy.name}
                </CardTitle>
                <CardDescription>
                  Complete audit trail for policy {selectedPolicy.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-4">
                    {selectedPolicy.history.map((entry, index) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{entry.action}</span>
                            <span className="text-sm text-muted-foreground">by</span>
                            <span className="font-medium">{entry.performedBy}</span>
                            <span className="text-sm text-muted-foreground">
                              on {entry.performedAt.toLocaleDateString()} at {entry.performedAt.toLocaleTimeString()}
                            </span>
                          </div>
                          {entry.comment && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{entry.comment}</span>
                            </div>
                          )}
                          {entry.previousStatus && entry.newStatus && (
                            <div className="text-xs text-muted-foreground">
                              Status changed from <span className="font-medium">{entry.previousStatus}</span> to{' '}
                              <span className="font-medium">{entry.newStatus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedPolicy.history.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No history available for this policy.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <strong>Recommendation:</strong> {matchedPolicies.length > 0 && matchedPolicies[0].status === 'Active' 
            ? 'This connection should already be working. Consider testing the connection first.'
            : 'Review the existing policies and their status before proceeding with a new request.'
          }
        </div>

        <div className="flex gap-2">
          {onTestConnection && (
            <Button variant="outline" onClick={onTestConnection}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancel Request
          </Button>
          <Button onClick={onProceedAnyway} className="bg-orange-500 hover:bg-orange-600 text-white">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Proceed Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
