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
  UserCheck,
  User,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import placeholderImages from '@/lib/placeholder-images.json';

export function SidebarNav() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const isPolicyOpen = pathname.startsWith('/policies') || pathname.startsWith('/templates');
  const isSupportOpen = pathname.startsWith('/support') || pathname.startsWith('/admin/knowledge-base');
  const [openCollapsibles, setOpenCollapsibles] = useState({
      policy: isPolicyOpen,
      support: isSupportOpen,
  });

  const userAvatar = placeholderImages.placeholderImages.find(
    (img) => img.id === 'user-avatar'
  );

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
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard">
              <Link href="/dashboard">
                <Home />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <Collapsible open={openCollapsibles.policy} onOpenChange={(isOpen) => setOpenCollapsibles(prev => ({...prev, policy: isOpen}))}>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isPolicyOpen} className='justify-between w-full' tooltip='Policy Management'>
                    <div className='flex items-center gap-2'>
                        <FileTerminal />
                        Policies
                    </div>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', openCollapsibles.policy && 'rotate-180')} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
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
          </SidebarMenuItem>

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
            <Collapsible open={openCollapsibles.support} onOpenChange={(isOpen) => setOpenCollapsibles(prev => ({...prev, support: isOpen}))}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={isSupportOpen} className='justify-between w-full' tooltip='IT Support'>
                  <div className='flex items-center gap-2'>
                    <LifeBuoy />
                    IT Support
                  </div>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', openCollapsibles.support && 'rotate-180')} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className='py-2 pl-7'>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/support'} size="sm">
                      <Link href="/support">
                        Support Chat
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/support/tickets'} size="sm">
                      <Link href="/support/tickets">
                        Tickets
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/knowledge-base'} size="sm">
                      <Link href="/admin/knowledge-base">
                        Knowledge Base
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/approvals')} tooltip="Admin Approvals">
              <Link href="/admin/approvals">
                <UserCheck />
                Admin Approvals
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/audit')} tooltip="Audit Reports">
              <Link href="/audit/reports">
                <ShieldCheck />
                Audit Reports
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="Profile">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={userAvatar?.imageUrl} alt="User Avatar" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  Admin
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right">
                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
