import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { CheckCircle2, Clock, ListChecks, AlertTriangle } from "lucide-react";
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

const CHART_CONFIG = {
  completed: { label: "Completed", color: "var(--chart-3)" },
  pending: { label: "In flight", color: "var(--chart-1)" },
  review: { label: "Awaiting review", color: "var(--chart-2)" },
  done: { label: "Completed", color: "var(--chart-3)" },
  remaining: { label: "In flight", color: "var(--chart-1)" },
} as const;

function Reports() {
  const { currentBrandId } = useApp();
  const { data: brands = [] } = useBrands();
  const brand = brands.find((b) => b.id === currentBrandId);
  const { data: reportStats, isLoading } = useReportStats(currentBrandId);
  const { data: brandProjects = [] } = useProjects(currentBrandId);
  const { data: brandWorkflows = [] } = useWorkflowTemplates(currentBrandId);
  const { data: departments = [] } = useDepartments(currentBrandId);

  const completion = reportStats
    ? [
        { key: "done", name: "Completed", value: reportStats.completed },
        { key: "remaining", name: "In flight", value: reportStats.pending },
      ]
    : [];
  const completionPct =
    reportStats && reportStats.total > 0
      ? Math.round((reportStats.completed / reportStats.total) * 100)
      : 0;

  const deptData = departments.map((d) => {
    const ds = reportStats?.byDepartment?.[d.id] ?? { total: 0, completed: 0 };
    return {
      department: d.name.length > 14 ? `${d.name.slice(0, 12)}…` : d.name,
      completed: ds.completed,
      pending: Math.max(ds.total - ds.completed, 0),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Reports & Analytics"
        description={`Performance overview for ${brand?.name ?? "all brands"}`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading reports…
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Completed"
              value={reportStats?.completed ?? 0}
              icon={CheckCircle2}
              tone="success"
              hint={`${reportStats?.total ?? 0} total tasks`}
            />
            <KpiCard
              label="In Flight"
              value={reportStats?.pending ?? 0}
              icon={ListChecks}
              tone="primary"
              hint="active work items"
            />
            <KpiCard
              label="Awaiting Review"
              value={reportStats?.waitingReview ?? 0}
              icon={Clock}
              tone="info"
              hint="need attention"
            />
            <KpiCard
              label="Overdue"
              value={reportStats?.overdue ?? 0}
              icon={AlertTriangle}
              tone={reportStats && reportStats.overdue > 0 ? "danger" : "default"}
              hint={reportStats && reportStats.overdue > 0 ? "Needs attention" : "All clear"}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {/* Completion mix */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Task Mix</CardTitle>
              </CardHeader>
              <CardContent>
                {completion.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  <>
                    <ChartContainer config={CHART_CONFIG} className="aspect-square max-h-56">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={completion}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {completion.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={`var(--color-${entry.key})`}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-center">
                      <div className="text-2xl font-semibold tabular-nums">
                        {completionPct}%
                      </div>
                      <div className="text-xs text-muted-foreground">completion rate</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Department performance */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {deptData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No departments</p>
                ) : (
                  <ChartContainer config={CHART_CONFIG} className="aspect-[4/3] max-h-64">
                    <BarChart data={deptData} barSize={18}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="department"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                      />
                      <YAxis tickLine={false} axisLine={false} width={28} fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
