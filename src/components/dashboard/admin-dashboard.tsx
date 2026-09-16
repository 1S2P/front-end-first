import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDashed,
  ClipboardCheck,
  FolderOpen,
  Play,
  Plus,
  Timer,
  Workflow,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { SectionHeading, EmptyState } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import { useBrands, useProjects } from "@/lib/api/admin";
import {
  useWorkflowTemplates,
  useWorkflowInstances,
  useWorkflowStatusBoard,
} from "@/lib/api/workflows";
import { useAllBrandTasks, usePendingReviews } from "@/lib/api/tasks";
import { cn, formatHours, isDueToday, isOverdue, timeAgo, todayISO } from "@/lib/utils";

export function AdminDashboard() {
  const { currentBrandId, currentUser } = useApp();
  const { data: brands = [] } = useBrands();
  const { data: brandProjects = [] } = useProjects(currentBrandId);
  const { data: brandWorkflows = [] } = useWorkflowTemplates(currentBrandId);
  const { data: runningInstances = [] } = useWorkflowInstances(currentBrandId);
  const { data: allTasks = [] } = useAllBrandTasks(currentBrandId, { enabled: true });
  const { data: pendingReviews = [] } = usePendingReviews(currentBrandId);
  const { data: board = [] } = useWorkflowStatusBoard(currentBrandId ?? null);

  const brand = brands.find((b) => b.id === currentBrandId);
  const today = todayISO();

  const activeProjects = brandProjects.filter((p) => p.status === "active");
  const runningWorkflows = runningInstances.filter((w) => w.status === "running");
  const overdueTasks = allTasks.filter((t) => isOverdue(t.due_date, t.status));
  const dueTodayCount = allTasks.filter((t) => isDueToday(t.due_date, t.status)).length;

  const templateById = new Map(brandWorkflows.map((w) => [w.id, w]));

  const bottlenecks = [...board]
    .sort((a, b) => b.hours_in_step - a.hours_in_step)
    .slice(0, 5);

  const firstName = currentUser?.name.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow={brand ? `${brand.name} · Admin` : "Admin"}
        title={`Welcome back, ${firstName}`}
        description={`A live read on operations — ${activeProjects.length} active project${
          activeProjects.length === 1 ? "" : "s"
        }, ${runningWorkflows.length} workflow${
          runningWorkflows.length === 1 ? "" : "s"
        } in progress.`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/workflows/builder" search={{ templateId: "" }}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New workflow
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/workflows">
                <Play className="mr-1.5 h-4 w-4" aria-hidden />
                Run workflow
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <section aria-label="Workspace statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Active projects"
          value={activeProjects.length}
          icon={FolderOpen}
          tone="primary"
          hint={brandProjects.length > activeProjects.length ? `${brandProjects.length - activeProjects.length} archived` : undefined}
          to="/projects"
        />
        <KpiCard
          label="Running workflows"
          value={runningWorkflows.length}
          icon={Workflow}
          tone="info"
          hint={`${brandWorkflows.length} templates`}
          to="/workflows"
        />
        <KpiCard
          label="Pending reviews"
          value={pendingReviews.length}
          icon={ClipboardCheck}
          tone={pendingReviews.length > 0 ? "warning" : "default"}
          hint={pendingReviews.length > 0 ? "Awaiting action" : "Queue clear"}
          to="/tasks"
        />
        <KpiCard
          label="Overdue tasks"
          value={overdueTasks.length}
          icon={AlertTriangle}
          tone={overdueTasks.length > 0 ? "danger" : "default"}
          hint={overdueTasks.length > 0 ? `${dueTodayCount} due today` : "On schedule"}
          to="/tasks"
        />
      </section>

      {/* Action required — pending reviews */}
      <section className="mt-8">
        <SectionHeading
          title="Needs your review"
          description={
            pendingReviews.length > 0
              ? `${pendingReviews.length} submission${pendingReviews.length === 1 ? "" : "s"} waiting on a decision`
              : "Approvals routed to you appear here"
          }
          icon={ClipboardCheck}
          viewAllTo="/tasks"
          viewAllLabel="All tasks"
        />
        {pendingReviews.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing waiting on you"
            description="When someone submits work for approval, it lands here first."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="divide-y divide-border/60">
              {pendingReviews.slice(0, 5).map((t) => {
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
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <span>{t.assigned_profile?.name ?? "Unassigned"}</span>
                        {t.project?.name && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="truncate">{t.project.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                      <Timer className="h-3.5 w-3.5" aria-hidden />
                      {t.submitted_at ? `${timeAgo(t.submitted_at)} waiting` : "—"}
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
          </div>
        )}
      </section>

      {/* Running workflows + recent projects */}
      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeading
            title="Running workflows"
            description="Live instances and how far each has progressed"
            icon={Workflow}
            viewAllTo="/workflows/status"
            viewAllLabel="Status board"
          />
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {runningWorkflows.length === 0 ? (
              <EmptyState
                icon={Workflow}
                title="No workflows running"
                description="Start a workflow from the library to kick off an automated chain of tasks."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/workflows">Open workflow library</Link>
                  </Button>
                }
                className="border-0"
                size="sm"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {runningWorkflows.slice(0, 5).map((wi) => {
                  const template = templateById.get(wi.template_id);
                  const total = template?.workflow_steps?.length ?? 0;
                  const done = Math.min(wi.current_step_index ?? 0, total || Infinity);
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={wi.id} className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {template?.name ?? "Unknown workflow"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {(wi as unknown as { projects?: { name?: string } | null }).projects?.name ?? "No project"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                          {total > 0 ? `${done}/${total}` : `Step ${done + 1}`}
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{ width: `${total > 0 ? pct : 5}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <SectionHeading title="Recent projects" icon={FolderOpen} viewAllTo="/projects" />
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {brandProjects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Projects group related workflows under one initiative."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/projects">Create a project</Link>
                  </Button>
                }
                className="border-0"
                size="sm"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {brandProjects.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      {p.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        p.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", p.status === "active" ? "bg-success" : "bg-muted-foreground/50")}
                        aria-hidden
                      />
                      {p.status === "active" ? "Active" : "Archived"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Workflow bottlenecks */}
      <section className="mt-8">
        <SectionHeading
          title="Workflow bottlenecks"
          description="Active steps that have been sitting the longest"
          icon={Timer}
          viewAllTo="/workflows/status"
          viewAllLabel="Status board"
        />
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {bottlenecks.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="No steps in flight"
              description="Once workflows start moving, the slowest steps surface here."
              className="border-0"
              size="sm"
            />
          ) : (
            <div className="divide-y divide-border/60">
              {bottlenecks.map((row) => (
                <Link
                  key={row.task_id}
                  to="/tasks/$id"
                  params={{ id: row.task_id }}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <EmployeeAvatar
                    profile={{
                      initials: row.assignee_initials,
                      avatar_color: row.assignee_avatar_color,
                    }}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{row.task_title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {row.workflow_name}
                      {row.current_step_name && (
                        <>
                          <span aria-hidden> · </span>
                          {row.current_step_name}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                    <span
                      className={cn(
                        row.is_overdue ? "font-medium text-destructive" : "tabular-nums",
                      )}
                    >
                      {formatHours(row.hours_in_step)} in step
                    </span>
                  </div>
                  {row.is_overdue && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      Overdue
                    </span>
                  )}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
