import { NewPolicyDialog } from '@/components/policies/new-policy-dialog';
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

const policies = [
  {
    id: 'POL-001',
    name: 'Allow HTTP/HTTPS from Internal to DMZ',
    source: 'Internal',
    destination: 'DMZ',
    action: 'Allow',
    status: 'Active',
  },
  {
    id: 'POL-002',
    name: 'Block all traffic from Public to Internal',
    source: 'Public',
    destination: 'Internal',
    action: 'Deny',
    status: 'Active',
  },
  {
    id: 'POL-003',
    name: 'Allow Database access from App Servers',
    source: 'App-Servers',
    destination: 'DB-Servers',
    action: 'Allow',
    status: 'Inactive',
  },
  {
    id: 'POL-004',
    name: 'Allow SSH from Admin Workstations',
    source: 'Admin-Network',
    destination: 'Any',
    action: 'Allow',
    status: 'Active',
  },
];

export default function PoliciesPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Firewall Policies</h1>
          <p className="text-muted-foreground">
            Manage and view your firewall policies.
          </p>
        </div>
        <NewPolicyDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy List</CardTitle>
          <CardDescription>
            A list of all configured firewall policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.id}</TableCell>
                  <TableCell>{policy.name}</TableCell>
                  <TableCell>{policy.source}</TableCell>
                  <TableCell>{policy.destination}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        policy.action === 'Allow' ? 'default' : 'destructive'
                      }
                      className={policy.action === 'Allow' ? 'bg-accent text-accent-foreground' : ''}
                    >
                      {policy.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        policy.status === 'Active' ? 'secondary' : 'outline'
                      }
                    >
                      {policy.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
