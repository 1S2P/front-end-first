import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, AlertOctagon, Timer } from "lucide-react";

export const Route = createFileRoute("/_shell/dashboard/team-lead")({
  head: () => ({
    meta: [
      { title: "Team Lead Dashboard · Danfe × NTE" },
      { name: "description", content: "Team tasks, pending reviews, delayed items, and performance." },
      { property: "og:title", content: "Team Lead Dashboard" },
      { property: "og:description", content: "Oversight for the whole department." },
    ],
  }),
  component: TeamLeadDashboard,
});

function TeamLeadDashboard() {
  return (
    <>
      <PageHeader title="Operations · Team Lead" description="Visibility across your department." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Active team tasks" value="34" tone="bg-primary/10 text-primary" />
        <Stat icon={ClipboardCheck} label="Pending reviews" value="7" tone="bg-info/10 text-info" />
        <Stat icon={AlertOctagon} label="Delayed" value="4" tone="bg-destructive/10 text-destructive" />
        <Stat icon={Timer} label="Avg. cycle time" value="2.4d" tone="bg-success/10 text-success" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Pending reviews</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { t: "Vendor MSA v2", who: "Aakash" },
              { t: "October campaign brief", who: "Sneha" },
              { t: "Warehouse audit checklist", who: "Ravi" },
            ].map((r) => (
              <div key={r.t} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <div className="font-medium">{r.t}</div>
                  <div className="text-xs text-muted-foreground">Submitted by {r.who}</div>
                </div>
                <Badge>Review</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Team performance (7d)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                { n: "Aakash", pct: 92 },
                { n: "Sneha", pct: 78 },
                { n: "Ravi", pct: 64 },
                { n: "Meera", pct: 88 },
              ].map((p) => (
                <div key={p.n}>
                  <div className="mb-1 flex justify-between text-xs"><span>{p.n}</span><span className="text-muted-foreground">{p.pct}% on-time</span></div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} /></div>
                </div>
              ))}
            </div>
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
