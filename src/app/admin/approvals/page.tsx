import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrismaClient } from '../../../generated/prisma';
import { ApproveTicketButton } from '@/components/admin/approve-ticket-button';
import { RejectTicketButton } from '@/components/admin/reject-ticket-button';

const prisma = new PrismaClient();

const statusStyles: Record<string, string> = {
  Draft: 'bg-gray-500/20 text-gray-500 border-gray-500/20',
  PendingApproval: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
  Approved: 'bg-green-500/20 text-green-500 border-green-500/20',
  Rejected: 'bg-red-500/20 text-red-500 border-red-500/20',
  Scheduled: 'bg-blue-500/20 text-blue-500 border-blue-500/20',
  Deployed: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20',
  Failed: 'bg-orange-500/20 text-orange-500 border-orange-500/20',
};

const priorityStyles: Record<string, string> = {
  Low: 'bg-blue-500/20 text-blue-500 border-blue-500/20',
  Medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
  High: 'bg-orange-500/20 text-orange-500 border-orange-500/20',
  Critical: 'bg-red-500/20 text-red-500 border-red-500/20',
};

async function getPendingTickets() {
  const tickets = await prisma.changeTicket.findMany({
    where: {
      status: 'PendingApproval',
    },
    include: {
      policy: true,
      _count: {
        select: { comments: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return tickets.map(ticket => ({
    ...ticket,
    status: ticket.status as string,
    priority: ticket.priority as string,
  }));
}

export default async function AdminApprovalsPage() {
  const tickets = await getPendingTickets();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve pending change tickets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Change tickets awaiting administrative review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending approvals
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityStyles[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.policy ? (
                        <Badge variant="outline">{ticket.policy.name}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{ticket.requestedBy}</TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <ApproveTicketButton ticketId={ticket.id} />
                        <RejectTicketButton ticketId={ticket.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

