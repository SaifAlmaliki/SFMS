'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2 } from 'lucide-react';
import { rejectTicketAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface RejectTicketButtonProps {
  ticketId: string;
}

export function RejectTicketButton({ ticketId }: RejectTicketButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejecting this ticket.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await rejectTicketAction(ticketId, reason);
      
      if (result.success) {
        toast({
          title: 'Ticket Rejected',
          description: 'The change request has been rejected.',
        });
        setOpen(false);
        setReason('');
        // Refresh the page to update the list
        window.location.reload();
      } else {
        toast({
          title: 'Rejection Failed',
          description: result.error || 'Failed to reject the ticket.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Change Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this firewall policy change request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this change request is being rejected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}