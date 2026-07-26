import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Paperclip, MessageSquare, Clock, FileText, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_shell/tasks/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Task ${params.id} · Danfe × NTE` },
      { name: "description", content: "Task details, checklist, files, and activity." },
      { property: "og:title", content: `Task ${params.id}` },
      { property: "og:description", content: "Task detail view." },
    ],
  }),
  component: TaskDetail,
});

function TaskDetail() {
  const { id } = Route.useParams();
  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild><Link to="/tasks"><ChevronLeft className="mr-1 h-4 w-4" /> Back to tasks</Link></Button>
      </div>
      <PageHeader
        title={`Reconcile tea shipment invoices`}
        description={`${id} · Danfe Tea · Finance`}
        actions={
          <>
            <Button variant="outline">Unsubmit</Button>
            <Button>Submit for review</Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cross-check the September shipment invoices against the warehouse GRNs. Flag mismatches over ±2% and attach a summary sheet for the Team Lead's review.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Checklist</CardTitle>
              <span className="text-xs text-muted-foreground">3 / 5</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                ["Pull GRN reports from warehouse system", true],
                ["Match invoices line-by-line", true],
                ["Flag ±2% variances", true],
                ["Attach summary sheet", false],
                ["Notify vendor of discrepancies", false],
              ].map(([label, done]) => (
                <label key={label as string} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/60">
                  <Checkbox checked={done as boolean} />
                  <span className={done ? "text-muted-foreground line-through" : ""}>{label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Files</CardTitle>
              <Button variant="outline" size="sm"><Paperclip className="mr-1.5 h-4 w-4" />Attach</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { n: "invoices-sept.xlsx", v: "v3", by: "Pratik" },
                { n: "grn-report.pdf", v: "v1", by: "Warehouse" },
              ].map((f) => (
                <div key={f.n} className="flex items-center gap-3 rounded-md border border-border/60 p-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{f.n}</div>
                    <div className="text-xs text-muted-foreground">Uploaded by {f.by}</div>
                  </div>
                  <Badge variant="secondary">{f.v}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Comments</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">SI</AvatarFallback></Avatar>
                <div className="flex-1 rounded-lg bg-muted/60 p-3 text-sm">
                  <div className="mb-1 flex justify-between"><span className="font-medium">Sita</span><span className="text-xs text-muted-foreground">2h ago</span></div>
                  Please double-check the Kanchan Estate line — the unit price looks off.
                </div>
              </div>
              <Separator />
              <Textarea placeholder="Write a comment…" />
              <div className="flex justify-end"><Button size="sm">Comment</Button></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Status"><Badge>In Progress</Badge></Row>
              <Row label="Priority"><Badge variant="destructive">High</Badge></Row>
              <Row label="Deadline">Today, 6:00 PM</Row>
              <Row label="Approver">Sita Rana</Row>
              <Row label="Workflow">Monthly finance close</Row>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {[
                "Pratik uploaded invoices-sept.xlsx v3 · 1h ago",
                "Sita commented · 2h ago",
                "Pratik started the task · yesterday",
                "Task assigned by Team Lead · Mon",
              ].map((a) => (
                <div key={a} className="border-l-2 border-primary/40 pl-3">{a}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
