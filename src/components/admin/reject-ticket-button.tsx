'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { rejectTicketAction } from '@/app/actions';

interface RejectTicketButtonProps {
  ticketId: string;
}

export function RejectTicketButton({ ticketId }: RejectTicketButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    const confirmed = window.confirm('Are you sure you want to reject this ticket?');
    if (!confirmed) return;

    setLoading(true);
    try {
      await rejectTicketAction(ticketId);
      // Reload the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Failed to reject ticket:', error);
      alert('Failed to reject ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleReject}
      disabled={loading}
    >
      <X className="h-4 w-4 mr-1" />
      Reject
    </Button>
  );
}

