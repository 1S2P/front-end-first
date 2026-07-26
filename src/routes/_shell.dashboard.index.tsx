import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ListTodo, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_shell/dashboard/")({
  head: () => ({
    meta: [
      { title: "My Dashboard · Danfe × NTE" },
      { name: "description", content: "Your tasks, notifications, and week at a glance." },
      { property: "og:title", content: "Employee Dashboard" },
      { property: "og:description", content: "Personal workflow dashboard." },
    ],
  }),
  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  return (
    <>
      <PageHeader
        title="Good morning, Pratik"
        description="Here's what needs your attention today."
        actions={<Button asChild><Link to="/tasks">Open my tasks</Link></Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ListTodo} label="Assigned to me" value="12" tone="text-primary bg-primary/10" />
        <Stat icon={Clock} label="Due today" value="3" tone="text-warning-foreground bg-warning/30" />
        <Stat icon={AlertTriangle} label="Overdue" value="1" tone="text-destructive bg-destructive/10" />
        <Stat icon={CheckCircle2} label="Completed this week" value="8" tone="text-success bg-success/10" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Due today</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/tasks">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { t: "Reconcile tea shipment invoices", dep: "Finance", prog: 60 },
              { t: "Post weekly product photos", dep: "Marketing", prog: 20 },
              { t: "Approve packaging redesign v3", dep: "Design", prog: 90 },
            ].map((x) => (
              <div key={x.t} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{x.t}</div>
                  <Badge variant="secondary">{x.dep}</Badge>
                </div>
                <Progress value={x.prog} className="mt-3 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Approval requested by Sita on 'Q3 sourcing plan'",
              "Meera left a comment on 'Site redesign'",
              "Task 'Vendor onboarding' is due tomorrow",
            ].map((n) => (
              <div key={n} className="rounded-md border border-border/60 p-3 text-muted-foreground">{n}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
