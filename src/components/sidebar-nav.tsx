
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
  ShieldAlert,
  Radiation,
  Database,
  Network,
  ChevronDown,
  Layers,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function SidebarNav() {
  const pathname = usePathname();
  const isPolicyOpen = pathname.startsWith('/policies') || pathname.startsWith('/templates');
  const [openCollapsibles, setOpenCollapsibles] = useState({
      policy: isPolicyOpen,
  });

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
          
          <Collapsible open={openCollapsibles.policy} onOpenChange={(isOpen) => setOpenCollapsibles(prev => ({...prev, policy: isOpen}))}>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isPolicyOpen} className='justify-between w-full' tooltip='Policy Management'>
                    <div className='flex items-center gap-2'>
                        <FileTerminal />
                        Policies
                    </div>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', openCollapsibles.policy && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
                <SidebarMenu className='py-2 pl-7'>
                    <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/policies'} size="sm">
                        <Link href="/policies">
                        All Policies
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/templates'} size="sm">
                        <Link href="/templates">
                        Templates
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/network-objects'} tooltip="Network Objects">
              <Link href="/network-objects">
                <Network />
                Network Objects
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
            <SidebarMenuButton asChild isActive={pathname === '/configuration'} tooltip="Configuration">
              <Link href="/configuration">
                <Database />
                Configuration
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/compliance')} tooltip="Compliance">
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
            <SidebarMenuButton asChild isActive={pathname === '/threat-intelligence'} tooltip="Threat Intelligence">
              <Link href="/threat-intelligence">
                <ShieldAlert />
                Threat Intelligence
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/response'} tooltip="Incident & Response">
              <Link href="/response">
                <Radiation />
                Incident & Response
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
