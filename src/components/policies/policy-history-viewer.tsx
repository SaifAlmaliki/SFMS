'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface PolicyHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  comment: string | null;
  previousStatus: string | null;
  newStatus: string | null;
}

interface PolicyHistoryViewerProps {
  policyId: string;
  policyName: string;
  history: PolicyHistoryEntry[];
}

export function PolicyHistoryViewer({ 
  policyId, 
  policyName, 
  history 
}: PolicyHistoryViewerProps) {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deployed':
        return <ExternalLink className="h-4 w-4 text-purple-500" />;
      case 'deactivated':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'modified':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      case 'approved':
        return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/20 text-red-500 border-red-500/20';
      case 'deployed':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/20';
      case 'deactivated':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
      case 'modified':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/20 text-green-500';
      case 'PendingApproval':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'Inactive':
        return 'bg-gray-500/20 text-gray-500';
      case 'Rejected':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(date);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Policy History
        </CardTitle>
        <CardDescription>
          Complete audit trail for policy {policyId}: {policyName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No history available for this policy.</p>
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {/* Timeline line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-4 top-8 h-full w-px bg-border" />
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-border">
                      {getActionIcon(entry.action)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getActionColor(entry.action)}>
                          {entry.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {entry.performedBy}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(entry.performedAt)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(entry.performedAt)}</span>
                        </div>
                      </div>
                      
                      {/* Status change */}
                      {entry.previousStatus && entry.newStatus && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Status changed:</span>
                          <Badge variant="outline" className={getStatusColor(entry.previousStatus)}>
                            {entry.previousStatus}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className={getStatusColor(entry.newStatus)}>
                            {entry.newStatus}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Comment */}
                      {entry.comment && (
                        <div className="rounded-md bg-muted p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium text-muted-foreground mb-1">Comment:</div>
                              <div className="text-foreground">{entry.comment}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < history.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last updated: {history.length > 0 ? formatDate(history[history.length - 1].performedAt) : 'Never'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
