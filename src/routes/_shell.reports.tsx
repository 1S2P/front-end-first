import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics · Danfe × NTE" },
      { name: "description", content: "SLA, throughput, and team performance analytics." },
      { property: "og:title", content: "Reports & Analytics" },
      { property: "og:description", content: "Cross-brand analytics." },
    ],
  }),
  component: Reports,
});

function Reports() {
  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Cross-brand performance over time."
        actions={
          <>
            <Select defaultValue="30"><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Download className="mr-1.5 h-4 w-4" />Export</Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { l: "Completed", v: "142", d: "+18% vs last period" },
          { l: "Pending", v: "36", d: "12 due this week" },
          { l: "Delayed", v: "9", d: "SLA breach 6%" },
          { l: "Avg. completion", v: "2.3d", d: "-0.4d vs last" },
        ].map((s) => (
          <Card key={s.l}>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-3xl font-semibold">{s.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Brand comparison</CardTitle></CardHeader>
          <CardContent>
            {[
              { n: "Danfe Tea", pct: 82 },
              { n: "Nepal Tea Exchange", pct: 74 },
            ].map((b) => (
              <div key={b.n} className="mb-3">
                <div className="mb-1 flex justify-between text-sm"><span>{b.n}</span><span className="text-muted-foreground">{b.pct}% on-time</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${b.pct}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Workflow performance</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { n: "Monthly finance close", d: "2.1d avg · 94% SLA" },
              { n: "Vendor onboarding", d: "4.5d avg · 71% SLA" },
              { n: "Campaign launch", d: "6.8d avg · 82% SLA" },
            ].map((w) => (
              <div key={w.n} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div className="font-medium">{w.n}</div>
                <Badge variant="secondary">{w.d}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
