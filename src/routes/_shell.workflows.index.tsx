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
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  useWorkflowTemplates,
  useDeleteWorkflowTemplate,
  useArchiveWorkflowTemplate,
  useStartWorkflow,
} from "@/lib/api/workflows";
import { useProjects } from "@/lib/api/admin";
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
  const { currentBrandId, currentRole } = useApp();
  const [search, setSearch] = useState("");
  const { data: allWorkflows = [], isLoading } = useWorkflowTemplates(currentBrandId);
  const deleteWorkflow = useDeleteWorkflowTemplate();
  const archiveWorkflow = useArchiveWorkflowTemplate();
  const startWorkflow = useStartWorkflow();
  const { data: projects = [] } = useProjects(currentBrandId);

  const [executeDialog, setExecuteDialog] = useState<{
    open: boolean;
    workflowId: string;
    workflowName: string;
  }>({ open: false, workflowId: "", workflowName: "" });
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [startDate, setStartDate] = useState("");

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
    const project = projects.find((p) => p.id === selectedProjectId);
    try {
      await startWorkflow.mutateAsync({
        templateId: executeDialog.workflowId,
        projectId: selectedProjectId,
        brandId: currentBrandId,
      });
      toast.success(
        `"${executeDialog.workflowName}" started on "${project?.name ?? "project"}"`,
      );
      setExecuteDialog({ open: false, workflowId: "", workflowName: "" });
      setSelectedProjectId("");
      setStartDate("");
    } catch (err: any) {
      console.error("Execute workflow error:", err);
      toast.error(err.message || "Failed to start workflow");
    }
  };

  return (
    <>
      <PageHeader
        title="Workflow Library"
        description="Reusable templates. Design once, use unlimited times."
        actions={
          currentRole === "admin" ? (
            <Button asChild>
              <Link to="/workflows/builder">
                <Plus className="mr-1.5 h-4 w-4" />
                New Workflow
              </Link>
            </Button>
          ) : undefined
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
              {currentRole === "admin"
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
                          {currentRole === "admin" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                disabled={w.status !== "active" || startWorkflow.isPending}
                                onClick={() => {
                                  setSelectedProjectId("");
                                  setStartDate("");
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
                              <Button variant="outline" size="sm" asChild>
                                <Link to="/workflows/builder" search={{ templateId: w.id }}>
                                  <Pencil className="mr-1 h-3.5 w-3.5" />
                                  Edit
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleArchive(w.id, w.name, w.status)
                                }
                              >
                                <Archive className="mr-1 h-3.5 w-3.5" />
                                {w.status === "active" ? "Archive" : "Unarchive"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(w.id, w.name)}
                                disabled={deleteWorkflow.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
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
              Start "{executeDialog.workflowName}" on a project. This will create
              tasks for the first step automatically.
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
              disabled={!selectedProjectId || startWorkflow.isPending}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {startWorkflow.isPending ? "Starting…" : "Start Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
