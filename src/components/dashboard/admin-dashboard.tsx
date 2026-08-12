import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Workflow, Activity, FolderOpen, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useProjects } from "@/lib/api/admin";
import { useWorkflowTemplates, useWorkflowInstances } from "@/lib/api/workflows";
import { useMyTasks } from "@/lib/api/tasks";

export function AdminDashboard() {
  const { currentBrandId } = useApp();
  const { data: brandProjects = [] } = useProjects(currentBrandId);
  const { data: brandWorkflows = [] } = useWorkflowTemplates(currentBrandId);
  const { data: runningInstances = [] } = useWorkflowInstances(currentBrandId);
  const { data: allTasks = [] } = useMyTasks(currentBrandId);

  const runningWorkflows = runningInstances.filter((w) => w.status === "running");
  const pendingReviews = allTasks.filter((t) => t.status === "waiting_review");
  const today = new Date().toISOString().split("T")[0];
  const overdue = allTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  );

  const stats = [
    {
      icon: FolderOpen,
      label: "Projects",
      value: brandProjects.length,
      tone: "bg-primary/10 text-primary",
    },
    {
      icon: Workflow,
      label: "Running Workflows",
      value: runningWorkflows.length,
      tone: "bg-success/10 text-success",
    },
    {
      icon: Activity,
      label: "Pending Reviews",
      value: pendingReviews.length,
      tone: "bg-warning/15 text-warning-foreground",
    },
    {
      icon: Activity,
      label: "Overdue Tasks",
      value: overdue.length,
      tone: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Everything across your workspace." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold leading-none">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Shortcut
          to="/projects"
          title="Manage Projects"
          body="Create and manage project containers for workflows."
        />
        <Shortcut
          to="/workflows"
          title="Workflow Library"
          body="Design and manage reusable workflow templates."
        />
        <Shortcut
          to="/admin/employees"
          title="Employees"
          body="Assign people to brands and departments."
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {brandProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No projects yet</p>
            ) : (
              brandProjects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                  <Badge variant={p.status === "active" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Running Workflows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {runningWorkflows.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No running workflows</p>
            ) : (
              runningWorkflows.map((wi) => {
                const template = brandWorkflows.find((w) => w.id === wi.template_id);
                return (
                  <div
                    key={wi.id}
                    className="flex items-center justify-between rounded-md border border-border/60 p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {(wi as any).workflow_templates?.name || template?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Step {(wi.current_step_index ?? 0) + 1}
                      </div>
                    </div>
                    <Badge variant="outline">{wi.status}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Shortcut({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Card className="group cursor-pointer transition-colors hover:border-primary/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{body}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={to}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
