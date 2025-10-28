import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PolicyGenerator } from '@/components/dashboard/policy-generator';
import { DeviceHealth } from '@/components/dashboard/device-health';
import { SecurityPosture } from '@/components/dashboard/security-posture';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Chatbot } from '@/components/dashboard/chatbot';
import { getRecentActivities } from '@/lib/data';

export default async function DashboardPage() {
  const recentActivities = await getRecentActivities();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AI-powered firewall management platform.
        </p>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Welcome, Admin!</CardTitle>
            <CardDescription>
              Here's an overview of your firewall automation platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              You can generate new policies, monitor device health, check your
              security posture, and chat with our AI assistant.
            </p>
          </CardContent>
        </Card>

        <SecurityPosture />

        <Card className="lg:col-span-3 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">AI Policy Generator</CardTitle>
            <CardDescription>
              Use natural language to generate firewall policies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PolicyGenerator />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 xl:col-span-2 row-start-3">
          <CardHeader>
            <CardTitle className="text-xl">NLP Chatbot Assistance</CardTitle>
            <CardDescription>
              Ask questions and get guided assistance with duplicate detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Chatbot />
          </CardContent>
        </Card>

        <DeviceHealth />

        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
}
