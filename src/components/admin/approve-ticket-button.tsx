'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { approveTicketAction } from '@/app/actions';

interface ApproveTicketButtonProps {
  ticketId: string;
}

export function ApproveTicketButton({ ticketId }: ApproveTicketButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveTicketAction(ticketId);
      // Reload the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Failed to approve ticket:', error);
      alert('Failed to approve ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="default"
      onClick={handleApprove}
      disabled={loading}
      className="bg-green-500 hover:bg-green-600"
    >
      <Check className="h-4 w-4 mr-1" />
      Approve
    </Button>
  );
}

