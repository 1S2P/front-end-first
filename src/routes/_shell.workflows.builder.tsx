import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Share2, GripVertical } from "lucide-react";
import { DndProvider, Draggable, DropZone } from "@/components/dnd";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/workflows/builder")({
  head: () => ({
    meta: [
      { title: "Workflow Builder · Danfe × NTE" },
      { name: "description", content: "Design multi-step workflows with drag-and-drop step ordering." },
      { property: "og:title", content: "Workflow Builder" },
      { property: "og:description", content: "Visual step-based workflow editor with drag-and-drop." },
    ],
  }),
  component: WorkflowBuilder,
});

type Step = { id: string; name: string; dep: string; role: string; approval: boolean };

const initialSteps: Step[] = [
  { id: "s1", name: "Draft brief", dep: "Marketing", role: "Employee", approval: false },
  { id: "s2", name: "Legal review", dep: "Legal", role: "Employee", approval: true },
  { id: "s3", name: "Design assets", dep: "Design", role: "Employee", approval: false },
  { id: "s4", name: "Approval — Head of Brand", dep: "Marketing", role: "Team Lead", approval: true },
];

function WorkflowBuilder() {
  const [steps, setSteps] = useState<Step[]>(initialSteps);

  const reorder = (dragId: string, targetIndex: number) => {
    setSteps((prev) => {
      const from = prev.findIndex((s) => s.id === dragId);
      if (from === -1 || from === targetIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(from < targetIndex ? targetIndex - 1 : targetIndex, 0, moved);
      toast.success(`“${moved.name}” reordered`);
      return next;
    });
  };

  const remove = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const duplicate = (id: string) =>
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i === -1) return prev;
      const copy = { ...prev[i], id: `${prev[i].id}-${Date.now()}`, name: `${prev[i].name} (copy)` };
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });
  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, name: "New step", dep: "Operations", role: "Employee", approval: false },
    ]);

  return (
    <>
      <PageHeader
        title="Untitled workflow"
        description="Draft · drag steps by the handle to reorder them"
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
            <Button variant="outline" size="sm" onClick={addStep}><Plus className="mr-1.5 h-4 w-4" />Add step</Button>
          </CardHeader>
          <CardContent>
            <DndProvider>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:p-6">
                {steps.map((s, i) => (
                  <div key={s.id}>
                    <DropZone onDrop={(id) => reorder(id, i)} className="h-3" activeClassName="bg-primary/25" />
                    <Draggable id={s.id}>
                      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                        <GripVertical className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{s.name}</div>
                            {s.approval && <Badge variant="secondary">Approval</Badge>}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{s.dep} · {s.role}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(s.id)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </Draggable>
                  </div>
                ))}
                <DropZone onDrop={(id) => reorder(id, steps.length)} className="h-6" activeClassName="bg-primary/25" />
              </div>
            </DndProvider>
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
