import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PolicyGenerator } from '@/components/dashboard/policy-generator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AiToolsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">AI Tools</h1>
      <p className="text-muted-foreground">
        Leverage AI to enhance your firewall management.
      </p>

      <Tabs defaultValue="policy-generator">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policy-generator">Policy Generator</TabsTrigger>
          <TabsTrigger value="self-healing">Self-Healing</TabsTrigger>
          <TabsTrigger value="anomaly-detection">Anomaly Detection</TabsTrigger>
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
        <TabsContent value="self-healing">
          <Card>
            <CardHeader>
              <CardTitle>Self-Healing Misconfigurations</CardTitle>
              <CardDescription>
                Detect and correct firewall misconfigurations automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Firewall Configuration (JSON/YAML)</Label>
                <Textarea placeholder="Paste your configuration here..." className="h-32 bg-background"/>
              </div>
              <div>
                <Label>Guardrails (JSON/YAML)</Label>
                <Textarea placeholder="Paste your guardrails here..." className="h-32 bg-background"/>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-correct" />
                <Label htmlFor="auto-correct">Auto-Correct</Label>
              </div>
              <Button>Analyze and Correct</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="anomaly-detection">
          <Card>
            <CardHeader>
              <CardTitle>Admin Anomaly Detection</CardTitle>
              <CardDescription>
                Detect anomalous admin actions and access patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Admin Actions Log</Label>
                <Textarea placeholder="Paste admin action logs here..." className="h-32 bg-background"/>
              </div>
              <div>
                <Label>Access Patterns Log</Label>
                <Textarea placeholder="Paste access pattern logs here..." className="h-32 bg-background"/>
              </div>
              <Button>Detect Anomalies</Button>
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
            <CardContent className="space-y-4">
               <div>
                <Label>Model Name</Label>
                <Textarea placeholder="Enter model name..." className="h-12 bg-background"/>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="retrain" />
                <Label htmlFor="retrain">Retrain</Label>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="evaluate" />
                <Label htmlFor="evaluate">Evaluate</Label>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="version" />
                <Label htmlFor="version">Version</Label>
              </div>
              <Button>Run Management Task</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
