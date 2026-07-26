import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ClipboardCheck, AlertOctagon, Gauge } from "lucide-react";

export const Route = createFileRoute("/_shell/team-queue")({
  head: () => ({
    meta: [
      { title: "Team Queue · Danfe × NTE" },
      { name: "description", content: "Department-wide task queue for Team Leads." },
      { property: "og:title", content: "Team Queue" },
      { property: "og:description", content: "Review, reassign and monitor team tasks." },
    ],
  }),
  component: TeamQueue,
});

const columns = ["To Do", "In Progress", "In Review", "Needs Redo", "Completed"];
const cards = [
  { t: "Vendor MSA v2", who: "Aakash", status: "In Review" },
  { t: "October campaign brief", who: "Sneha", status: "In Progress" },
  { t: "Warehouse audit checklist", who: "Ravi", status: "In Review" },
  { t: "Shipping SOP update", who: "Meera", status: "To Do" },
  { t: "Q3 finance close", who: "Pratik", status: "Needs Redo" },
  { t: "Store training deck", who: "Sneha", status: "Completed" },
];

function TeamQueue() {
  return (
    <>
      <PageHeader title="Team Queue" description="Operations department · all tasks" />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Widget icon={Users} label="Team members" value="8" />
        <Widget icon={ClipboardCheck} label="Pending reviews" value="3" />
        <Widget icon={AlertOctagon} label="Delayed" value="2" />
        <Widget icon={Gauge} label="On-time rate" value="86%" />
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {columns.map((col) => (
          <div key={col} className="rounded-xl bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col}</div>
              <Badge variant="secondary">{cards.filter((c) => c.status === col).length}</Badge>
            </div>
            <div className="space-y-2">
              {cards.filter((c) => c.status === col).map((c) => (
                <div key={c.t} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <div className="text-sm font-medium">{c.t}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{c.who.slice(0, 2)}</AvatarFallback></Avatar>
                      <span className="text-xs text-muted-foreground">{c.who}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">Reassign</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Widget({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card><CardContent className="flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent></Card>
  );
}
