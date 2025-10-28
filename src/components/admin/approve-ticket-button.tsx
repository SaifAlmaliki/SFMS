'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';
import { approveTicketAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface ApproveTicketButtonProps {
  ticketId: string;
}

export function ApproveTicketButton({ ticketId }: ApproveTicketButtonProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveTicketAction(ticketId, comment);
      
      if (result.success) {
        toast({
          title: 'Ticket Approved',
          description: 'The change request has been approved and will be deployed.',
        });
        setOpen(false);
        setComment('');
        // Refresh the page to update the list
        window.location.reload();
      } else {
        toast({
          title: 'Approval Failed',
          description: result.error || 'Failed to approve the ticket.',
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
        <Button variant="default" size="sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Change Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to approve this firewall policy change? This will trigger the deployment process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approval-comment">Approval Comment (Optional)</Label>
            <Textarea
              id="approval-comment"
              placeholder="Add any notes about this approval..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve & Deploy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}