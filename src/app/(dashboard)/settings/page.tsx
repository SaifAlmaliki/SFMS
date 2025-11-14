

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UsersAndRoles } from '@/components/settings/users-and-roles';
import { InviteUser } from '@/components/settings/invite-user';
import { FortiGateConnection } from '@/components/fortigate/fortigate-connection';
import { DeviceList } from '@/components/fortigate/device-list';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);
  
    useEffect(() => {
      setHasMounted(true);
    }, []);
  
    if (!hasMounted) {
      return null;
    }
  
    return <>{children}</>;
  }

export default function SettingsPage() {
    const { toast } = useToast();

    const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: 'Profile Updated',
            description: 'Your profile information has been successfully updated.',
        });
    }

    const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const newPassword = form.elements.namedItem('new-password') as HTMLInputElement;
        const confirmPassword = form.elements.namedItem('confirm-password') as HTMLInputElement;

        if (newPassword.value !== confirmPassword.value) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'New passwords do not match.',
            });
            return;
        }

        toast({
            title: 'Password Changed',
            description: 'Your password has been successfully changed.',
        });
        form.reset();
    }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>
      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <ClientOnly>
                    <form className="space-y-4" onSubmit={handleProfileUpdate} suppressHydrationWarning>
                        <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" defaultValue="Admin" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            defaultValue="admin@example.com"
                        />
                        </div>
                        <Button type="submit">Update Profile</Button>
                    </form>
              </ClientOnly>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent>
                <ClientOnly>
                    <form className="space-y-4" onSubmit={handlePasswordChange} suppressHydrationWarning>
                        <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" name="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" name="confirm-password" type="password" />
                        </div>
                        <Button type="submit">Change Password</Button>
                    </form>
                </ClientOnly>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <UsersAndRoles />
            <InviteUser />
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Device Management</h2>
          <p className="text-muted-foreground">
            Connect and manage your FortiGate firewall devices.
          </p>
        </div>
        <FortiGateConnection />
        <DeviceList />
      </div>
    </div>
  );
}
