import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Timer,
  UserRound,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { SectionHeading, EmptyState } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { Button } from "@/components/ui/button";
import { TaskRow, type TaskRowData } from "@/components/dashboard/task-row";
import { useApp } from "@/lib/app-context";
import { useDepartmentTasks, usePendingReviews } from "@/lib/api/tasks";
import { useDepartments, useProfiles } from "@/lib/api/admin";
import { cn, isOverdue, timeAgo, todayISO } from "@/lib/utils";

type Assignment = {
  key: string;
  name: string;
  initials?: string | null;
  avatar_color?: string | null;
  active: number;
  overdue: number;
};

export function TeamLeadDashboard() {
  const { currentUser, currentBrandId } = useApp();
  const deptId = currentUser?.department_id ?? "";
  const { data: deptTasks = [] } = useDepartmentTasks(deptId, currentBrandId);
  const { data: pendingReviews = [] } = usePendingReviews(currentBrandId);
  const { data: departments = [] } = useDepartments(currentBrandId);
  const { data: profiles = [] } = useProfiles(currentBrandId);

  if (!currentUser) return null;

  const dept = departments.find((d) => d.id === deptId);
  const today = todayISO();

  const activeTasks = deptTasks.filter((t) => t.status !== "completed");
  const overdueTasks = deptTasks.filter((t) => isOverdue(t.due_date, t.status));
  const myReviews = pendingReviews.filter((t) => t.approver_id === currentUser.id);
  const team = profiles.filter((p) => p.department_id === deptId);

  // Workload grouped by assignee (active tasks only).
  const assignments = new Map<string, Assignment>();
  for (const t of activeTasks) {
    const key = t.assigned_to ?? "__unassigned__";
    const existing = assignments.get(key);
    const overdue = isOverdue(t.due_date, t.status) ? 1 : 0;
    if (existing) {
      existing.active += 1;
      existing.overdue += overdue;
    } else {
      assignments.set(key, {
        key,
        name: t.assigned_profile?.name ?? "Unassigned",
        initials: t.assigned_profile?.initials,
        avatar_color: t.assigned_profile?.avatar_color,
        active: 1,
        overdue,
      });
    }
  }
  const workload = [...assignments.values()].sort(
    (a, b) => b.active - a.active || b.overdue - a.overdue,
  );
  const maxLoad = Math.max(1, ...workload.map((w) => w.active));

  const sortedActive = [...activeTasks].sort((a, b) =>
    (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"),
  );

  const firstName = currentUser.name.split(" ")[0];
  const capacity = workload
    .filter((w) => w.key !== "__unassigned__")
    .reduce((sum, w) => sum + w.active, 0);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow={dept ? `${dept.name} · Team Lead` : "Team Lead"}
        title={`Welcome back, ${firstName}`}
        description={`${activeTasks.length} active task${
          activeTasks.length === 1 ? "" : "s"
        } across your team${overdueTasks.length > 0 ? ` · ${overdueTasks.length} overdue` : ""}.`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/tasks">
              Open task board
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {/* KPIs */}
      <section aria-label="Department statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Active tasks"
          value={activeTasks.length}
          icon={ClipboardCheck}
          tone="primary"
          hint={`${deptTasks.length} total`}
          to="/tasks"
        />
        <KpiCard
          label="Awaiting review"
          value={myReviews.length}
          icon={Timer}
          tone={myReviews.length > 0 ? "warning" : "default"}
          hint={myReviews.length > 0 ? "Needs your call" : "Queue clear"}
          to="/tasks"
        />
        <KpiCard
          label="Overdue"
          value={overdueTasks.length}
          icon={AlertTriangle}
          tone={overdueTasks.length > 0 ? "danger" : "default"}
          hint={overdueTasks.length > 0 ? "Past due date" : "On schedule"}
          to="/tasks"
        />
        <KpiCard
          label="Team members"
          value={team.length}
          icon={Users}
          tone="info"
          hint={`${capacity} open assignment${capacity === 1 ? "" : "s"}`}
        />
      </section>

      {/* Reviews + workload */}
      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeading
            title="Awaiting your review"
            description={
              myReviews.length > 0
                ? `${myReviews.length} submission${myReviews.length === 1 ? "" : "s"} assigned to you`
                : "Approvals routed to you appear here"
            }
            icon={ClipboardCheck}
            viewAllTo="/tasks"
          />
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {myReviews.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No reviews pending"
                description="Work submitted to you for approval will show up here."
                className="border-0"
                size="sm"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {myReviews.slice(0, 6).map((t) => {
                  const overdue = isOverdue(t.due_date, t.status);
                  return (
                    <Link
                      key={t.id}
                      to="/tasks/$id"
                      params={{ id: t.id }}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <EmployeeAvatar profile={t.assigned_profile} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {t.assigned_profile?.name ?? "Unassigned"}
                          {t.submitted_at && <> · submitted {timeAgo(t.submitted_at)}</>}
                        </p>
                      </div>
                      <StatusBadge
                        status={t.status}
                        attention={overdue ? "overdue" : null}
                        className="hidden md:inline-flex"
                      />
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <SectionHeading
            title="Team workload"
            description="Open tasks by person"
            icon={Users}
          />
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {workload.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No open assignments"
                description="Everyone in your department is clear."
                className="border-0"
                size="sm"
              />
            ) : (
              <div className="space-y-3 px-4 py-4">
                {workload.slice(0, 6).map((w) => (
                  <div key={w.key} className="flex items-center gap-3">
                    <EmployeeAvatar
                      profile={{ initials: w.initials, avatar_color: w.avatar_color }}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {w.name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {w.active}
                          {w.overdue > 0 && (
                            <span className="ml-1 font-medium text-destructive">
                              · {w.overdue} late
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            w.overdue > 0 ? "bg-destructive/70" : "bg-primary",
                          )}
                          style={{ width: `${Math.round((w.active / maxLoad) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Department tasks */}
      <section className="mt-8">
        <SectionHeading
          title="Department tasks"
          description="Active work across the team, ordered by due date"
          icon={ClipboardCheck}
          viewAllTo="/tasks"
        />
        {sortedActive.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No active tasks"
            description="Tasks assigned to your department will show up here."
          />
        ) : (
          <div className="space-y-1.5">
            {sortedActive.slice(0, 8).map((t) => (
              <TaskRow
                key={t.id}
                task={
                  {
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    due_date: t.due_date,
                    department: t.department,
                    project: t.project,
                  } satisfies TaskRowData
                }
                today={today}
              />
            ))}
            {sortedActive.length > 8 && (
              <Link
                to="/tasks"
                className="block rounded-lg border border-dashed border-border px-4 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                View all {sortedActive.length} active department tasks
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
