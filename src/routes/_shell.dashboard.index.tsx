import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare } from "lucide-react";

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

const stats = [
  { label: "Assigned to me", value: "12", accent: true },
  { label: "Due today", value: "3", accent: false },
  { label: "Overdue", value: "1", accent: false },
  { label: "Done this week", value: "8", accent: false },
];

const dueToday = [
  { id: "T-101", title: "Reconcile tea shipment invoices", meta: "Finance · Danfe Tea", tag: "Urgent", urgent: true },
  { id: "T-102", title: "Post weekly product photos", meta: "Marketing · Danfe Tea", tag: "2:00 PM", urgent: false },
  { id: "T-103", title: "Approve packaging redesign v3", meta: "Design · NTE", tag: "Tomorrow", urgent: false },
];

const activity = [
  { icon: Clock, text: "Sita requested approval on Q3 sourcing plan", time: "12 mins ago", tone: "primary" as const },
  { icon: MessageSquare, text: "Meera left a comment on Site redesign", time: "45 mins ago", tone: "accent" as const },
];

function EmployeeDashboard() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Morning, Pratik</h1>
        <p className="mt-1 text-sm text-muted-foreground">You have 3 tasks to complete today.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <span className={`mt-1 block text-2xl font-bold ${s.accent ? "text-primary" : "text-foreground"}`}>
                  {s.value}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-semibold">Due today</h2>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link to="/tasks">View all</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {dueToday.map((t) => (
            <Link
              key={t.id}
              to="/tasks/$id"
              params={{ id: t.id }}
              className={`flex items-center justify-between gap-3 rounded-2xl border-l-4 bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 ${
                t.urgent ? "border-l-destructive" : "border-l-primary"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.meta}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                  t.urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                }`}
              >
                {t.tag}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        <div className="space-y-4">
          {activity.map((a) => (
            <div key={a.text} className="flex gap-3">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  a.tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                }`}
              >
                <a.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm">{a.text}</p>
                <p className="text-[10px] text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
