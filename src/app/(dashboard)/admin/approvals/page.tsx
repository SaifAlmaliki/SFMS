import { Suspense } from 'react';
import { getPendingTickets, getApprovedTickets, getRejectedTickets } from '@/lib/ticket-data';
import { ApprovalsTabs } from '@/components/admin/approvals-tabs';
import { TicketTypeFilter } from '@/components/admin/ticket-type-filter';

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const ticketTypeFilter = typeof params.type === 'string' ? params.type : 'all';
  const ticketType = ticketTypeFilter === 'all' ? undefined : ticketTypeFilter;

  // Fetch tickets for all three tabs in parallel
  const [pendingTickets, approvedTickets, rejectedTickets] = await Promise.all([
    getPendingTickets(ticketType),
    getApprovedTickets(ticketType),
    getRejectedTickets(ticketType),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Admin Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending firewall policy change requests and IT support tickets.
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-[200px]" />}>
          <TicketTypeFilter defaultValue={ticketTypeFilter} />
        </Suspense>
      </div>

      <ApprovalsTabs
        pendingTickets={pendingTickets}
        approvedTickets={approvedTickets}
        rejectedTickets={rejectedTickets}
      />
    </div>
  );
}

