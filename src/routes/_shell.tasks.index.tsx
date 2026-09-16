import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/section-heading";
import { StatusBadge, STATUS_META } from "@/components/status-badge";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Play, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  useMyTasks,
  useDepartmentTasks,
  usePendingReviews,
  useReassignedTasks,
  useAllBrandTasks,
  useStartTask,
} from "@/lib/api/tasks";
import { useDepartments } from "@/lib/api/admin";
import { BOARD_COLUMNS, type TaskStatus } from "@/lib/types";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/tasks/")({
  head: () => ({
    meta: [
      { title: "My Tasks · Danfe x NTE" },
      { name: "description", content: "Everything assigned to you across brands and departments." },
      { property: "og:title", content: "My Tasks" },
    ],
  }),
  component: MyTasks,
});

function priorityDot(priority: "high" | "medium" | "low") {
  return priority === "high"
    ? "bg-destructive"
    : priority === "medium"
      ? "bg-warning"
      : "bg-muted-foreground/50";
}

type SupabaseTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  brand_id: string;
  project_id: string;
  department_id: string | null;
  workflow_instance_id: string | null;
  workflow_step_id: string | null;
  workflow_step_index: number;
  assigned_to: string | null;
  approved_by: string | null;
  due_date: string | null;
  estimated_time: string | null;
  approval_required: boolean;
  approver_role: string;
  approver_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  assigned_profile?: { id: string; name: string; initials: string; avatar_color: string } | null;
  approver_profile?: { id: string; name: string; initials: string; avatar_color: string } | null;
  project?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
};

function MyTasks() {
  const [view, setView] = useState<"list" | "board">("board");
  const [activeTab, setActiveTab] = useState<"my" | "dept" | "reviews" | "reassigned" | "today" | "completed">("my");
  const { currentUser, currentBrandId, currentRole, hasPermission } = useApp();
  const isAdmin = currentRole === "admin";
  const { data: myTasks = [], isLoading } = useMyTasks(currentBrandId);
  const { data: pendingReviews = [] } = usePendingReviews(currentBrandId);
  const { data: reassignedTasks = [] } = useReassignedTasks(currentBrandId);
  const { data: departments = [] } = useDepartments(currentBrandId);
  const { data: deptTasks = [] } = useDepartmentTasks(currentUser?.department_id ?? "", currentBrandId);
  const { data: allBrandTasks = [] } = useAllBrandTasks(currentBrandId, { enabled: isAdmin });
  const startTask = useStartTask();

  const handleStart = async (t: SupabaseTask) => {
    try {
      await startTask.mutateAsync(t.id);
      toast.success(`"${t.title}" marked as in progress`);
    } catch {
      toast.error("Failed to start task");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading tasks…
      </div>
    );
  }

  const canSeeDept = isAdmin || hasPermission("dashboard_department_tasks");
  const canReviewTasks = isAdmin || currentRole === "team_lead" || currentRole === "team_member";

  const departmentTasks = isAdmin ? allBrandTasks : deptTasks;

  const reviewQueue = pendingReviews.filter(
    (t) =>
      t.status === "waiting_review" &&
      !t.reviewed_at &&
      t.approval_required &&
      t.assigned_to !== currentUser.id &&
      (t.approver_id != null ? t.approver_id === currentUser.id : isAdmin),
  );

  const reassignedMine = reassignedTasks.filter((t) => t.assigned_to === currentUser.id);

  const today = new Date().toISOString().split("T")[0];
  const dueToday = myTasks.filter(
    (t) => t.due_date === today && !["completed", "approved", "rejected"].includes(t.status),
  );
  const completedTasksSource = isAdmin ? allBrandTasks : myTasks;
  const completedTasks = completedTasksSource.filter((t) => t.status === "completed");

  const dept = departments.find((d) => d.id === currentUser.department_id);

  const tabTitle = (() => {
    switch (activeTab) {
      case "reviews":
        return "Pending Reviews";
      case "dept":
        return `${dept?.name || "Department"} Tasks`;
      case "reassigned":
        return "Re-assigned Tasks";
      case "today":
        return "Due Today";
      case "completed":
        return "Completed";
      default:
        return "My Tasks";
    }
  })();

  const tabDescription = (() => {
    switch (activeTab) {
      case "reviews":
        return "Tasks waiting for your review.";
      case "dept":
        return `All tasks in ${dept?.name || "your department"}.`;
      case "reassigned":
        return "Tasks sent back by reviewers for rework.";
      case "today":
        return "Your tasks due today.";
      case "completed":
        return isAdmin ? "All completed tasks across the workspace." : "Your completed tasks.";
      default:
        return "View and manage your assigned tasks.";
    }
  })();

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title={tabTitle}
        description={tabDescription}
        actions={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Board
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="mr-1.5 h-4 w-4" />
              List
            </Button>
          </div>
        }
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "my" | "dept" | "reviews" | "reassigned" | "today" | "completed")
        }
      >
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="my"
            className="h-8 rounded-full border border-transparent px-3 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            My Tasks
          </TabsTrigger>
          {canSeeDept && (
            <TabsTrigger
              value="dept"
              className="h-8 gap-1.5 rounded-full border border-transparent px-3 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Department
              {departmentTasks.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {departmentTasks.length}
                </span>
              )}
            </TabsTrigger>
          )}
          {canReviewTasks && (
            <TabsTrigger
              value="reviews"
              className="h-8 gap-1.5 rounded-full border border-transparent px-3 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Pending Reviews
              {reviewQueue.length > 0 && (
                <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
                  {reviewQueue.length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="reassigned"
            className="h-8 gap-1.5 rounded-full border border-transparent px-3 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Re-assigned
            {reassignedMine.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {reassignedMine.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="today"
            className="h-8 gap-1.5 rounded-full border border-transparent px-3 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Due Today
            {dueToday.length > 0 && (
              <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
                {dueToday.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="h-8 rounded-full border border-transparent px-3 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            Completed
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my" className="mt-4">
          {isLoading ? (
            <LoadingState />
          ) : view === "board" ? (
            <BoardView tasks={myTasks} showAssignee={false} onStart={handleStart} currentUserId={currentUser.id} />
          ) : (
            <ListView tasks={myTasks} showAssignee={false} onStart={handleStart} currentUserId={currentUser.id} />
          )}
        </TabsContent>
        {canSeeDept && (
          <TabsContent value="dept" className="mt-4">
            {view === "board" ? (
              <BoardView tasks={departmentTasks} showAssignee={true} onStart={handleStart} currentUserId={currentUser.id} />
            ) : (
              <ListView tasks={departmentTasks} showAssignee={true} onStart={handleStart} currentUserId={currentUser.id} />
            )}
          </TabsContent>
        )}
        {canReviewTasks && (
          <TabsContent value="reviews" className="mt-4">
            {view === "board" ? (
              <BoardView tasks={reviewQueue} showAssignee={true} onStart={handleStart} currentUserId={currentUser.id} />
            ) : (
              <ListView tasks={reviewQueue} showAssignee={true} onStart={handleStart} currentUserId={currentUser.id} />
            )}
          </TabsContent>
        )}
        <TabsContent value="reassigned" className="mt-4">
          {view === "board" ? (
            <BoardView tasks={reassignedMine} showAssignee={false} onStart={handleStart} currentUserId={currentUser.id} />
          ) : (
            <ListView tasks={reassignedMine} showAssignee={false} onStart={handleStart} currentUserId={currentUser.id} />
          )}
        </TabsContent>
        <TabsContent value="today" className="mt-4">
          {view === "board" ? (
            <BoardView tasks={dueToday} showAssignee={false} onStart={handleStart} currentUserId={currentUser.id} />
          ) : (
            <ListView tasks={dueToday} showAssignee={false} onStart={handleStart} currentUserId={currentUser.id} />
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {view === "board" ? (
            <BoardView tasks={completedTasks} showAssignee={isAdmin} onStart={handleStart} currentUserId={currentUser.id} />
          ) : (
            <ListView tasks={completedTasks} showAssignee={isAdmin} onStart={handleStart} currentUserId={currentUser.id} />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Loading tasks…
    </div>
  );
}

function ListView({
  tasks,
  showAssignee,
  onStart,
  currentUserId,
}: {
  tasks: SupabaseTask[];
  showAssignee: boolean;
  onStart?: (t: SupabaseTask) => void;
  currentUserId?: string;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No tasks here"
        description="Nothing matches this view right now."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="divide-y divide-border/60">
        {tasks.map((t) => {
          const overdue = isOverdue(t.due_date, t.status);
          const canStart = onStart && currentUserId && t.assigned_to === currentUserId && t.status === "ready";
          return (
            <div
              key={t.id}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", priorityDot(t.priority))}
                title={`${t.priority} priority`}
              />
              <Link to="/tasks/$id" params={{ id: t.id }} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  {t.project?.name && <span className="truncate">{t.project.name}</span>}
                  {t.project?.name && t.department?.name && <span aria-hidden>·</span>}
                  {t.department?.name && <span className="truncate">{t.department.name}</span>}
                </p>
              </Link>

              {showAssignee && (
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <EmployeeAvatar profile={t.assigned_profile} size="md" />
                  <span className="hidden max-w-[9rem] truncate text-xs text-muted-foreground lg:inline">
                    {t.assigned_profile?.name ?? "Unassigned"}
                  </span>
                </div>
              )}

              <span
                className={cn(
                  "hidden shrink-0 text-xs tabular-nums sm:inline",
                  overdue ? "font-medium text-destructive" : "text-muted-foreground",
                )}
              >
                {t.due_date ? formatDueDate(t.due_date, t.status) : "No due date"}
              </span>

              {canStart && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => onStart(t)}
                >
                  <Play className="mr-1 h-3 w-3" aria-hidden />
                  Start
                </Button>
              )}

              <StatusBadge
                status={t.status}
                attention={overdue ? "overdue" : null}
                className="hidden shrink-0 md:inline-flex"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardView({
  tasks,
  showAssignee,
  onStart,
  currentUserId,
}: {
  tasks: SupabaseTask[];
  showAssignee: boolean;
  onStart?: (t: SupabaseTask) => void;
  currentUserId?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {BOARD_COLUMNS.map((col) => {
        const meta = STATUS_META[col];
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className="flex flex-col rounded-xl border bg-surface-subtle/60 p-2.5">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {meta.label}
              </span>
              <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {colTasks.length}
              </span>
            </div>
            <div className="min-h-24 space-y-2">
              {colTasks.map((t) => {
                const overdue = isOverdue(t.due_date, t.status);
                const canStart = onStart && currentUserId && t.assigned_to === currentUserId && t.status === "ready";
                return (
                  <Link
                    key={t.id}
                    to="/tasks/$id"
                    params={{ id: t.id }}
                    className="block rounded-lg border bg-card p-3 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", priorityDot(t.priority))}
                        aria-hidden
                      />
                      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                        {t.title}
                      </p>
                    </div>

                    {(t.project?.name || t.department?.name) && (
                      <p className="mt-1.5 truncate pl-3.5 text-[11px] text-muted-foreground">
                        {t.project?.name ?? t.department?.name}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2 pl-3.5">
                      {showAssignee && t.assigned_profile ? (
                        <span className="flex min-w-0 items-center gap-1.5">
                          <EmployeeAvatar profile={t.assigned_profile} size="sm" />
                          <span className="truncate text-[11px] text-muted-foreground">
                            {t.assigned_profile.name}
                          </span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <span
                        className={cn(
                          "text-[11px] tabular-nums",
                          overdue ? "font-medium text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {t.due_date ? formatDueDate(t.due_date, t.status) : "—"}
                      </span>
                    </div>

                    {canStart && (
                      <Button
                        size="sm"
                        className="mt-2 h-7 w-full text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          onStart(t);
                        }}
                      >
                        <Play className="mr-1 h-3 w-3" aria-hidden />
                        Start
                      </Button>
                    )}
                  </Link>
                );
              })}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-xs text-muted-foreground">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
