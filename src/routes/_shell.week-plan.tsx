import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat } from "lucide-react";

export const Route = createFileRoute("/_shell/week-plan")({
  head: () => ({
    meta: [
      { title: "Week Plan · Danfe × NTE" },
      { name: "description", content: "Drag workflows and tasks onto the week." },
      { property: "og:title", content: "Week Plan" },
      { property: "og:description", content: "Weekly planning board." },
    ],
  }),
  component: WeekPlan,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const plan: Record<string, { t: string; tag: string }[]> = {
  Mon: [{ t: "Kickoff — Q4 campaign", tag: "Marketing" }, { t: "Vendor call", tag: "Ops" }],
  Tue: [{ t: "Finance close start", tag: "Finance" }],
  Wed: [{ t: "Design review", tag: "Design" }, { t: "Warehouse audit", tag: "Ops" }],
  Thu: [{ t: "Legal review", tag: "Legal" }],
  Fri: [{ t: "Weekly retro", tag: "Team" }],
  Sat: [],
  Sun: [],
};

function WeekPlan() {
  return (
    <>
      <PageHeader
        title="Week Plan"
        description="Oct 21 – Oct 27"
        actions={
          <>
            <Select defaultValue="all"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                <SelectItem value="ops">Operations</SelectItem>
                <SelectItem value="mkt">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Repeat className="mr-1.5 h-4 w-4" />Recurring</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((d) => (
          <div key={d} className="min-h-[300px] rounded-xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">{d}</div>
              <Badge variant="secondary" className="text-[10px]">{plan[d]?.length ?? 0}</Badge>
            </div>
            <div className="space-y-2">
              {plan[d]?.map((p) => (
                <div key={p.t} className="cursor-grab rounded-md border border-border/70 bg-muted/40 p-2.5 text-xs">
                  <div className="font-medium">{p.t}</div>
                  <div className="mt-1 text-muted-foreground">{p.tag}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
