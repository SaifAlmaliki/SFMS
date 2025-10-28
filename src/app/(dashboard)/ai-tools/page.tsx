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
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="policy-generator">Policy Generator</TabsTrigger>
          <TabsTrigger value="policy-validation">Validation</TabsTrigger>
          <TabsTrigger value="policy-simulation">Simulation</TabsTrigger>
          <TabsTrigger value="self-healing">Self-Healing</TabsTrigger>
          <TabsTrigger value="anomaly-detection">UBA</TabsTrigger>
          <TabsTrigger value="model-management">Model Management</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle>Policy Validation & Conflict Detection</CardTitle>
              <CardDescription>
                Check a firewall policy against security best practices and for conflicts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PolicyValidation />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="policy-simulation">
          <Card>
            <CardHeader>
              <CardTitle>Policy Simulation</CardTitle>
              <CardDescription>
                Test how a hypothetical traffic flow would be handled by your policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PolicySimulation />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="self-healing">
          <Card>
            <CardHeader>
              <CardTitle>Self-Healing Misconfigurations</CardTitle>
              <CardDescription>
                Detect and correct firewall misconfigurations automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelfHealing />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="anomaly-detection">
          <Card>
            <CardHeader>
              <CardTitle>Admin Anomaly Detection</CardTitle>
              <CardDescription>
                Detect anomalous admin actions and access patterns using User Behavior Analytics (UBA).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnomalyDetection />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="model-management">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Management</CardTitle>
              <CardDescription>
                Retrain, evaluate, and version your AI models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
