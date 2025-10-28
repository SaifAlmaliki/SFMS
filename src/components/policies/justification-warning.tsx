'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface JustificationWarningProps {
  onAddJustification: (justification: string) => void;
  onProceedWithout: () => void;
  onCancel: () => void;
}

export function JustificationWarning({ 
  onAddJustification, 
  onProceedWithout, 
  onCancel 
}: JustificationWarningProps) {
  const [justification, setJustification] = useState('');
  const [showProceedOption, setShowProceedOption] = useState(false);

  const handleAddJustification = () => {
    if (justification.trim()) {
      onAddJustification(justification.trim());
    }
  };

  const handleProceedWithout = () => {
    setShowProceedOption(true);
  };

  const confirmProceedWithout = () => {
    onProceedWithout();
  };

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Business Justification Required</strong><br />
          Providing a clear business justification helps administrators understand the purpose 
          of your request and may speed up the approval process.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            Add Business Justification
          </CardTitle>
          <CardDescription>
            Please provide a clear explanation for why this firewall connection is needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="justification">Business Justification</Label>
            <Textarea
              id="justification"
              placeholder="e.g., Database access for reporting service, API integration for customer portal, Backup service connectivity..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about the business need, application, or service that requires this connection.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAddJustification}
              disabled={!justification.trim()}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Add Justification & Continue
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {!showProceedOption ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                Don't have a business justification ready?
              </div>
              <Button 
                variant="outline" 
                onClick={handleProceedWithout}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Proceed Without Justification
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: Requests without justification may take longer to approve and may be rejected.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Confirm Proceeding Without Justification
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              You're about to submit a firewall request without business justification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
              <p><strong>Please note:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Requests without justification may be delayed or rejected</li>
                <li>Administrators may request additional information</li>
                <li>Approval process may take longer than usual</li>
                <li>You may be asked to provide justification later</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={confirmProceedWithout}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Yes, Proceed Without Justification
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowProceedOption(false)}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
