import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/use-auth";
import { useDashboardAnalytics, useEmployeeDashboard } from "@/hooks/use-dashboard";
import { getErrorMessage } from "@/lib/api";
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Employee Management System" },
    {
      name: "description",
      content: "Employee Management System dashboard.",
    },
  ];
}

// ---------------------------------------------------------------------------

const PIE_COLORS = [
  "#4F46E5", // indigo
  "#22C55E", // green
  "#EAB308", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
];

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "#94A3B8", // slate
  in_progress: "#4F46E5", // indigo
  in_review: "#EAB308", // yellow
  completed: "#22C55E", // green
  rejected: "#EF4444", // red
};

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  login: "logged in",
  logout: "logged out",
  user_created: "created a user",
  user_updated: "updated a user",
  user_deleted: "deleted a user",
  profile_updated: "updated their profile",
  department_created: "created a department",
  department_updated: "updated a department",
  department_deleted: "deleted a department",
  department_members_updated: "updated department members",
  leave_created: "requested leave",
  leave_cancelled: "cancelled a leave request",
  leave_approved: "approved a leave request",
  leave_rejected: "rejected a leave request",
  leave_balance_adjusted: "adjusted leave balance",
  announcement_created: "created an announcement",
  announcement_updated: "updated an announcement",
  announcement_deleted: "deleted an announcement",
  feedback_created: "submitted feedback",
  feedback_responded: "responded to feedback",
  feedback_resolved: "resolved feedback",
  attendance_marked: "marked attendance",
  attendance_bulk_marked: "bulk-marked attendance",
  review_created: "created a performance review",
  review_acknowledged: "acknowledged a review",
  review_deleted: "deleted a review",
  goal_updated: "updated a goal",
  task_created: "created a task",
  task_status_updated: "updated a task",
  task_submitted: "submitted a task",
  task_reviewed: "reviewed a task",
  ai_insight_deleted: "deleted an AI insight",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// =========================================================================
// Dashboard Page
// =========================================================================

export default function Dashboard() {
  const { isPending: isAuthPending, data: user } = useCurrentUser();

  if (isAuthPending) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-white min-h-screen">
        <header>
          <Skeleton className="h-9 w-48" />
        </header>
        <DashboardSkeleton />
      </div>
    );
  }

  if (user?.role === "employee") {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}

// =========================================================================
// Stats Cards
// =========================================================================

function StatsCards({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useDashboardAnalytics>["data"]>;
}) {
  const { summary } = analytics;

  const cards = [
    {
      label: "Total Employees",
      value: summary.totalEmployees,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Active Tasks",
      value: summary.activeTasks,
      icon: ListTodo,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pending Leaves",
      value: summary.pendingLeaves,
      icon: CalendarDays,
      color: summary.pendingLeaves > 0 ? "text-amber-600" : "text-gray-400",
      bg: summary.pendingLeaves > 0 ? "bg-amber-50" : "bg-gray-50",
    },
    {
      label: "Attendance Rate",
      value: `${summary.attendanceRate}%`,
      icon: TrendingUp,
      color:
        summary.attendanceRate >= 80
          ? "text-emerald-600"
          : summary.attendanceRate >= 60
            ? "text-amber-600"
            : "text-red-600",
      bg:
        summary.attendanceRate >= 80
          ? "bg-emerald-50"
          : summary.attendanceRate >= 60
            ? "bg-amber-50"
            : "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`${card.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
            <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-gray-900">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =========================================================================
// Task Status Pie Chart
// =========================================================================

function TaskStatusPie({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useDashboardAnalytics>["data"]>;
}) {
  const { taskStats } = analytics;
  const total = Object.values(taskStats).reduce((s, v) => s + v, 0);

  const pieData = [
    { name: "To Do", value: taskStats.todo, key: "todo" },
    { name: "In Progress", value: taskStats.in_progress, key: "in_progress" },
    { name: "In Review", value: taskStats.in_review, key: "in_review" },
    { name: "Completed", value: taskStats.completed, key: "completed" },
    { name: "Rejected", value: taskStats.rejected, key: "rejected" },
  ].filter((d) => d.value > 0);

  return (
    <Card className="bg-white border shadow-sm rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Task Distribution
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Current task status breakdown ({total} total)
            </p>
          </div>
          <ListTodo className="size-4 text-gray-400" />
        </div>
        <div className="mt-4 h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        TASK_STATUS_COLORS[entry.key] ?? "#94A3B8"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No tasks yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Attendance Pie Chart
// =========================================================================

function AttendancePie({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useDashboardAnalytics>["data"]>;
}) {
  const { attendanceOverview } = analytics;
  const total = Object.values(attendanceOverview).reduce((s, v) => s + v, 0);

  const pieData = [
    { name: "Present", value: attendanceOverview.present },
    { name: "Absent", value: attendanceOverview.absent },
    { name: "Late", value: attendanceOverview.late },
    { name: "Half Day", value: attendanceOverview.half_day },
    { name: "On Leave", value: attendanceOverview.on_leave },
  ].filter((d) => d.value > 0);

  const ATTENDANCE_COLORS = [
    "#22C55E", // green
    "#EF4444", // red
    "#EAB308", // yellow
    "#4F46E5", // indigo
    "#8B5CF6", // purple
  ];

  return (
    <Card className="bg-white border shadow-sm rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Attendance Overview
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              This month&apos;s attendance ({total} records)
            </p>
          </div>
          <CalendarCheck className="size-4 text-gray-400" />
        </div>
        <div className="mt-4 h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`att-${index}`}
                      fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No attendance records yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Leave by Type Bar Chart
// =========================================================================

function LeaveByTypeBar({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useDashboardAnalytics>["data"]>;
}) {
  const { leaveStats } = analytics;
  const total = leaveStats.pending + leaveStats.approved + leaveStats.rejected;

  const barData = leaveStats.byType.map((t) => ({
    name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    count: t.count,
  }));

  return (
    <Card className="bg-white border shadow-sm rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Leave Statistics
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {total} requests — {leaveStats.pending} pending, {leaveStats.approved} approved
            </p>
          </div>
          <CalendarDays className="size-4 text-gray-400" />
        </div>
        <div className="mt-4 h-64">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No leave requests yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Department Performance Bar Chart
// =========================================================================

function DepartmentPerformanceBar({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useDashboardAnalytics>["data"]>;
}) {
  const { departmentStats } = analytics;

  const chartData = departmentStats.map((dept) => ({
    name: dept.name.length > 14 ? dept.name.slice(0, 14) + "…" : dept.name,
    members: dept.memberCount,
    attendance: dept.attendanceRate,
  }));

  return (
    <Card className="bg-white border shadow-sm rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Department Performance
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Member count and attendance rate by department
            </p>
          </div>
          <Building2 className="size-4 text-gray-400" />
        </div>
        <div className="mt-4 h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="attendance"
                  fill="#4F46E5"
                  name="Attendance %"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="members"
                  fill="#22C55E"
                  name="Members"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No departments yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Recent Activity Table
// =========================================================================

function RecentActivityTable({
  analytics,
}: {
  analytics: NonNullable<ReturnType<typeof useDashboardAnalytics>["data"]>;
}) {
  const { recentActivity } = analytics;

  return (
    <Card className="bg-white border shadow-sm rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Latest actions across the system
              </p>
            </div>
            <FileText className="size-4 text-gray-400" />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          {recentActivity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-t border-gray-100">
                  <TableHead className="text-gray-600">Actor</TableHead>
                  <TableHead className="text-gray-600">Action</TableHead>
                  <TableHead className="text-gray-600">Target</TableHead>
                  <TableHead className="text-right text-gray-600">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="text-sm font-medium text-gray-900">
                      {activity.actorName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {ACTIVITY_ACTION_LABELS[activity.action] ?? activity.action}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {activity.targetName || "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-gray-500">
                      {timeAgo(activity.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Loading Skeleton
// =========================================================================

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white border shadow-sm">
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-white border shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =========================================================================
// Admin / Head Dashboard
// =========================================================================

function AdminDashboard() {
  const { isPending: isAuthPending, data: user } = useCurrentUser();
  const {
    data: analytics,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDashboardAnalytics();

  const isHead = user?.role === "head";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-white min-h-screen">
      <header>
        <p className="text-sm text-gray-500">
          {isHead ? "Department Overview" : "Organization Overview"}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-gray-900">
          {isAuthPending ? (
            <Skeleton className="h-9 w-48" />
          ) : user ? (
            `Welcome back, ${user.name.split(" ")[0]}`
          ) : (
            "Welcome"
          )}
        </h1>
      </header>

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <Alert variant="destructive" className="mt-6 bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="size-4 text-red-600" />
          <AlertTitle className="text-red-800">Couldn&apos;t load dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2 text-red-700">
            {getErrorMessage(error)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              {isRefetching ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : analytics ? (
        <div className="mt-6 space-y-6">
          <StatsCards analytics={analytics} />
          <div className="grid gap-6 lg:grid-cols-2">
            <TaskStatusPie analytics={analytics} />
            <AttendancePie analytics={analytics} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <LeaveByTypeBar analytics={analytics} />
            <DepartmentPerformanceBar analytics={analytics} />
          </div>
          {!isHead && <RecentActivityTable analytics={analytics} />}
        </div>
      ) : null}
    </div>
  );
}

// =========================================================================
// Employee Dashboard
// =========================================================================

function EmployeeDashboard() {
  const { isPending: isAuthPending, data: user } = useCurrentUser();
  const {
    data: dashboard,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEmployeeDashboard();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-white min-h-screen">
      <header>
        <p className="text-sm text-gray-500">My Overview</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-gray-900">
          {isAuthPending ? (
            <Skeleton className="h-9 w-48" />
          ) : user ? (
            `Welcome back, ${user.name.split(" ")[0]}`
          ) : (
            "Welcome"
          )}
        </h1>
      </header>

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <Alert variant="destructive" className="mt-6 bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="size-4 text-red-600" />
          <AlertTitle className="text-red-800">Couldn&apos;t load dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2 text-red-700">
            {getErrorMessage(error)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              {isRefetching ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : dashboard ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-blue-50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <CalendarCheck className="size-4 text-blue-600" />
                </div>
                <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-gray-900">
                  {dashboard.attendance.rate}%
                </p>
                <p className="text-xs text-gray-500">
                  {dashboard.attendance.overview.present + dashboard.attendance.overview.late + dashboard.attendance.overview.half_day} of {dashboard.attendance.workingDays} working days
                </p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </div>
                <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-gray-900">
                  {dashboard.tasks.completedCount}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboard.tasks.active.length} active tasks
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Leave Balance</p>
                  <CalendarDays className="size-4 text-amber-600" />
                </div>
                <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-gray-900">
                  {Object.values(dashboard.leaveBalance).reduce((s, b) => s + b.remaining, 0)}
                </p>
                <p className="text-xs text-gray-500">
                  days remaining this year
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white border shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-gray-900">Attendance</h2>
                    <p className="mt-0.5 text-xs text-gray-500">This month</p>
                  </div>
                  <CalendarCheck className="size-4 text-gray-400" />
                </div>
                <div className="mt-4 space-y-2">
                  {([
                    ["Present", dashboard.attendance.overview.present, "text-emerald-600"],
                    ["Late", dashboard.attendance.overview.late, "text-amber-600"],
                    ["Absent", dashboard.attendance.overview.absent, "text-red-600"],
                    ["Half Day", dashboard.attendance.overview.half_day, "text-indigo-600"],
                    ["On Leave", dashboard.attendance.overview.on_leave, "text-purple-600"],
                  ] as const).map(([label, count, color]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className={`text-sm font-medium ${color}`}>{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-gray-900">Leave Balance</h2>
                    <p className="mt-0.5 text-xs text-gray-500">{new Date().getFullYear()}</p>
                  </div>
                  <CalendarDays className="size-4 text-gray-400" />
                </div>
                <div className="mt-4 space-y-3">
                  {Object.entries(dashboard.leaveBalance).map(([type, balance]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-gray-600">{type}</span>
                        <span className="font-medium text-gray-900">
                          {balance.remaining}/{balance.total}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: `${balance.total > 0 ? ((balance.total - balance.remaining) / balance.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {dashboard.tasks.active.length > 0 && (
            <Card className="bg-white border shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-lg font-semibold text-gray-900">Active Tasks</h2>
                      <p className="mt-0.5 text-xs text-gray-500">Your pending tasks</p>
                    </div>
                    <ListTodo className="size-4 text-gray-400" />
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-t border-gray-100">
                        <TableHead className="text-gray-600">Task</TableHead>
                        <TableHead className="text-gray-600">Status</TableHead>
                        <TableHead className="text-gray-600">Priority</TableHead>
                        <TableHead className="text-right text-gray-600">Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.tasks.active.map((task) => (
                        <TableRow key={task._id} className="hover:bg-gray-50">
                          <TableCell className="text-sm font-medium text-gray-900">
                            {task.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-gray-700 border-gray-300">
                              {task.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                task.priority === "urgent"
                                  ? "border-red-500 text-red-700"
                                  : task.priority === "high"
                                    ? "border-amber-500 text-amber-700"
                                    : "border-gray-300 text-gray-700"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-500">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}