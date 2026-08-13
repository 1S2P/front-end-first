import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, ArrowRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-context";
import { useWorkflowStatusBoard } from "@/lib/api/workflows";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/workflows/status")({
  head: () => ({
    meta: [{ title: "Where's it at? · Danfe x NTE" }],
  }),
  component: WorkflowStatusBoard,
});

function formatHeldTime(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1d" : `${days}d`;
}

function WorkflowStatusBoard() {
  const { currentBrandId } = useApp();
  const { data: rows = [], isLoading } = useWorkflowStatusBoard(currentBrandId);
  const [deptFilter, setDeptFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const departments = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) if (r.department_name) seen.add(r.department_name);
    return Array.from(seen).sort();
  }, [rows]);

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.assigned_to) map.set(r.assigned_to, r.assignee_name ?? "—");
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = rows.filter(
    (r) =>
      (deptFilter === "all" || r.department_name === deptFilter) &&
      (assigneeFilter === "all" || r.assigned_to === assigneeFilter),
  );

  const overdueCount = rows.filter((r) => r.is_overdue).length;

  return (
    <>
      <PageHeader
        title="Where's it at?"
        description="Every running workflow, the step it's on, and who currently holds it."
      />
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading status board…
        </div>
      ) : rows.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <Activity className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-medium">No workflows currently running</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Running workflows will show up here as soon as they start.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto">
              {filtered.length} running{overdueCount > 0 ? ` · ${overdueCount} stuck` : ""}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <Link
                key={r.instance_id}
                to="/tasks/$id"
                params={{ id: r.task_id }}
                className="group block"
              >
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{r.workflow_name}</h3>
                        <p className="truncate text-xs text-muted-foreground">{r.project_name}</p>
                      </div>
                      {r.is_overdue ? (
                        <Badge variant="destructive">Stuck</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-700 dark:text-green-400">
                          On track
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Step {r.step_order + 1} of {r.total_steps} —{" "}
                      <span className="text-foreground">
                        {r.current_step_name ?? "Current step"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatHeldTime(r.hours_in_step)}</span>
                      <span className="text-muted-foreground">in this step</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t pt-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={cn("text-xs", r.assignee_avatar_color)}>
                          {r.assignee_initials ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">{r.assignee_name ?? "Unassigned"}</span>
                      {r.department_name && (
                        <Badge variant="secondary" className="ml-auto">
                          {r.department_name}
                        </Badge>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
