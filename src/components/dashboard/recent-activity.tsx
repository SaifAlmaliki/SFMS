import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const activities = [
  { user: 'Alice', action: 'Created policy #4021', time: '5m ago' },
  { user: 'Bob', action: 'Updated device FW-Primary-DC1', time: '12m ago' },
  {
    user: 'System',
    action: 'Auto-healed misconfiguration on FW-Branch-Office-A',
    time: '1h ago',
  },
  { user: 'Charlie', action: 'Approved policy #4020', time: '3h ago' },
  { user: 'Alice', action: 'Generated policy from template', time: '5h ago' },
];

function getInitials(name: string) {
  if (name === 'System') return 'S';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('');
}

export function RecentActivity() {
  return (
    <Card className="lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of recent platform events.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity, index) => (
            <li key={index} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{getInitials(activity.user)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.user} &middot; {activity.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
