import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PolicyGenerator } from '@/components/dashboard/policy-generator';
import { SelfHealing } from '@/components/ai-tools/self-healing';
import { ModelManagement } from '@/components/ai-tools/model-management';
import { AnomalyDetection } from '@/components/ai-tools/anomaly-detection';
import { PolicyValidation } from '@/components/ai-tools/policy-validation';
import { PolicySimulation } from '@/components/ai-tools/policy-simulation';

export default function AiToolsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">AI Tools</h1>
      <p className="text-muted-foreground">
        Leverage AI to enhance your firewall management.
      </p>

      <Tabs defaultValue="policy-generator">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="policy-generator">Generator</TabsTrigger>
          <TabsTrigger value="policy-validation">Validation</TabsTrigger>
          <TabsTrigger value="policy-simulation">Simulation</TabsTrigger>
          <TabsTrigger value="self-healing">Self-Healing</TabsTrigger>
          <TabsTrigger value="anomaly-detection">UBA</TabsTrigger>
          <TabsTrigger value="model-management">Models</TabsTrigger>
        </TabsList>
        <TabsContent value="policy-generator">
          <Card>
            <CardHeader>
              <CardTitle>AI Policy Generator</CardTitle>
              <CardDescription>
                Use natural language to generate firewall policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PolicyGenerator />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="policy-validation">
          <PolicyValidation />
        </TabsContent>
        <TabsContent value="policy-simulation">
          <PolicySimulation />
        </TabsContent>
        <TabsContent value="self-healing">
          <SelfHealing />
        </TabsContent>
        <TabsContent value="anomaly-detection">
          <AnomalyDetection />
        </TabsContent>
        <TabsContent value="model-management">
          <ModelManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
