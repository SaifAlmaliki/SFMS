'use client';

import {
  FileTerminal,
  Gauge,
  Home,
  ShieldCheck,
  LifeBuoy,
  Settings,
  Bot,
  Flame,
  Wrench,
  BarChart,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground rounded-lg p-2 flex items-center justify-center">
            <Flame className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            Firewall AI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Dashboard">
              <Link href="/">
                <Home />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/policies'} tooltip="Policies">
              <Link href="/policies">
                <FileTerminal />
                Policies
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/monitoring'} tooltip="Monitoring">
              <Link href="/monitoring">
                <Gauge />
                Monitoring
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/compliance'} tooltip="Compliance">
              <Link href="/compliance">
                <ShieldCheck />
                Compliance
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/ai-tools')} tooltip="AI Tools">
              <Link href="/ai-tools">
                <Bot />
                AI Tools
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/reports'} tooltip="Reports">
              <Link href="/reports">
                <BarChart />
                Reports
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/automations'} tooltip="Automations">
              <Link href="/automations">
                <Wrench />
                Automations
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings">
              <Link href="/settings">
                <Settings />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/support'} tooltip="Support">
              <Link href="/support">
                <LifeBuoy />
                Support
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
