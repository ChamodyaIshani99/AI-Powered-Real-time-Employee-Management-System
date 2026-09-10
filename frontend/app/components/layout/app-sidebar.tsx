import {
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Megaphone,
  MessageSquareText,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";

import { BrandMark } from "@/components/layout/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import type { Role } from "@/types";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  employee: "Employee",
  head: "Head of Department",
};

interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  roles?: Role[];
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [{ title: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "My workspace",
    roles: ["employee", "head"],
    items: [
      { title: "My Profile", to: "/profile", icon: UserRound },
      { title: "My Leave Requests", to: "/leaves", icon: CalendarDays },
      { title: "Attendance", to: "/attendance", icon: CalendarCheck },
      { title: "Announcements", to: "/announcements", icon: Megaphone },
      { title: "Feedback", to: "/feedback", icon: MessageSquareText },
      { title: "Performance Reviews", to: "/performance-reviews", icon: Trophy },
      { title: "Tasks", to: "/tasks", icon: ClipboardList },
      { title: "AI Insights", to: "/ai-insights", icon: Sparkles },
    ],
  },
  {
    label: "Administration",
    roles: ["admin"],
    items: [
      { title: "Manage Users", to: "/admin/users", icon: Users },
      { title: "Departments", to: "/admin/departments", icon: Building2 },
      { title: "Reports", to: "/admin/reports", icon: BarChart3 },
      { title: "Manage Leaves", to: "/admin/leaves", icon: CalendarClock },
      { title: "Attendance", to: "/attendance", icon: CalendarCheck },
      { title: "Activity Log", to: "/admin/activity-log", icon: History },
      { title: "Announcements", to: "/announcements", icon: Megaphone },
      { title: "Feedback", to: "/admin/feedback", icon: MessageSquareText },
      { title: "Performance Reviews", to: "/admin/performance-reviews", icon: Trophy },
      { title: "Tasks", to: "/admin/tasks", icon: ClipboardList },
      { title: "AI Insights", to: "/admin/ai-insights", icon: Sparkles },
    ],
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar() {
  const { data: user } = useCurrentUser();
  const { pathname } = useLocation();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!user) return null;

  const groups = NAV_GROUPS.filter(
    (group) => !group.roles || group.roles.includes(user.role)
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl shadow-black/20 [&>div]:bg-transparent"
    >
      <SidebarHeader className="border-b border-white/5 pb-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-1 py-1 outline-none rounded-xl focus-visible:ring-2 ring-white/30 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <BrandMark className="size-9 rounded-xl shadow-lg shadow-indigo-500/20" />
          <span className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-base font-bold tracking-tight text-white">
              EMS
            </span>
            <span className="text-[0.6rem] font-medium uppercase tracking-wider text-indigo-300/70">
              Employee Management
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="mb-3">
            <SidebarGroupLabel className="mb-1 text-[0.6rem] font-semibold uppercase tracking-widest text-white/40">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={<Link to={item.to} />}
                      isActive={pathname === item.to}
                      tooltip={item.title}
                      className={`
                        relative rounded-xl px-3 py-1.5 text-sm font-medium text-white/70
                        transition-all duration-200 ease-out
                        hover:bg-white/10 hover:text-white
                        data-active:bg-gradient-to-r data-active:from-indigo-500 data-active:to-purple-600
                        data-active:text-white data-active:shadow-lg data-active:shadow-indigo-500/25
                        group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0
                        before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2
                        before:rounded-r-full before:bg-white before:opacity-0 before:transition-opacity
                        data-active:before:opacity-100
                        group-data-[collapsible=icon]:before:hidden
                      `}
                    >
                      <item.icon className="size-4.5 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 pt-4">
        <div
          className={`
            flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5
            backdrop-blur-sm transition-all
            group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent
            group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0
          `}
        >
          <Avatar className="size-9 ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-900">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-white">
              {user.name}
            </span>
            <span className="truncate text-xs text-indigo-300/70">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
          disabled={logout.isPending}
          className={`
            mt-2 w-full justify-start gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/70
            transition-all duration-200 hover:bg-white/10 hover:text-white
            group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0
          `}
        >
          {logout.isPending ? (
            <LoaderCircle className="size-4.5 animate-spin" />
          ) : (
            <LogOut className="size-4.5" />
          )}
          <span className="group-data-[collapsible=icon]:hidden">
            {logout.isPending ? "Signing out…" : "Sign out"}
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}