'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { TicketCard } from './ticket-card';
import { TicketWithRelations } from '@/lib/ticket-data';

interface TicketListProps {
  tickets: TicketWithRelations[];
  emptyMessage?: string;
  emptyDescription?: string;
  showActions?: boolean;
}

export function TicketList({
  tickets,
  emptyMessage = 'No Tickets Found',
  emptyDescription = 'There are no tickets to display.',
  showActions = true,
}: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground text-center">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} showActions={showActions} />
      ))}
    </div>
  );
}

