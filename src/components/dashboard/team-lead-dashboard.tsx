import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, AlertOctagon, Timer, type LucideIcon } from "lucide-react";
import { StatCard, type StatTone } from "@/components/dashboard/stat-card";
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
  const myReviews = pendingReviews.filter((t) => t.approver_id === currentUser.id);

  const stats: {
    icon: LucideIcon;
    label: string;
    value: number;
    tone: StatTone;
  }[] = [
    {
      icon: Users,
      label: "Active dept tasks",
      value: activeTasks.length,
      tone: "primary",
    },
    {
      icon: ClipboardCheck,
      label: "Pending reviews",
      value: myReviews.length,
      tone: "info",
    },
    {
      icon: AlertOctagon,
      label: "Overdue",
      value: overdue.length,
      tone: overdue.length > 0 ? "destructive" : "default",
    },
    {
      icon: Timer,
      label: "Total tasks",
      value: deptTasks.length,
      tone: "success",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={`${dept?.name ?? "Department"} · Team Lead`}
        description="Visibility across your department."
      />
      <section
        aria-label="Department statistics"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
        ))}
      </section>

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
    </div>
  );
}
