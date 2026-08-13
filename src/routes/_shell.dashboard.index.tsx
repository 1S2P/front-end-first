import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useMyTasks } from "@/lib/api/tasks";
import { useNotifications } from "@/lib/api/notifications";
import { TASK_STATUS_LABELS } from "@/lib/types";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeamLeadDashboard } from "@/components/dashboard/team-lead-dashboard";

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
      <div className="flex items-center justify-center h-64 text-muted-foreground">
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
  const { data: myTasks = [] } = useMyTasks(currentBrandId);
  const { data: notifications = [] } = useNotifications();

  if (!currentUser) return null;

  const today = new Date().toISOString().split("T")[0];
  const dueToday = myTasks.filter((t) => t.due_date === today && t.status !== "completed");
  const overdue = myTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  );
  const completed = myTasks.filter((t) => t.status === "completed");
  const unread = notifications.filter((n) => !n.read).length;

  const stats = [
    {
      label: "Assigned to me",
      value: myTasks.filter((t) => t.status !== "completed").length,
      accent: true,
    },
    { label: "Due today", value: dueToday.length, accent: false },
    { label: "Overdue", value: overdue.length, accent: overdue.length > 0 },
    { label: "Completed", value: completed.length, accent: false },
  ];

  const activeTasks = myTasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {getGreeting()}, {currentUser.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You have {dueToday.length} task{dueToday.length !== 1 ? "s" : ""} due today
          {overdue.length > 0 && `, ${overdue.length} overdue`}
          {unread > 0 && `, ${unread} unread notification${unread !== 1 ? "s" : ""}`}.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <span
                  className={`mt-1 block text-2xl font-bold ${s.accent ? "text-primary" : "text-foreground"}`}
                >
                  {s.value}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-semibold">My Tasks</h2>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link to="/tasks">View all</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {activeTasks.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-sm text-muted-foreground">
                No active tasks. Enjoy your free time!
              </CardContent>
            </Card>
          ) : (
            activeTasks.map((t) => {
              const isOverdue =
                t.due_date && t.due_date < today && t.status !== "completed";
              return (
                <Link
                  key={t.id}
                  to="/tasks/$id"
                  params={{ id: t.id }}
                  className={`flex items-center justify-between gap-3 rounded-xl border-l-4 bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 ${isOverdue ? "border-l-destructive" : "border-l-primary"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {(t as any).department?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        t.priority === "high"
                          ? "destructive"
                          : t.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {t.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {TASK_STATUS_LABELS[t.status]}
                    </Badge>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-semibold">Recent Notifications</h2>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link to="/notifications">View all</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {notifications.slice(0, 4).map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-xl p-4 ${n.read ? "bg-card" : "bg-primary/5"}`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.type.includes("overdue") || n.type.includes("rejected") ? "bg-destructive/10 text-destructive" : n.type.includes("approved") ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}
              >
                {n.type.includes("overdue") ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : n.type.includes("approved") ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : n.type.includes("comment") ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{n.message}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatTimeAgo(n.created_at)}
                </p>
              </div>
              {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
            </div>
          ))}
          {notifications.length === 0 && (
            <Card className="py-8">
              <CardContent className="text-center text-sm text-muted-foreground">
                No notifications yet.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000),
    h = Math.floor(m / 60),
    d = Math.floor(h / 24);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}
