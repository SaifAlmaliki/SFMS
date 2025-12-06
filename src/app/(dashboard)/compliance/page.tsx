
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
import { RefreshCw, Brain, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  // Fetch persisted AI insights from database
  const fetchPersistedInsights = async () => {
    try {
      const response = await fetch('/api/compliance/ai-insights');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.count > 0) {
          console.log('[Compliance UI] Loaded persisted AI insights:', data.insights);
          setAiInsights(data.insights);
          
          // Update compliance reports with AI-derived status
          setComplianceReports(prevReports => 
            prevReports.map(report => {
              const aiInsight = data.insights[report.framework];
              if (aiInsight) {
                const statusMap: Record<string, string> = {
                  'Compliant': 'Compliant',
                  'NeedsReview': 'Needs Review',
                  'NonCompliant': 'Non-Compliant'
                };
                return {
                  ...report,
                  status: statusMap[aiInsight.overallStatus] || report.status,
                  coverage: Math.max(0, Math.min(100, Math.round((10 - aiInsight.riskScore) * 10)))
                };
              }
              return report;
            })
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch persisted AI insights:', error);
    }
  };

  const runAIAnalysis = async (frameworkName?: string) => {
    setIsAnalyzing(true);
    try {
      const frameworks = frameworkName ? [frameworkName] : complianceReports.map(r => r.framework);
      const insights: any = {};
      
      console.log('[Compliance UI] Running AI analysis for frameworks:', frameworks);
      
      for (const framework of frameworks) {
        try {
          console.log(`[Compliance UI] Analyzing ${framework}...`);
          const response = await fetch('/api/compliance/ai-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frameworkName: framework })
          });
          
          const result = await response.json();
          console.log(`[Compliance UI] ${framework} response:`, result);
          
          if (response.ok && result.aiInsights) {
            insights[framework] = result.aiInsights;
          } else if (result.error) {
            console.warn(`[Compliance UI] ${framework} error:`, result.error);
          }
        } catch (frameworkError) {
          console.error(`[Compliance UI] Failed to analyze ${framework}:`, frameworkError);
        }
      }
      
      console.log('[Compliance UI] All insights:', insights);
      setAiInsights(insights);
      
      if (Object.keys(insights).length > 0) {
        toast({
          title: 'AI Analysis Complete',
          description: `Generated insights for ${Object.keys(insights).length} framework(s)`
        });
      } else {
        toast({
          title: 'AI Analysis',
          description: 'No insights generated. Check console for details.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('[Compliance UI] AI Analysis failed:', error);
      toast({
        title: 'AI Analysis Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
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
      
      console.log('[Compliance UI] Ingestion result:', ingestionResult);
      console.log('[Compliance UI] Evaluation result:', evaluationResult);
      
      // Refresh the compliance data regardless of partial errors
      await fetchComplianceData();
      
      // Check if we have AI insights (even if there were some errors)
      if (evaluationResult.result?.aiInsights && Object.keys(evaluationResult.result.aiInsights).length > 0) {
        console.log('[Compliance UI] Using AI insights from evaluation:', evaluationResult.result.aiInsights);
        const insights = evaluationResult.result.aiInsights;
        setAiInsights(insights);
        
        // Update compliance reports with AI-derived status
        setComplianceReports(prevReports => 
          prevReports.map(report => {
            const aiInsight = insights[report.framework];
            if (aiInsight) {
              // Map AI status to display format
              const statusMap: Record<string, string> = {
                'Compliant': 'Compliant',
                'NeedsReview': 'Needs Review',
                'NonCompliant': 'Non-Compliant'
              };
              return {
                ...report,
                status: statusMap[aiInsight.overallStatus] || report.status,
                // Calculate coverage based on risk score (inverse relationship)
                coverage: Math.max(0, Math.min(100, Math.round((10 - aiInsight.riskScore) * 10)))
              };
            }
            return report;
          })
        );
        
        toast({
          title: 'AI Analysis Complete',
          description: `Generated insights for ${Object.keys(insights).length} framework(s)`
        });
      } else if (evaluationResult.success) {
        // Fallback: Run AI analysis separately if not included in evaluation
        console.log('[Compliance UI] No AI insights in evaluation result, running separate analysis...');
        await runAIAnalysis();
      }
      
      // Show appropriate toast based on results
      if (ingestionResult.success && evaluationResult.success) {
        toast({
          title: 'Data Refreshed Successfully',
          description: `Processed ${ingestionResult.devicesProcessed || 0} devices and evaluated ${evaluationResult.result?.frameworksEvaluated || 0} frameworks`
        });
      } else if (evaluationResult.result?.aiInsights) {
        // Partial success - we have AI insights but some errors occurred
        toast({
          title: 'Refresh Completed with Warnings',
          description: `Some operations had issues but AI analysis completed for ${Object.keys(evaluationResult.result.aiInsights).length} frameworks`,
        });
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
    const loadData = async () => {
      await fetchComplianceData();
      // Load persisted AI insights after compliance data is loaded
      await fetchPersistedInsights();
    };
    loadData();
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
            Track your compliance status against various security frameworks with AI-powered insights.
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {!isRefreshing && <Brain className="mr-2 h-4 w-4" />}
          Refresh Data & AI Analysis
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

      {aiInsights && Object.keys(aiInsights).length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Compliance Insights
          </h2>
          
          {Object.entries(aiInsights).map(([framework, insights]: [string, any]) => (
            <Card key={framework} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {framework}
                      <Badge variant={
                        insights?.overallStatus === 'Compliant' ? 'default' :
                        insights?.overallStatus === 'NeedsReview' ? 'secondary' : 'destructive'
                      }>
                        {insights?.overallStatus}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{insights?.aiSummary}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-destructive">
                      {insights?.riskScore}/10
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Score</div>
                    {insights?.analyzedAt && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(insights.analyzedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {insights?.keyFindings && insights.keyFindings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Key Findings
                    </h4>
                    <ul className="space-y-1">
                      {insights.keyFindings.map((finding: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights?.violations && insights.violations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Violations Found
                    </h4>
                    <div className="space-y-2">
                      {insights.violations.map((violation: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={
                              violation.severity === 'Critical' ? 'destructive' :
                              violation.severity === 'High' ? 'destructive' :
                              violation.severity === 'Medium' ? 'secondary' : 'outline'
                            }>
                              {violation.severity}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{violation.description}</p>
                          <p className="text-xs text-muted-foreground">{violation.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights?.recommendations && insights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {insights.recommendations.slice(0, 3).map((rec: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={
                              rec.priority === 'Critical' ? 'destructive' :
                              rec.priority === 'High' ? 'destructive' :
                              rec.priority === 'Medium' ? 'secondary' : 'outline'
                            }>
                              {rec.priority} Priority
                            </Badge>
                            <span className="text-xs text-muted-foreground">{rec.estimatedEffort}</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{rec.action}</p>
                          <p className="text-xs text-muted-foreground">{rec.businessImpact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights?.nextSteps && insights.nextSteps.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Next Steps</h4>
                    <ol className="space-y-1">
                      {insights.nextSteps.slice(0, 3).map((step: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Show message when AI insights are not available
        complianceReports.length > 0 && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Compliance Insights
              </CardTitle>
              <CardDescription>
                AI analysis is currently unavailable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Firewall Connection Required</p>
                  <p className="text-sm">
                    AI compliance analysis requires active firewall devices to analyze security data. 
                    Please ensure your firewall devices are online and connected.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
