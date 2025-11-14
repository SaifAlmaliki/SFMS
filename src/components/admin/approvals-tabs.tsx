'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketList } from './ticket-list';
import { TicketWithRelations } from '@/lib/ticket-data';

interface ApprovalsTabsProps {
  pendingTickets: TicketWithRelations[];
  approvedTickets: TicketWithRelations[];
  rejectedTickets: TicketWithRelations[];
}

export function ApprovalsTabs({ pendingTickets, approvedTickets, rejectedTickets }: ApprovalsTabsProps) {
  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending">
          Pending ({pendingTickets.length})
        </TabsTrigger>
        <TabsTrigger value="approved">
          Approved ({approvedTickets.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejectedTickets.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" className="mt-6">
        <TicketList
          tickets={pendingTickets}
          emptyMessage="No Pending Approvals"
          emptyDescription="All change requests have been processed. Check back later for new requests."
          showActions={true}
        />
      </TabsContent>
      
      <TabsContent value="approved" className="mt-6">
        <TicketList
          tickets={approvedTickets}
          emptyMessage="No Approved Tickets"
          emptyDescription="There are no approved tickets to display."
          showActions={false}
        />
      </TabsContent>
      
      <TabsContent value="rejected" className="mt-6">
        <TicketList
          tickets={rejectedTickets}
          emptyMessage="No Rejected Tickets"
          emptyDescription="There are no rejected tickets to display."
          showActions={false}
        />
      </TabsContent>
    </Tabs>
  );
}

