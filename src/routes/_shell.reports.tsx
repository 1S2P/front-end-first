import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useReportStats, useProjects, useBrands } from "@/lib/api/admin";
import { useWorkflowTemplates } from "@/lib/api/workflows";
import { useDepartments } from "@/lib/api/admin";

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics · Danfe x NTE" },
      { name: "description", content: "Performance analytics and reports." },
      { property: "og:title", content: "Reports & Analytics" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { currentBrandId } = useApp();
  const { data: brands = [] } = useBrands();
  const brand = brands.find((b) => b.id === currentBrandId);
  const { data: reportStats, isLoading } = useReportStats(currentBrandId);
  const { data: brandProjects = [] } = useProjects(currentBrandId);
  const { data: brandWorkflows = [] } = useWorkflowTemplates(currentBrandId);
  const { data: departments = [] } = useDepartments(currentBrandId);

  const stats = reportStats
    ? [
        {
          label: "Completed Tasks",
          value: reportStats.completed,
          change: `${reportStats.total} total`,
          up: true,
        },
        {
          label: "Pending Tasks",
          value: reportStats.pending,
          change: `${reportStats.waitingReview} awaiting review`,
          up: false,
        },
        {
          label: "Overdue Tasks",
          value: reportStats.overdue,
          change: reportStats.overdue > 0 ? "Needs attention" : "All clear",
          up: false,
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description={`Performance overview for ${brand?.name ?? "all brands"}`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading reports…
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-3xl font-semibold">{s.value}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    {s.up ? <TrendingUp className="h-3 w-3 text-success" /> : null}
                    {s.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Department Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {departments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No departments</p>
                ) : (
                  departments.map((d) => {
                    const deptStats = reportStats?.byDepartment?.[d.id] ?? {
                      total: 0,
                      completed: 0,
                    };
                    const pct =
                      deptStats.total > 0
                        ? Math.round((deptStats.completed / deptStats.total) * 100)
                        : 0;
                    return (
                      <div key={d.id}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium">{d.name}</span>
                          <span className="text-muted-foreground">
                            {deptStats.completed} completed · {deptStats.total - deptStats.completed}{" "}
                            pending
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Workflow Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workflow Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {brandWorkflows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No workflows yet</p>
                ) : (
                  brandWorkflows.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-md border border-border/60 p-3"
                    >
                      <div>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(w as any).workflow_steps?.length ?? 0} steps · Used {w.usage_count}{" "}
                          times
                        </div>
                      </div>
                      <Badge variant="secondary">{w.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Project Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {brandProjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No projects yet</p>
                ) : (
                  brandProjects.map((p) => (
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
          </div>
        </>
      )}
    </>
  );
}
