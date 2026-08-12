import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  useMyTasks,
  useDepartmentTasks,
  usePendingReviews,
  useReassignedTasks,
} from "@/lib/api/tasks";
import { useDepartments } from "@/lib/api/admin";
import { TASK_STATUS_LABELS, BOARD_COLUMNS, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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

const STATUS_STYLES: Record<TaskStatus, string> = {
  ready: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  waiting_review: "bg-purple-50 text-purple-700 border-purple-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-gray-50 text-gray-500 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  needs_revision: "bg-orange-50 text-orange-700 border-orange-200",
};

const BOARD_COLUMN_CONFIG: Record<TaskStatus, { label: string; bg: string; dot: string }> = {
  ready: { label: "Ready", bg: "bg-blue-50/50", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", bg: "bg-amber-50/50", dot: "bg-amber-500" },
  waiting_review: { label: "In Review", bg: "bg-purple-50/50", dot: "bg-purple-500" },
  approved: { label: "Approved", bg: "bg-emerald-50/50", dot: "bg-emerald-500" },
  completed: { label: "Completed", bg: "bg-gray-50/50", dot: "bg-gray-400" },
  rejected: { label: "Rejected", bg: "bg-red-50/50", dot: "bg-red-500" },
  needs_revision: { label: "Needs Revision", bg: "bg-orange-50/50", dot: "bg-orange-500" },
};

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
  const [activeTab, setActiveTab] = useState<"my" | "dept" | "reviews" | "reassigned">("my");
  const { currentUser, currentBrandId, currentRole } = useApp();
  const { data: myTasks = [], isLoading } = useMyTasks(currentBrandId);
  const { data: pendingReviews = [] } = usePendingReviews();
  const { data: reassignedTasks = [] } = useReassignedTasks();
  const { data: departments = [] } = useDepartments(currentBrandId);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading tasks…
      </div>
    );
  }

  const canSeeDept = currentRole === "admin" || currentRole === "team_lead";

  const deptTasks =
    activeTab === "dept" && canSeeDept
      ? pendingReviews.filter((t) => t.department_id === currentUser.department_id)
      : [];

  const today = new Date().toISOString().split("T")[0];
  const dueToday = myTasks.filter((t) => t.due_date === today && t.status !== "completed");

  const dept = departments.find((d) => d.id === currentUser.department_id);

  const getDisplayTasks = () => {
    switch (activeTab) {
      case "reviews":
        return pendingReviews;
      case "dept":
        return deptTasks;
      case "reassigned":
        return reassignedTasks.filter((t) => t.status === "needs_revision");
      default:
        return myTasks;
    }
  };

  const displayTasks = getDisplayTasks();

  return (
    <>
      <PageHeader
        title={
          activeTab === "reviews"
            ? "Pending Reviews"
            : activeTab === "dept"
              ? `${dept?.name || "Department"} Tasks`
              : activeTab === "reassigned"
                ? "Re-assigned Tasks"
                : "My Tasks"
        }
        description={
          activeTab === "reviews"
            ? "Tasks waiting for your review."
            : activeTab === "dept"
              ? `All tasks in ${dept?.name || "your department"}.`
              : activeTab === "reassigned"
                ? "Tasks sent back by reviewers for rework."
                : "View and manage your assigned tasks."
        }
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
        onValueChange={(v) => setActiveTab(v as "my" | "dept" | "reviews" | "reassigned")}
      >
        <TabsList>
          <TabsTrigger value="my">My Tasks</TabsTrigger>
          {canSeeDept && <TabsTrigger value="dept">Department</TabsTrigger>}
          {canSeeDept && (
            <TabsTrigger value="reviews">
              Pending Reviews
              {pendingReviews.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] h-5 px-1.5">
                  {pendingReviews.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="reassigned">
            Re-assigned
            {reassignedTasks.filter((t) => t.status === "needs_revision").length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">
                {reassignedTasks.filter((t) => t.status === "needs_revision").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="my" className="mt-4">
          {isLoading ? (
            <LoadingState />
          ) : view === "board" ? (
            <BoardView tasks={myTasks} showAssignee={false} />
          ) : (
            <ListView tasks={myTasks} showAssignee={false} />
          )}
        </TabsContent>
        {canSeeDept && (
          <TabsContent value="dept" className="mt-4">
            {view === "board" ? (
              <BoardView tasks={deptTasks} showAssignee={true} />
            ) : (
              <ListView tasks={deptTasks} showAssignee={true} />
            )}
          </TabsContent>
        )}
        {canSeeDept && (
          <TabsContent value="reviews" className="mt-4">
            {view === "board" ? (
              <BoardView tasks={pendingReviews} showAssignee={true} />
            ) : (
              <ListView tasks={pendingReviews} showAssignee={true} />
            )}
          </TabsContent>
        )}
        <TabsContent value="reassigned" className="mt-4">
          <ListView
            tasks={reassignedTasks.filter((t) => t.status === "needs_revision")}
            showAssignee={canSeeDept}
          />
        </TabsContent>
        <TabsContent value="today" className="mt-4">
          <ListView tasks={dueToday} showAssignee={canSeeDept} />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <ListView
            tasks={myTasks.filter((t) => t.status === "completed")}
            showAssignee={canSeeDept}
          />
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

function ListView({ tasks, showAssignee }: { tasks: SupabaseTask[]; showAssignee: boolean }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              {showAssignee && <TableHead>Assignee</TableHead>}
              <TableHead>Department</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <Link to="/tasks/$id" params={{ id: t.id }} className="hover:underline">
                    {t.title}
                  </Link>
                </TableCell>
                {showAssignee && (
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {t.assigned_profile && (
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-semibold text-primary">
                          {t.assigned_profile.initials}
                        </div>
                      )}
                      <span>{t.assigned_profile?.name ?? "—"}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{t.department?.name ?? "—"}</TableCell>
                <TableCell>{t.due_date ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      t.priority === "high"
                        ? "destructive"
                        : t.priority === "medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {t.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", STATUS_STYLES[t.status])}>
                    {TASK_STATUS_LABELS[t.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showAssignee ? 6 : 5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BoardView({ tasks, showAssignee }: { tasks: SupabaseTask[]; showAssignee: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {BOARD_COLUMNS.map((col) => {
        const config = BOARD_COLUMN_CONFIG[col];
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className={cn("rounded-xl p-3", config.bg)}>
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className={cn("h-2.5 w-2.5 rounded-full", config.dot)} />
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {config.label}
              </div>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {colTasks.length}
              </Badge>
            </div>
            <div className="min-h-32 space-y-2">
              {colTasks.map((t) => (
                <Link
                  key={t.id}
                  to="/tasks/$id"
                  params={{ id: t.id }}
                  className="block rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-colors hover:border-primary/50 hover:shadow-md"
                >
                  <div className="text-sm font-medium leading-snug">{t.title}</div>
                  {showAssignee && t.assigned_profile && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-semibold text-primary">
                        {t.assigned_profile.initials}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {t.assigned_profile.name}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.department?.name}</span>
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
                  </div>
                  <div className="mt-1.5 text-[10px] text-muted-foreground">
                    Due {t.due_date ?? "—"}
                  </div>
                </Link>
              ))}
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
