/**
 * Admin Compliance Management Page
 * Allows manual triggering of ingestion and evaluation
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, Shield, AlertCircle } from 'lucide-react';

export default function AdminCompliancePage() {
  const [isIngesting, setIsIngesting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);
  const { toast } = useToast();

  const runIngestion = async () => {
    setIsIngesting(true);
    try {
      const response = await fetch('/api/ingestion/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'full' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Ingestion Complete',
          description: `Processed ${result.devicesProcessed} devices, ingested ${result.totalItemsIngested} items`
        });
      } else {
        toast({
          title: 'Ingestion Failed',
          description: result.errors?.join(', ') || 'Unknown error',
          variant: 'destructive'
        });
      }
      
      setLastResults(result);
    } catch (error: any) {
      toast({
        title: 'Ingestion Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const runEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/compliance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Evaluation Complete',
          description: `Evaluated ${result.result.frameworksEvaluated} frameworks, ${result.result.controlsEvaluated} controls`
        });
      } else {
        toast({
          title: 'Evaluation Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive'
        });
      }
      
      setLastResults(result.result);
    } catch (error: any) {
      toast({
        title: 'Evaluation Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const runFullPipeline = async () => {
    await runIngestion();
    // Wait a moment for ingestion to complete
    setTimeout(async () => {
      await runEvaluation();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compliance Administration</h1>
        <p className="text-muted-foreground">
          Manage firewall log ingestion and compliance evaluation processes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Ingestion</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Fetch logs and configuration from firewall devices
              </p>
              <Button 
                onClick={runIngestion} 
                disabled={isIngesting}
                className="w-full"
              >
                {isIngesting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Run Ingestion
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Evaluation</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Analyze data against compliance frameworks
              </p>
              <Button 
                onClick={runEvaluation} 
                disabled={isEvaluating}
                className="w-full"
              >
                {isEvaluating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Run Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Pipeline</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Run complete ingestion + evaluation pipeline
              </p>
              <Button 
                onClick={runFullPipeline} 
                disabled={isIngesting || isEvaluating}
                className="w-full"
                variant="outline"
              >
                {(isIngesting || isEvaluating) && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Run Full Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastResults && (
        <Card>
          <CardHeader>
            <CardTitle>Last Execution Results</CardTitle>
            <CardDescription>Results from the most recent operation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastResults.success !== undefined && (
                <div className="flex items-center gap-2">
                  <Badge variant={lastResults.success ? "default" : "destructive"}>
                    {lastResults.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              )}
              
              {lastResults.devicesProcessed !== undefined && (
                <p className="text-sm">Devices processed: <strong>{lastResults.devicesProcessed}</strong></p>
              )}
              
              {lastResults.totalItemsIngested !== undefined && (
                <p className="text-sm">Items ingested: <strong>{lastResults.totalItemsIngested}</strong></p>
              )}
              
              {lastResults.frameworksEvaluated !== undefined && (
                <p className="text-sm">Frameworks evaluated: <strong>{lastResults.frameworksEvaluated}</strong></p>
              )}
              
              {lastResults.controlsEvaluated !== undefined && (
                <p className="text-sm">Controls evaluated: <strong>{lastResults.controlsEvaluated}</strong></p>
              )}
              
              {lastResults.errors && lastResults.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Errors:</p>
                  {lastResults.errors.map((error: string, index: number) => (
                    <p key={index} className="text-xs text-muted-foreground">{error}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
