'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

type UserRole = 'Administrator' | 'Editor' | 'Viewer';

const initialUsers = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    role: 'Administrator' as UserRole,
  },
  {
    id: 2,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    role: 'Editor' as UserRole,
  },
  {
    id: 3,
    name: 'Bob Williams',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    role: 'Viewer' as UserRole,
  },
];

export function UsersAndRoles() {
    const [users, setUsers] = useState(initialUsers);

    const handleRoleChange = (userId: number, newRole: UserRole) => {
        setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Users &amp; Roles</CardTitle>
        <CardDescription>
          Manage who can access your platform and what they can do.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
