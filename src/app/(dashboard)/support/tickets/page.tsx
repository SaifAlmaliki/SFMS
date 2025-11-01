import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrismaClient } from '@/generated/prisma';
import { ExternalLink, Filter, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const prisma = new PrismaClient();

async function getITSupportTickets(filters?: {
  type?: string;
  status?: string;
  category?: string;
  search?: string;
}) {
  const where: any = {
    ticketType: {
      not: 'FirewallPolicy',
    },
  };

  if (filters?.type && filters.type !== 'all') {
    where.ticketType = filters.type;
  }

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  if (filters?.category) {
    where.category = {
      contains: filters.category,
      mode: 'insensitive',
    };
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.changeTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = {
    type: typeof params.type === 'string' ? params.type : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
  };

  const tickets = await getITSupportTickets(filters);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PendingApproval':
        return 'default';
      case 'Approved':
        return 'default';
      case 'Deployed':
        return 'default';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'destructive';
      case 'High':
        return 'default';
      case 'Medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IT Support Tickets</h1>
        <p className="text-muted-foreground">
          View and manage all IT support tickets.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                name="search"
                placeholder="Search tickets..."
                defaultValue={filters.search}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select name="type" defaultValue={filters.type || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ITSupport">IT Support</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="VPN">VPN</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="AdminAccess">Admin Access</SelectItem>
                  <SelectItem value="NetworkAccess">Network Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select name="status" defaultValue={filters.status || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PendingApproval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Deployed">Deployed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No tickets found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {ticket.ticketNumber} • {ticket.category || 'Uncategorized'} • Requested by {ticket.requestedBy}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    {ticket.ticketType && (
                      <Badge variant="outline">
                        {ticket.ticketType}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                </div>

                {ticket.keywords && ticket.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ticket.keywords.slice(0, 5).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

