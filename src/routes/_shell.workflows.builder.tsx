import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ArrowDown,
  CheckCircle2,
  Play,
} from "lucide-react";
import { useApp, useRequirePermission } from "@/lib/app-context";
import { useDepartments, useProfiles } from "@/lib/api/admin";
import { useSaveWorkflowTemplate, useWorkflowTemplate } from "@/lib/api/workflows";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/workflows/builder")({
  validateSearch: (search: Record<string, unknown>) => ({
    templateId: (search.templateId as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Workflow Builder · Danfe x NTE" },
      { name: "description", content: "Visual drag-and-drop workflow builder." },
      { property: "og:title", content: "Workflow Builder" },
    ],
  }),
  component: WorkflowBuilder,
});

type StepNode = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  assignedUserId: string | null;
  approvalRequired: boolean;
  estimatedTime: string;
  deadline: string;
  checklist: { id: string; label: string }[];
  position: { x: number; y: number };
};

function WorkflowBuilder() {
  const { templateId } = Route.useSearch();
  const denied = useRequirePermission(["workflow_builder_access", "workflow_create", "workflow_edit"]);
  const { currentBrandId } = useApp();
  const { data: departments = [] } = useDepartments(currentBrandId);
  const { data: profiles = [] } = useProfiles(currentBrandId);
  const saveWorkflow = useSaveWorkflowTemplate();
  const { data: existingTemplate, isLoading: loadingTemplate } = useWorkflowTemplate(templateId);

  const [steps, setSteps] = useState<StepNode[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDesc, setWorkflowDesc] = useState("");
  const [workflowDept, setWorkflowDept] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!templateId || !existingTemplate || loaded) return;
    setWorkflowName(existingTemplate.name ?? "");
    setWorkflowDesc(existingTemplate.description ?? "");
    setWorkflowDept(existingTemplate.department_id ?? "");
    const tplSteps = (existingTemplate as any).workflow_steps ?? [];
    setSteps(
      tplSteps
        .sort((a: any, b: any) => a.step_order - b.step_order)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          departmentId: s.department_id ?? "",
          assignedUserId: s.assigned_user_id ?? null,
          approvalRequired: s.approval_required ?? false,
          estimatedTime: s.estimated_time ?? "",
          deadline: s.deadline_offset ?? "",
          checklist: (s.step_checklist_items ?? [])
            .sort((c: any) => c.sort_order)
            .map((c: any) => ({ id: c.id, label: c.label })),
          position: { x: s.position_x ?? 0, y: s.position_y ?? 0 },
        })),
    );
    setLoaded(true);
  }, [templateId, existingTemplate, loaded]);

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  const addStep = (afterIndex?: number) => {
    const newStep: StepNode = {
      id: `step-${Date.now()}`,
      name: "New Step",
      description: "",
      departmentId: departments[0]?.id ?? "",
      assignedUserId: null,
      approvalRequired: false,
      estimatedTime: "1h",
      deadline: "3",
      checklist: [],
      position: { x: 0, y: afterIndex !== undefined ? afterIndex + 1 : steps.length },
    };
    setSteps((prev) => {
      if (afterIndex !== undefined) {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, newStep);
        return next;
      }
      return [...prev, newStep];
    });
    setSelectedStepId(newStep.id);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const updateStep = (id: string, updates: Partial<StepNode>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const moveStep = (id: string, direction: "up" | "down") => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const assignEmployeeToStep = (stepId: string, userId: string) => {
    const user = profiles.find((u) => u.id === userId);
    const currentStep = steps.find((s) => s.id === stepId);
    updateStep(stepId, {
      assignedUserId: userId,
      departmentId: user?.department_id || currentStep?.departmentId,
    });
    toast.success(`Assigned ${user?.name} to step`);
  };

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }
    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    try {
      await saveWorkflow.mutateAsync({
        template: {
          ...(templateId ? { id: templateId } : {}),
          name: workflowName.trim(),
          description: workflowDesc.trim() || undefined,
          department_id: workflowDept || undefined,
          brand_id: currentBrandId,
        },
        steps: steps.map((s, i) => ({
          name: s.name,
          description: s.description || undefined,
          department_id: s.departmentId || undefined,
          assigned_user_id: s.assignedUserId || undefined,
          approval_required: s.approvalRequired,
          estimated_time: s.estimatedTime || undefined,
          deadline_offset: s.deadline || undefined,
          step_order: i,
          position_x: i,
          position_y: 0,
          checklist: s.checklist.map((c, ci) => ({
            label: c.label,
            sort_order: ci,
          })),
        })),
        connections: steps.slice(0, -1).map((_, i) => ({
          from_step_order: i,
          to_step_order: i + 1,
        })),
      });
      toast.success("Workflow saved successfully");
    } catch {
      toast.error("Failed to save workflow");
    }
  };

  const filteredUsers = profiles;

  if (denied) return null;

  return (
    <>
      <PageHeader
        title={templateId ? (workflowName || "Edit Workflow") : (workflowName || "New Workflow")}
        description={templateId ? "Edit your workflow template." : "Design your workflow visually. Drag employees from the sidebar onto steps."}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saveWorkflow.isPending || loadingTemplate}>
              <Play className="mr-1.5 h-4 w-4" />
              {saveWorkflow.isPending ? "Saving…" : loadingTemplate ? "Loading…" : "Save Workflow"}
            </Button>
          </div>
        }
      />

      {/* Workflow Meta */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Workflow Name</Label>
              <Input
                placeholder="e.g. Instagram Story Posting"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="Brief description"
                value={workflowDesc}
                onChange={(e) => setWorkflowDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={workflowDept} onValueChange={setWorkflowDept}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_340px]">
        {/* Left Sidebar - Departments & Employees */}
        <div className="hidden lg:block">
          <Card className="h-[calc(100vh-320px)] sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Team</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="px-4 pb-4 space-y-4">
                  {departments.map((dept) => {
                    const deptUsers = profiles.filter(
                      (u) => u.department_id === dept.id,
                    );
                    if (deptUsers.length === 0) return null;
                    return (
                      <div key={dept.id}>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          {dept.name}
                        </div>
                        <div className="space-y-1">
                          {deptUsers.map((user) => (
                            <div
                              key={user.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("userId", user.id);
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-grab hover:bg-muted/60 active:cursor-grabbing transition-colors"
                            >
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                              <span className="flex-1 truncate">{user.name}</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                {user.role === "team_lead" ? "Lead" : "Member"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="min-h-[500px]">
          <Card className="min-h-[calc(100vh-320px)]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                {/* Start Node */}
                <div className="flex flex-col items-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-success/10 text-success border-2 border-success/30">
                    <Play className="h-4 w-4" />
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground mt-1">Start</div>
                </div>

                {steps.length === 0 && (
                  <div className="relative flex flex-col items-center py-1 group/connection w-full max-w-sm">
                    <div className="w-0.5 h-4 bg-primary/30" />
                    <ArrowDown className="h-3 w-3 text-primary/40" />
                    <div className="w-0.5 h-2 bg-primary/30" />
                    <button
                      type="button"
                      onClick={() => addStep(-1)}
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/connection:opacity-100 transition-all duration-150 z-10 flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-background px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10 hover:border-primary/60 whitespace-nowrap"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Add step here
                    </button>
                  </div>
                )}

                {steps.map((step, index) => {
                  const dept = departments.find((d) => d.id === step.departmentId);
                  const assignee = profiles.find((u) => u.id === step.assignedUserId);
                  const isSelected = step.id === selectedStepId;

                  return (
                    <div key={step.id} className="flex flex-col items-center w-full max-w-sm">
                      <div className="relative flex flex-col items-center py-1 group/connection w-full">
                        <div className="w-0.5 h-4 bg-primary/30" />
                        <ArrowDown className="h-3 w-3 text-primary/40" />
                        <div className="w-0.5 h-2 bg-primary/30" />
                        <button
                          type="button"
                          onClick={() => addStep(index - 1 < 0 ? -1 : index - 1)}
                          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/connection:opacity-100 transition-all duration-150 z-10 flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-background px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10 hover:border-primary/60 whitespace-nowrap"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          Add step here
                        </button>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedStepId(step.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setSelectedStepId(step.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const userId = e.dataTransfer.getData("userId");
                          if (userId) assignEmployeeToStep(step.id, userId);
                        }}
                        className={cn(
                          "w-full max-w-sm rounded-xl border-2 p-4 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-primary shadow-md bg-primary/5"
                            : "border-border/60 hover:border-primary/40 bg-card",
                          step.approvalRequired && "border-amber-300/60",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate">{step.name}</div>
                              {step.approvalRequired && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] bg-amber-100 text-amber-700 border-amber-200"
                                >
                                  Approval
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {dept?.name}
                            </div>
                            {assignee && (
                              <div className="mt-2 flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-semibold text-primary">
                                  {assignee.initials}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {assignee.name}
                                </span>
                              </div>
                            )}
                            {!assignee && (
                              <div className="mt-2 text-[10px] text-muted-foreground italic">
                                Drop an employee here to assign
                              </div>
                            )}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(step.id, "up");
                              }}
                              disabled={index === 0}
                            >
                              <ChevronLeft className="h-3 w-3 rotate-[-90deg]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(step.id, "down");
                              }}
                              disabled={index === steps.length - 1}
                            >
                              <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStep(step.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="relative flex flex-col items-center py-1 group/connection w-full max-w-sm">
                  <div className="w-0.5 h-4 bg-primary/30" />
                  <ArrowDown className="h-3 w-3 text-primary/40" />
                  <div className="w-0.5 h-2 bg-primary/30" />
                  <button
                    type="button"
                    onClick={() => addStep(steps.length - 1)}
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/connection:opacity-100 transition-all duration-150 z-10 flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-background px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10 hover:border-primary/60 whitespace-nowrap"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    Add step here
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground border-2 border-border">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground mt-1">
                    Completed
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 border-dashed"
                  onClick={() => addStep()}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Step
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Step Properties */}
        <div className="lg:block">
          <Card className="h-[calc(100vh-320px)] sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {selectedStep ? "Step Properties" : "Select a Step"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStep ? (
                <ScrollArea className="h-[calc(100vh-390px)]">
                  <div className="space-y-4">
                    <Field label="Step name">
                      <Input
                        value={selectedStep.name}
                        onChange={(e) =>
                          updateStep(selectedStep.id, { name: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Description">
                      <Textarea
                        rows={3}
                        placeholder="What happens in this step?"
                        value={selectedStep.description}
                        onChange={(e) =>
                          updateStep(selectedStep.id, { description: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Department">
                      <Select
                        value={selectedStep.departmentId}
                        onValueChange={(v) =>
                          updateStep(selectedStep.id, { departmentId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Assign to">
                      <Select
                        value={selectedStep.assignedUserId || "__unassigned__"}
                        onValueChange={(v) =>
                          updateStep(selectedStep.id, {
                            assignedUserId: v === "__unassigned__" ? null : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__unassigned__">Unassigned</SelectItem>
                          {filteredUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Est. Time" hint="How long the task should take. Informational — shown on the task, does not affect the deadline.">
                        <Input
                          value={selectedStep.estimatedTime}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              estimatedTime: e.target.value,
                            })
                          }
                          placeholder="e.g. 4h"
                        />
                      </Field>
                      <Field label="Deadline (days)" hint="Number of days from the start date (or from the previous step).">
                        <Input
                          value={selectedStep.deadline}
                          onChange={(e) =>
                            updateStep(selectedStep.id, { deadline: e.target.value })
                          }
                          placeholder="e.g. 3"
                          inputMode="numeric"
                        />
                      </Field>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <div className="text-sm font-medium">Requires approval</div>
                        <div className="text-xs text-muted-foreground">
                          Approver must sign off before next step
                        </div>
                      </div>
                      <Switch
                        checked={selectedStep.approvalRequired}
                        onCheckedChange={(v) =>
                          updateStep(selectedStep.id, { approvalRequired: v })
                        }
                      />
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs">Checklist</Label>
                      <div className="mt-2 space-y-1">
                        {selectedStep.checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Input
                              value={item.label}
                              onChange={(e) =>
                                updateStep(selectedStep.id, {
                                  checklist: selectedStep.checklist.map((c) =>
                                    c.id === item.id ? { ...c, label: e.target.value } : c,
                                  ),
                                })
                              }
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                updateStep(selectedStep.id, {
                                  checklist: selectedStep.checklist.filter(
                                    (c) => c.id !== item.id,
                                  ),
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() =>
                            updateStep(selectedStep.id, {
                              checklist: [
                                ...selectedStep.checklist,
                                { id: `cl-${Date.now()}`, label: "New item" },
                              ],
                            })
                          }
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add item
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Circle className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Click on a step to edit its properties
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drag employees from the left sidebar to assign them
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
