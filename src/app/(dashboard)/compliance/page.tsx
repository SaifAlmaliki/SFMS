
'use client';

import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

const statusStyles = {
  Compliant: 'bg-accent text-accent-foreground',
  'Needs Review': 'bg-yellow-500 text-white',
  'Non-Compliant': 'bg-destructive text-destructive-foreground',
};

export default function CompliancePage() {
  const [complianceReports, setComplianceReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchComplianceData = async () => {
    try {
      const response = await fetch('/api/compliance/reports');
      if (response.ok) {
        const data = await response.json();
        setComplianceReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Run ingestion first
      const ingestionResponse = await fetch('/api/ingestion/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'full' })
      });
      
      const ingestionResult = await ingestionResponse.json();
      
      // Run evaluation
      const evaluationResponse = await fetch('/api/compliance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      
      const evaluationResult = await evaluationResponse.json();
      
      if (ingestionResult.success && evaluationResult.success) {
        toast({
          title: 'Data Refreshed Successfully',
          description: `Processed ${ingestionResult.devicesProcessed || 0} devices and evaluated ${evaluationResult.result?.frameworksEvaluated || 0} frameworks`
        });
        
        // Refresh the compliance data
        await fetchComplianceData();
      } else {
        toast({
          title: 'Refresh Failed',
          description: 'Some operations failed. Check console for details.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Refresh Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Compliance Management</h1>
        <p className="text-muted-foreground">Loading compliance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">
            Track your compliance status against various security frameworks.
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>
            Overview of compliance with different regulations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Framework</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Audit</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceReports.map((report) => (
                <TableRow key={report.framework} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">
                      {report.framework}
                    </Link>
                  </TableCell>
                  <TableCell>
                  <Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">
                    <Badge className={statusStyles[report.status as keyof typeof statusStyles]}>
                      {report.status}
                    </Badge>
                    </Link>
                  </TableCell>
                  <TableCell><Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">{report.lastAudit}</Link></TableCell>
                  <TableCell className="text-right">
                  <Link href={`/compliance/${report.framework.toLowerCase()}`} className="block">
                    <div className="flex items-center justify-end gap-2">
                        <span className='w-12 text-left'>{report.coverage}%</span>
                        <Progress value={report.coverage} className="w-32" />
                    </div>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
