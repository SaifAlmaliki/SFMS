'use client';

import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';

interface TicketTypeFilterProps {
  defaultValue?: string;
}

export function TicketTypeFilter({ defaultValue = 'all' }: TicketTypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('type');
    } else {
      params.set('type', value);
    }
    router.push(`/admin/approvals?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select defaultValue={defaultValue} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="FirewallPolicy">Firewall Policy</SelectItem>
          <SelectItem value="ITSupport">IT Support</SelectItem>
          <SelectItem value="Email">Email</SelectItem>
          <SelectItem value="VPN">VPN</SelectItem>
          <SelectItem value="Hardware">Hardware</SelectItem>
          <SelectItem value="Software">Software</SelectItem>
          <SelectItem value="AdminAccess">Admin Access</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

