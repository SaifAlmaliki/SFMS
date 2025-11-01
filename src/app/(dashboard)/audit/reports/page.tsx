'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Search, Download, FileText } from 'lucide-react';

export default function AuditReportsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleGenerateReport = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/audit/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, format: 'json' }),
      });
      
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    'Show all VPN access granted in last month',
    'List firewall policy changes by admin',
    'Network access audit for user',
    'All tickets related to Outlook issues',
    'User activity report for last week',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Reports</h1>
        <p className="text-muted-foreground">
          Generate security and compliance audit reports using natural language queries.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Audit Report</CardTitle>
          <CardDescription>
            Ask questions in natural language to generate audit reports. For example: "Show all VPN access granted to user X in last month"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder='e.g., "Show all VPN access granted in last month"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateReport()}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleGenerateReport} disabled={loading || !query.trim()}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(example)}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{report.reportType || 'Audit Report'}</CardTitle>
                <CardDescription>
                  Generated: {new Date().toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.summary && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Summary:</p>
                <p className="text-sm">{report.summary}</p>
              </div>
            )}
            
            {report.data && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Report Data:</p>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
                    {JSON.stringify(report.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>
            View previously generated audit reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Report history feature coming soon. Generated reports are saved to the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

