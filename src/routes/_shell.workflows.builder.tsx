import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Share2 } from "lucide-react";

export const Route = createFileRoute("/_shell/workflows/builder")({
  head: () => ({
    meta: [
      { title: "Workflow Builder · Danfe × NTE" },
      { name: "description", content: "Design multi-step workflows with dependencies and approvals." },
      { property: "og:title", content: "Workflow Builder" },
      { property: "og:description", content: "Visual step-based workflow editor." },
    ],
  }),
  component: WorkflowBuilder,
});

const steps = [
  { n: 1, name: "Draft brief", dep: "Marketing", role: "Employee", approval: false },
  { n: 2, name: "Legal review", dep: "Legal", role: "Employee", approval: true },
  { n: 3, name: "Design assets", dep: "Design", role: "Employee", approval: false },
  { n: 4, name: "Approval — Head of Brand", dep: "Marketing", role: "Team Lead", approval: true },
];

function WorkflowBuilder() {
  return (
    <>
      <PageHeader
        title="Untitled workflow"
        description="Draft · autosaved just now"
        actions={
          <>
            <Button variant="outline"><Share2 className="mr-1.5 h-4 w-4" />Share</Button>
            <Button>Publish</Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Steps</CardTitle>
            <Button variant="outline" size="sm"><Plus className="mr-1.5 h-4 w-4" />Add step</Button>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl border border-dashed border-border bg-muted/30 p-6">
              <div className="space-y-3">
                {steps.map((s, i) => (
                  <div key={s.n} className="relative">
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">{s.n}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{s.name}</div>
                          {s.approval && <Badge variant="secondary">Approval</Badge>}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{s.dep} · {s.role}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="my-2 flex items-center justify-center">
                        <div className="h-6 w-px bg-border" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit sticky top-24">
          <CardHeader><CardTitle className="text-base">Step properties</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Step name"><Input defaultValue="Legal review" /></Field>
            <Field label="Description"><Textarea rows={3} placeholder="What happens in this step?" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department">
                <Select defaultValue="legal"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="ops">Operations</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Owner role">
                <Select defaultValue="employee"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="lead">Team Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Assign to (optional)"><Input placeholder="Specific person…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SLA (hrs)"><Input type="number" defaultValue={24} /></Field>
              <Field label="Default due"><Input placeholder="+2 days" /></Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Requires approval</div>
                <div className="text-xs text-muted-foreground">Approver role must sign off before next step.</div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
