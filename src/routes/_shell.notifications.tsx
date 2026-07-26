import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, MessageSquare, AlertTriangle, Workflow, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_shell/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Danfe × NTE" },
      { name: "description", content: "All alerts across your tasks and workflows." },
      { property: "og:title", content: "Notifications" },
      { property: "og:description", content: "Team notification feed." },
    ],
  }),
  component: Notifications,
});

const items = [
  { icon: ClipboardCheck, tone: "text-info bg-info/10", type: "Approval requested", t: "Sita asked you to review 'Q3 sourcing plan'", ago: "5m" },
  { icon: MessageSquare, tone: "text-primary bg-primary/10", type: "Comment", t: "Meera commented on 'Site redesign'", ago: "1h" },
  { icon: AlertTriangle, tone: "text-destructive bg-destructive/10", type: "Overdue", t: "'Vendor onboarding' is overdue by 1 day", ago: "3h" },
  { icon: CheckCircle2, tone: "text-success bg-success/10", type: "Approved", t: "'Packaging redesign v2' approved by Aakash", ago: "yesterday" },
  { icon: Workflow, tone: "text-accent-foreground bg-accent", type: "Workflow started", t: "'Monthly finance close' started for October", ago: "yesterday" },
  { icon: Bell, tone: "text-warning-foreground bg-warning/30", type: "Due soon", t: "'Weekly retro' is due tomorrow", ago: "2d" },
];

function Notifications() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Scoped to your department. Admins see everything."
        actions={<Button variant="outline">Mark all as read</Button>}
      />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {items.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-4 hover:bg-muted/40">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${n.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                    <span className="text-xs text-muted-foreground">{n.ago} ago</span>
                  </div>
                  <div className="mt-1 text-sm">{n.t}</div>
                </div>
                <Button variant="ghost" size="sm">Open</Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
