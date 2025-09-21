
import { AddressObjectsTable } from '@/components/network-objects/address-objects-table';
import { ObjectGroupsTable } from '@/components/network-objects/object-groups-table';
import { ServiceObjectsTable } from '@/components/network-objects/service-objects-table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function NetworkObjectsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Network Objects</h1>
      <p className="text-muted-foreground">
        Manage reusable address objects, service objects, and groups for your policies.
      </p>

      <Tabs defaultValue="address-objects">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="address-objects">Address Objects</TabsTrigger>
          <TabsTrigger value="service-objects">Service Objects</TabsTrigger>
          <TabsTrigger value="object-groups">Object Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="address-objects">
            <Card>
                <CardHeader>
                    <CardTitle>Address Objects</CardTitle>
                    <CardDescription>Manage IP addresses, FQDNs, and geographical locations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddressObjectsTable />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="service-objects">
        <Card>
                <CardHeader>
                    <CardTitle>Service Objects</CardTitle>
                    <CardDescription>Manage protocols and port numbers for your policies.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ServiceObjectsTable />
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="object-groups">
        <Card>
                <CardHeader>
                    <CardTitle>Object Groups</CardTitle>
                    <CardDescription>Manage collections of address and service objects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ObjectGroupsTable />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
