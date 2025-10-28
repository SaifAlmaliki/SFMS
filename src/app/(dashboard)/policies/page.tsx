
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
import { getPolicies, Policy } from '@/lib/data';
import { NewPolicyDialog } from '@/components/policies/new-policy-dialog';
import { PolicyActions } from '@/components/policies/policy-actions';
import { DeployAction } from '@/components/policies/deploy-action';

const statusStyles: Record<Policy['status'], string> = {
  Active: 'bg-green-500/20 text-green-500 border-green-500/20',
  Inactive: 'bg-gray-500/20 text-gray-500 border-gray-500/20',
  'Pending Approval': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
};


export default async function PoliciesPage() {
  const policies = await getPolicies();
  // In a real app, you would get the current user's role from your auth system.
  // We'll mock it here for demonstration.
  const currentUserRole = 'Administrator'; 

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Firewall Policies</h1>
          <p className="text-muted-foreground">
            Manage and view your firewall policies.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <NewPolicyDialog />
        </div>
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
                <TableHead>Deploy</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      variant='outline'
                      className={statusStyles[policy.status]}
                    >
                      {policy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DeployAction policy={policy} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PolicyActions policy={policy} currentUserRole={currentUserRole} />
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
