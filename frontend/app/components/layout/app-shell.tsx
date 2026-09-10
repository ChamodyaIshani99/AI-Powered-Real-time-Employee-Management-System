import { Outlet } from "react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNotificationSSE } from "@/hooks/use-notifications";

/**
 * Chrome around every protected page: collapsible sidebar (icon rail on
 * desktop, Sheet on mobile) + a slim header with the sidebar trigger.
 * Pages render their own content below the header.
 */
export function AppShell() {
  // Initialize SSE connection for real-time notifications.
  useNotificationSSE();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/5 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 px-4 backdrop-blur-md">
          <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" />
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <div className="ml-auto text-white/70 hover:text-white">
            <NotificationBell />
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}