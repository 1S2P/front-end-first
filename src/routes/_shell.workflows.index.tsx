import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Archive,
  Pencil,
  Trash2,
  Plus,
  Workflow,
  Play,
  Calendar,
  Activity,
  Repeat,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  useWorkflowTemplates,
  useDeleteWorkflowTemplate,
  useArchiveWorkflowTemplate,
  useStartWorkflow,
  useDuplicateWorkflowTemplate,
  useWorkflowSchedules,
  useCreateWorkflowSchedule,
  useDeleteWorkflowSchedule,
} from "@/lib/api/workflows";
import { useProjects } from "@/lib/api/admin";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/workflows/")({
  head: () => ({
    meta: [
      { title: "Workflow Library · Danfe x NTE" },
      { name: "description", content: "Reusable workflow templates by department." },
      { property: "og:title", content: "Workflow Library" },
    ],
  }),
  component: WorkflowLibrary,
});

function WorkflowLibrary() {
  const { currentBrandId, currentRole, hasPermission } = useApp();
  const [search, setSearch] = useState("");
  const { data: allWorkflows = [], isLoading } = useWorkflowTemplates(currentBrandId);
  const deleteWorkflow = useDeleteWorkflowTemplate();
  const archiveWorkflow = useArchiveWorkflowTemplate();
  const startWorkflow = useStartWorkflow();
  const duplicateWorkflow = useDuplicateWorkflowTemplate();
  const { data: projects = [] } = useProjects(currentBrandId);
  const { data: schedules = [] } = useWorkflowSchedules(currentBrandId);
  const createSchedule = useCreateWorkflowSchedule();
  const deleteSchedule = useDeleteWorkflowSchedule();

  const canCreate = currentRole === "admin" || hasPermission("workflow_create") || hasPermission("workflow_builder_access");
  const canStart = currentRole === "admin" || hasPermission("workflow_start");
  const canEdit = currentRole === "admin" || hasPermission("workflow_edit");
  const canDelete = currentRole === "admin" || hasPermission("workflow_delete");
  const canManage = canStart || canEdit || canDelete;

  const [executeDialog, setExecuteDialog] = useState<{
    open: boolean;
    workflowId: string;
    workflowName: string;
  }>({ open: false, workflowId: "", workflowName: "" });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [endDate, setEndDate] = useState("");

  const WEEKDAYS: { label: string; value: number }[] = [
    { label: "Su", value: 0 },
    { label: "Mo", value: 1 },
    { label: "Tu", value: 2 },
    { label: "We", value: 3 },
    { label: "Th", value: 4 },
    { label: "Fr", value: 5 },
    { label: "Sa", value: 6 },
  ];

  const toggleDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const filtered = search
    ? allWorkflows.filter(
        (w) =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          (w.description ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : allWorkflows;

  const grouped = filtered.reduce(
    (acc, w) => {
      const deptName = (w as any).department?.name || "Other";
      if (!acc[deptName]) acc[deptName] = [];
      acc[deptName].push(w);
      return acc;
    },
    {} as Record<string, typeof allWorkflows>,
  );

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteWorkflow.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete workflow");
    }
  };

  const handleArchive = async (id: string, name: string, currentStatus: string) => {
    try {
      await archiveWorkflow.mutateAsync({ id, archive: currentStatus === "active" });
      toast.success(`"${name}" ${currentStatus === "active" ? "archived" : "unarchived"}`);
    } catch {
      toast.error("Failed to archive workflow");
    }
  };

  const handleExecute = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    if (repeat && repeatDays.length === 0) {
      toast.error("Please select at least one day to repeat on");
      return;
    }
    const project = projects.find((p) => p.id === selectedProjectId);
    const name = `"${executeDialog.workflowName}"`;
    try {
      if (repeat) {
        await Promise.all([
          startWorkflow.mutateAsync({
            templateId: executeDialog.workflowId,
            projectId: selectedProjectId,
            brandId: currentBrandId,
          }),
          createSchedule.mutateAsync({
            templateId: executeDialog.workflowId,
            projectId: selectedProjectId,
            brandId: currentBrandId,
            repeatDays,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
        ]);
        toast.success(
          `${name} started and scheduled to repeat on selected days`,
        );
      } else {
        await startWorkflow.mutateAsync({
          templateId: executeDialog.workflowId,
          projectId: selectedProjectId,
          brandId: currentBrandId,
        });
        toast.success(`${name} started on "${project?.name ?? "project"}"`);
      }
      setExecuteDialog({ open: false, workflowId: "", workflowName: "" });
      setSelectedProjectId("");
      setStartDate("");
      setEndDate("");
      setRepeat(false);
      setRepeatDays([]);
    } catch (err: any) {
      console.error("Execute workflow error:", err);
      toast.error(err.message || "Failed to execute workflow");
    }
  };

  const handleDuplicate = async (w: any) => {
    try {
      await duplicateWorkflow.mutateAsync({
        templateId: w.id,
        brandId: currentBrandId,
      });
      toast.success(`"${w.name}" duplicated`);
    } catch (err: any) {
      console.error("Duplicate workflow error:", err);
      toast.error(err.message || "Failed to duplicate workflow");
    }
  };

  return (
    <>
      <PageHeader
        title="Workflow Library"
        description="Reusable templates. Design once, use unlimited times."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/workflows/status">
                <Activity className="mr-1.5 h-4 w-4" />
                Where's it at?
              </Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link to="/workflows/builder">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Workflow
                </Link>
              </Button>
            ) : undefined}
          </>
        }
      />
      <div className="mb-6 max-w-sm">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading workflows…
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Workflow className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-medium">No workflows found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {canCreate
                ? "Create your first workflow to get started."
                : "No workflows available in this workspace."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([deptName, deptWorkflows]) => (
            <section key={deptName}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {deptName}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {deptWorkflows.map((w) => {
                  const steps = (w as any).workflow_steps ?? [];
                  const connections = (w as any).workflow_connections ?? [];
                  return (
                    <Card
                      key={w.id}
                      className="group transition-colors hover:border-primary/50"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{w.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {w.description}
                            </div>
                          </div>
                          <Badge variant={w.status === "active" ? "default" : "secondary"}>
                            {w.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{steps.length} steps</span>
                          <span>·</span>
                          <span>
                            Used {w.usage_count} times
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {canManage && (
                            <>
                              {canStart && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={w.status !== "active" || startWorkflow.isPending}
                                  onClick={() => {
                                    setSelectedProjectId("");
                                    setStartDate("");
                                    setEndDate("");
                                    setRepeat(false);
                                    setRepeatDays([]);
                                    setExecuteDialog({
                                      open: true,
                                      workflowId: w.id,
                                      workflowName: w.name,
                                    });
                                  }}
                                >
                                  <Play className="mr-1 h-3.5 w-3.5" />
                                  Execute
                                </Button>
                              )}
                              {canEdit && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link to="/workflows/builder" search={{ templateId: w.id }}>
                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                    Edit
                                  </Link>
                                </Button>
                              )}
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicate(w)}
                                  disabled={duplicateWorkflow.isPending}
                                >
                                  <Copy className="mr-1 h-3.5 w-3.5" />
                                  Duplicate
                                </Button>
                              )}
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleArchive(w.id, w.name, w.status)}
                                >
                                  <Archive className="mr-1 h-3.5 w-3.5" />
                                  {w.status === "active" ? "Archive" : "Unarchive"}
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(w.id, w.name)}
                                  disabled={deleteWorkflow.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {schedules.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recurring Schedules
          </h2>
          <Card>
            <CardContent className="divide-y divide-border/60">
              {schedules.map((s) => {
                const dayLabels = WEEKDAYS.filter((d) => s.repeat_days.includes(d.value)).map(
                  (d) => d.label,
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 py-3 text-sm"
                  >
                    <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {s.workflow_templates?.name ?? "Workflow"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.projects?.name ?? "Project"} · {dayLabels.join(", ")}
                        {s.end_date ? ` · ends ${s.end_date}` : ""}
                      </div>
                    </div>
                    <Badge variant={s.active ? "default" : "secondary"} className="text-[10px]">
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                    {canStart && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteSchedule.mutate(s.id)}
                        disabled={deleteSchedule.isPending}
                        title="Delete schedule"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={executeDialog.open}
        onOpenChange={(open) =>
          setExecuteDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Execute Workflow</DialogTitle>
            <DialogDescription>
              {repeat
                ? `Start "${executeDialog.workflowName}" now and repeat automatically on the selected days.`
                : `Start "${executeDialog.workflowName}" on a project. This will create tasks for the first step automatically.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Repeat className="h-3.5 w-3.5" />
                  Repeat automatically
                </div>
                <div className="text-xs text-muted-foreground">
                  Runs the workflow again on the selected days.
                </div>
              </div>
              <Switch checked={repeat} onCheckedChange={setRepeat} />
            </div>
            {repeat && (
              <>
                <div className="space-y-2">
                  <Label>Repeat every week on</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={cn(
                          "h-9 w-9 rounded-full text-xs font-medium transition-colors border",
                          repeatDays.includes(d.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50",
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Defaults to today"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="No end date"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Task deadlines will be calculated from the run date.
                </p>
              </>
            )}
            {!repeat && (
              <div className="space-y-2">
                <Label>Start Date (optional)</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Defaults to today"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Task deadlines will be calculated from this date.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setExecuteDialog({ open: false, workflowId: "", workflowName: "" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              disabled={!selectedProjectId || startWorkflow.isPending || createSchedule.isPending}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {startWorkflow.isPending || createSchedule.isPending
                ? "Saving…"
                : repeat
                  ? "Schedule Workflow"
                  : "Start Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
