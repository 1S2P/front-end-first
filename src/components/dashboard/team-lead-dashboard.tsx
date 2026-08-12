import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, AlertOctagon, Timer } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useDepartmentTasks, usePendingReviews } from "@/lib/api/tasks";
import { useDepartments } from "@/lib/api/admin";

export function TeamLeadDashboard() {
  const { currentUser, currentBrandId } = useApp();
  const deptId = currentUser?.department_id ?? "";
  const { data: deptTasks = [] } = useDepartmentTasks(deptId, currentBrandId);
  const { data: pendingReviews = [] } = usePendingReviews();
  const { data: departments = [] } = useDepartments(currentBrandId);

  if (!currentUser) return null;

  const dept = departments.find((d) => d.id === deptId);
  const today = new Date().toISOString().split("T")[0];
  const activeTasks = deptTasks.filter((t) => t.status !== "completed");
  const overdue = deptTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  );
  const myReviews = pendingReviews.filter((t) => t.department_id === deptId);

  const stats = [
    {
      icon: Users,
      label: "Active dept tasks",
      value: activeTasks.length,
      tone: "bg-primary/10 text-primary",
    },
    {
      icon: ClipboardCheck,
      label: "Pending reviews",
      value: myReviews.length,
      tone: "bg-info/10 text-info",
    },
    {
      icon: AlertOctagon,
      label: "Overdue",
      value: overdue.length,
      tone: "bg-destructive/10 text-destructive",
    },
    {
      icon: Timer,
      label: "Total tasks",
      value: deptTasks.length,
      tone: "bg-success/10 text-success",
    },
  ];

  return (
    <>
      <PageHeader
        title={`${dept?.name ?? "Department"} · Team Lead`}
        description="Visibility across your department."
      />
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {myReviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending reviews</p>
            ) : (
              myReviews.map((t) => (
                <Link
                  key={t.id}
                  to="/tasks/$id"
                  params={{ id: t.id }}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Submitted by {(t as any).assigned_profile?.name ?? "—"}
                    </div>
                  </div>
                  <Badge>Review</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {activeTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active tasks</p>
            ) : (
              activeTasks.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  to="/tasks/$id"
                  params={{ id: t.id }}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Assigned to {(t as any).assigned_profile?.name ?? "—"}
                    </div>
                  </div>
                  <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
