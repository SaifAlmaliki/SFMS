'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApproveTicketButton } from '@/components/admin/approve-ticket-button';
import { RejectTicketButton } from '@/components/admin/reject-ticket-button';
import { ExternalLink, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { TicketWithRelations } from '@/lib/ticket-data';

interface TicketCardProps {
  ticket: TicketWithRelations;
  showActions?: boolean;
}

export function TicketCard({ ticket, showActions = true }: TicketCardProps) {
  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'Approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'Deployed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Deployed
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'PendingApproval':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            {ticket.status}
          </Badge>
        );
    }
  };

  const getBorderColor = () => {
    switch (ticket.status) {
      case 'Approved':
      case 'Deployed':
        return 'border-l-green-500';
      case 'Rejected':
        return 'border-l-red-500';
      case 'PendingApproval':
        return 'border-l-yellow-500';
      default:
        return 'border-l-yellow-500';
    }
  };

  const getPriorityBadge = () => {
    const priorityColors: Record<string, string> = {
      Low: 'text-blue-600 border-blue-600',
      Medium: 'text-yellow-600 border-yellow-600',
      High: 'text-orange-600 border-orange-600',
      Critical: 'text-red-600 border-red-600',
    };

    return (
      <Badge variant="outline" className={priorityColors[ticket.priority]}>
        <Clock className="h-3 w-3 mr-1" />
        {ticket.priority}
      </Badge>
    );
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{ticket.title}</CardTitle>
            <CardDescription className="mt-1">
              Ticket #{ticket.ticketNumber} • Requested by {ticket.requestedBy}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge()}
            {getStatusBadge()}
            {ticket.externalSystem && ticket.externalId && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={ticket.externalUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {ticket.externalSystem.toUpperCase()}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{ticket.description}</p>
        </div>

        {ticket.ticketType === 'FirewallPolicy' && ticket.policy && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Policy Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Source:</span>
                <span className="ml-2 font-mono">{ticket.policy.source}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Destination:</span>
                <span className="ml-2 font-mono">
                  {ticket.policy.destination}:{ticket.policy.destPort}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Action:</span>
                <Badge
                  variant={ticket.policy.action === 'Allow' ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {ticket.policy.action}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Vendor:</span>
                <span className="ml-2 capitalize">{ticket.policy.vendor || 'Generic'}</span>
              </div>
              {ticket.policy.businessJustification && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Business Justification:</span>
                  <p className="mt-1 text-sm">{ticket.policy.businessJustification}</p>
                </div>
              )}
            </div>

            {ticket.policy.cliConfig && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">CLI Configuration</h5>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                  {ticket.policy.cliConfig}
                </pre>
              </div>
            )}
          </div>
        )}

        {ticket.ticketType && ticket.ticketType !== 'FirewallPolicy' && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">IT Support Ticket Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {ticket.ticketType}
                </Badge>
              </div>
              {ticket.category && (
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2">{ticket.category}</span>
                </div>
              )}
              {ticket.isNetworkRelated && (
                <div className="col-span-2">
                  <Badge variant="secondary">Network Related</Badge>
                </div>
              )}
            </div>
            {ticket.keywords && ticket.keywords.length > 0 && (
              <div className="mt-3">
                <span className="text-muted-foreground text-sm">Keywords: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ticket.keywords.slice(0, 5).map((kw, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
            {ticket.approvedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Approved {new Date(ticket.approvedAt).toLocaleDateString()}
              </div>
            )}
            {ticket.scheduledFor && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Scheduled for {new Date(ticket.scheduledFor).toLocaleDateString()}
              </div>
            )}
          </div>

          {showActions && ticket.status === 'PendingApproval' && (
            <div className="flex gap-2">
              <RejectTicketButton ticketId={ticket.id} />
              <ApproveTicketButton 
                ticketId={ticket.id}
                policyTargetDevice={ticket.policy?.targetDevice || null}
                policyVendor={ticket.policy?.vendor || null}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

