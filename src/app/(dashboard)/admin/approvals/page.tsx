import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrismaClient } from '@/generated/prisma';
import { ApproveTicketButton } from '@/components/admin/approve-ticket-button';
import { RejectTicketButton } from '@/components/admin/reject-ticket-button';
import { ExternalLink, Clock, User, AlertCircle } from 'lucide-react';

const prisma = new PrismaClient();

async function getPendingTickets() {
  try {
    const tickets = await prisma.changeTicket.findMany({
      where: {
        status: 'PendingApproval'
      },
      include: {
        policy: true,
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return tickets;
  } catch (error) {
    console.error('Error fetching pending tickets:', error);
    return [];
  }
}

export default async function AdminApprovalsPage() {
  const pendingTickets = await getPendingTickets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve pending firewall policy change requests.
        </p>
      </div>

      {pendingTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
            <p className="text-muted-foreground text-center">
              All change requests have been processed. Check back later for new requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingTickets.map((ticket) => (
            <Card key={ticket.id} className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Ticket #{ticket.ticketNumber} • Requested by {ticket.requestedBy}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {ticket.priority}
                    </Badge>
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

                {ticket.policy && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Policy Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <span className="ml-2 font-mono">{ticket.policy.source}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Destination:</span>
                        <span className="ml-2 font-mono">{ticket.policy.destination}:{ticket.policy.destPort}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Action:</span>
                        <Badge variant={ticket.policy.action === 'Allow' ? 'default' : 'destructive'} className="ml-2">
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

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Created {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    {ticket.scheduledFor && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Scheduled for {new Date(ticket.scheduledFor).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <RejectTicketButton ticketId={ticket.id} />
                    <ApproveTicketButton ticketId={ticket.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

