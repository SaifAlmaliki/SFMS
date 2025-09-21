import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { SecurityPosture } from '@/components/dashboard/security-posture';
  import { RecentActivity } from '@/components/dashboard/recent-activity';
  
  export default function ReportsPage() {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Review security posture, risk scores, and recent activities.
        </p>
  
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <SecurityPosture />
            </div>
            <div className="lg:col-span-2">
                <RecentActivity />
            </div>
        </div>
      </div>
    );
  }
  