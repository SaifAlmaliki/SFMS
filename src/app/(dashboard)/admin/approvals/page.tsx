import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrismaClient } from '@/generated/prisma';
import { ApproveTicketButton } from '@/components/admin/approve-ticket-button';
import { RejectTicketButton } from '@/components/admin/reject-ticket-button';
import { ExternalLink, Clock, User, AlertCircle, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

const prisma = new PrismaClient();

async function getPendingTickets(ticketType?: string) {
  try {
    const where: any = {
      status: 'PendingApproval'
    };
    
    // Filter by ticket type if specified
    if (ticketType && ticketType !== 'all') {
      where.ticketType = ticketType;
    }
    
    const tickets = await prisma.changeTicket.findMany({
      where,
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

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const ticketTypeFilter = typeof params.type === 'string' ? params.type : 'all';
  const pendingTickets = await getPendingTickets(ticketTypeFilter === 'all' ? undefined : ticketTypeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve pending firewall policy change requests and IT support tickets.
        </p>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Ticket Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select defaultValue={ticketTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FirewallPolicy">Firewall Policy</SelectItem>
                <SelectItem value="ITSupport">IT Support</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="VPN">VPN</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="AdminAccess">Admin Access</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link href={ticketTypeFilter === 'all' ? '/admin/approvals' : `/admin/approvals?type=${ticketTypeFilter}`}>
                Apply Filter
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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

