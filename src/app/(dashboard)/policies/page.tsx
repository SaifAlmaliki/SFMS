
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
import { Policy } from '@/lib/data';
import { NewPolicyDialog } from '@/components/policies/new-policy-dialog';
import { PolicyActions } from '@/components/policies/policy-actions';
import { DeployAction } from '@/components/policies/deploy-action';
import { PrismaClient } from '@/generated/prisma';
import { FortiGateClient, FortiGateDevice } from '@/lib/fortigate';
import { convertFortiGateToPolicy } from '@/lib/fortigate-policy-converter';

const prisma = new PrismaClient();

const statusStyles: Record<Policy['status'], string> = {
  Active: 'bg-green-500/20 text-green-500 border-green-500/20',
  Inactive: 'bg-gray-500/20 text-gray-500 border-gray-500/20',
  'Pending Approval': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
};

async function fetchPoliciesFromFortiGate(): Promise<Policy[]> {
  try {
    // Get all active FortiGate devices
    const devices = await prisma.device.findMany({
      where: {
        vendor: 'fortigate',
        status: 'Active',
      },
    });

    const allPolicies: Policy[] = [];

    // Fetch policies from each device
    for (const device of devices) {
      if (!device.apiKey) continue;

      try {
        const fortigateDevice: FortiGateDevice = {
          id: device.id,
          name: device.name,
          ip: device.ip,
          apiKey: device.apiKey,
          version: device.version || undefined,
        };

        const client = new FortiGateClient(fortigateDevice);
        const policiesResult = await client.firewall.getPolicies();

        if (policiesResult.success && policiesResult.data) {
          // Handle different response formats
          let fortigatePolicies: any[] = [];

          if (Array.isArray(policiesResult.data)) {
            fortigatePolicies = policiesResult.data;
          } else if (policiesResult.data && typeof policiesResult.data === 'object') {
            if (Array.isArray(policiesResult.data.results)) {
              fortigatePolicies = policiesResult.data.results;
            } else if (policiesResult.data.results && typeof policiesResult.data.results === 'object') {
              if (policiesResult.data.results.policyid !== undefined) {
                fortigatePolicies = [policiesResult.data.results];
              } else {
                fortigatePolicies = Object.values(policiesResult.data.results);
              }
            }
          }

          // Convert each FortiGate policy to database format
          const convertedPolicies = fortigatePolicies.map((fgPolicy) => {
            const policyData = convertFortiGateToPolicy(fgPolicy, device.name);
            return {
              ...policyData,
              id: `POL-FG-${fgPolicy.policyid || Date.now()}`,
              vendor: 'fortigate',
              vendorId: fgPolicy.policyid?.toString(),
              targetDevice: device.name,
              createdAt: fgPolicy.createdAt ? new Date(fgPolicy.createdAt) : new Date(),
              updatedAt: fgPolicy.updatedAt ? new Date(fgPolicy.updatedAt) : new Date(),
            } as Policy;
          });

          allPolicies.push(...convertedPolicies);
        }
      } catch (error: any) {
        console.error(`Error fetching policies from device ${device.name}:`, error);
        // Continue with other devices
      }
    }

    // Sort by updatedAt descending
    return allPolicies.sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  } catch (error: any) {
    console.error('Error fetching policies from FortiGate:', error);
    return [];
  }
}

export default async function PoliciesPage() {
  // Fetch policies directly from FortiGate
  const policies = await fetchPoliciesFromFortiGate();
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
