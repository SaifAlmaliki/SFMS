import React from 'react';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/header';
import { SidebarNav } from '@/components/sidebar-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar side="left" collapsible="icon" variant="sidebar">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
      <SidebarRail />
    </>
  );
}
