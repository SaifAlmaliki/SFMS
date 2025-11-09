import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DeviceHealth } from '@/components/dashboard/device-health';
import { SecurityPosture } from '@/components/dashboard/security-posture';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { SystemStatus } from '@/components/dashboard/system-status';
import { ResourceUsage } from '@/components/dashboard/resource-usage';
import { ActiveSessions } from '@/components/dashboard/active-sessions';
import { InterfaceStats } from '@/components/dashboard/interface-stats';
import { LicenseStatus } from '@/components/dashboard/license-status';
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
              Monitor device health, check your security posture, and view real-time
              system status and resource usage across all your firewalls.
            </p>
          </CardContent>
        </Card>

        <SecurityPosture />

        <SystemStatus />
        <ResourceUsage />
        <ActiveSessions />
        <InterfaceStats />
        <LicenseStatus />

        <DeviceHealth />

        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
}
