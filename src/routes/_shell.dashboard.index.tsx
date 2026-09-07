import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  CircleDot,
  ListChecks,
  Ticket,
  Bell,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useMyTasks, useUpdateTaskStatus } from "@/lib/api/tasks";
import { useNotifications } from "@/lib/api/notifications";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeamLeadDashboard } from "@/components/dashboard/team-lead-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskRow, type TaskRowData } from "@/components/dashboard/task-row";
import { NotificationRow } from "@/components/dashboard/notification-row";
import { SectionHeader, EmptyState } from "@/components/dashboard/dashboard-ui";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard · Danfe x NTE" }],
  }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const { currentUser, currentRole, hasPermission } = useApp();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  if (currentRole === "admin") {
    return <AdminDashboard />;
  }

  const hasTeamView =
    hasPermission("dashboard_department_tasks") ||
    hasPermission("dashboard_department_progress") ||
    hasPermission("dashboard_all_projects") ||
    hasPermission("dashboard_all_workflows");

  if (hasTeamView) {
    return <TeamLeadDashboard />;
  }

  return <EmployeeDashboard />;
}

function EmployeeDashboard() {
  const { currentUser, currentBrandId } = useApp();
  const { data: myTasks = [], isLoading: tasksLoading } = useMyTasks(currentBrandId);
  const { data: notifications = [], isLoading: notifLoading } = useNotifications();
  const updateStatus = useUpdateTaskStatus();

  if (!currentUser) return null;

  const today = new Date().toISOString().split("T")[0];
  const dueToday = myTasks.filter((t) => t.due_date === today && t.status !== "completed");
  const overdue = myTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  );
  const completed = myTasks.filter((t) => t.status === "completed");
  const active = myTasks.filter((t) => t.status !== "completed");
  const unread = notifications.filter((n) => !n.read);

  const activeTasks = [...active]
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, 5);

  const handleToggleComplete = (task: TaskRowData) => {
    const completing = task.status !== "completed";
    updateStatus.mutate(
      { taskId: task.id, status: completing ? "completed" : "in_progress" },
      {
        onSuccess: () =>
          toast.success(completing ? `"${task.title}" marked as done` : `"${task.title}" reopened`),
        onError: (e) => toast.error(e.message || "Could not update task"),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <header className="mb-7">
        <p className="mb-2 text-[13px] font-medium text-muted-foreground">
          {formatFullDate(new Date())}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              {getGreeting()},{" "}
              <span className="text-foreground">{currentUser.name.split(" ")[0]}</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s your day at a glance across{" "}
              <span className="font-medium text-foreground">{active.length}</span> active task
              {active.length !== 1 ? "s" : ""}.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden />
            {dueToday.length > 0 ? (
              <span>
                {dueToday.length} due today
                {overdue.length > 0 && (
                  <span className="ml-1 font-semibold text-destructive">
                    · {overdue.length} overdue
                  </span>
                )}
              </span>
            ) : overdue.length > 0 ? (
              <span className="font-semibold text-destructive">{overdue.length} overdue</span>
            ) : (
              <span>Nothing due today</span>
            )}
          </div>
        </div>
      </header>

      {/* Statistics */}
      <section
        aria-label="Your statistics"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Assigned to me"
          value={active.length}
          icon={ClipboardList}
          tone="primary"
          hint={`${Math.round((active.length / Math.max(myTasks.length, 1)) * 100)}% of all`}
        />
        <StatCard label="Due today" value={dueToday.length} icon={CalendarCheck} tone="primary" />
        <StatCard
          label="Overdue"
          value={overdue.length}
          icon={Clock}
          tone={overdue.length > 0 ? "destructive" : "default"}
          hint={overdue.length > 0 ? "Needs attention" : ""}
        />
        <StatCard
          label="Completed"
          value={completed.length}
          icon={CheckCircle2}
          tone="success"
          hint={`${Math.round((completed.length / Math.max(myTasks.length, 1)) * 100)}% done`}
        />
      </section>

      {/* Task list */}
      <section className="mt-9">
        <SectionHeader
          title="My Tasks"
          description="Your active tasks, ordered by due date"
          viewAllTo="/tasks"
          icon={ListChecks}
        />
        {tasksLoading ? (
          <TaskListSkeleton />
        ) : activeTasks.length === 0 ? (
          <EmptyState
            icon={CircleDot}
            title="No active tasks"
            description="You’re all caught up. New tasks will show up here as they’re assigned."
          />
        ) : (
          <div className="space-y-1.5">
            {activeTasks.map((t) => (
              <TaskRow
                key={t.id}
                task={{
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  priority: t.priority,
                  due_date: t.due_date,
                  department: t.department,
                  project: t.project,
                }}
                today={today}
                onToggleComplete={handleToggleComplete}
              />
            ))}
            {active.length > 5 && (
              <Link
                to="/tasks"
                className="block rounded-lg border border-dashed border-border px-4 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                View all {active.length} active tasks
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="mt-9">
        <SectionHeader
          title="Recent Notifications"
          description={unread.length > 0 ? `${unread.length} unread` : "You’re all caught up"}
          viewAllTo="/notifications"
          icon={Bell}
        />
        {notifLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No notifications"
            description="When something needs your attention, it’ll show up here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="divide-y divide-border/60">
              {notifications.slice(0, 5).map((n) => (
                <NotificationRow key={n.id} notification={n} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function formatFullDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function TaskListSkeleton() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border/70 bg-card px-4 py-3.5"
        >
          <div className="h-[18px] w-[18px] animate-pulse rounded-[5px] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
