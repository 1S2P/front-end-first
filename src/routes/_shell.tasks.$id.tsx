import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Paperclip,
  MessageSquare,
  Clock,
  FileText,
  ChevronLeft,
  Send,
  Undo2,
  CheckCircle2,
  AlertCircle,
  Image,
  Video,
  Upload,
  GitBranch,
  Circle,
  User,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import {
  useTask,
  useSubmitTask,
  useWithdrawSubmission,
  useReviewTask,
  useUpdateChecklist,
  useAddComment,
  useUploadAttachment,
  useRevisionAssignee,
  useTaskAttachmentSignedUrls,
  useWorkflowProgress,
  type TaskWithRelations,
} from "@/lib/api/tasks";
import { useProfiles } from "@/lib/api/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/tasks/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Task · Danfe x NTE` },
      { name: "description", content: "Task details, checklist, files, and activity." },
    ],
  }),
  component: TaskDetail,
});

const STATUS_STYLES: Record<TaskStatus, string> = {
  ready: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  waiting_review: "bg-purple-100 text-purple-800",
  approved: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-800",
  needs_revision: "bg-orange-100 text-orange-800",
};

function TaskDetail() {
  const { id } = Route.useParams();
  const { currentUser, currentRole, hasPermission } = useApp();
  const { data: task, isLoading } = useTask(id);
  const submitTask = useSubmitTask();
  const withdrawSubmission = useWithdrawSubmission();
  const reviewTask = useReviewTask();
  const updateChecklist = useUpdateChecklist();
  const addComment = useAddComment();
  const uploadAttachment = useUploadAttachment();
  const revisionAssignee = useRevisionAssignee(task);
  const { data: signedAttachments } = useTaskAttachmentSignedUrls(id);
  const { data: workflowProgress } = useWorkflowProgress(task);
  const { data: profiles } = useProfiles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionMode, setRevisionMode] = useState<"previous" | "specific">("previous");
  const [revisionAssigneeId, setRevisionAssigneeId] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading task…
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Task not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The task you're looking for doesn't exist.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  const t = task as TaskWithRelations;
  const assignee = t.assigned_profile;
  const approver = t.approver_profile;
  const dept = t.department;
  const project = t.project;
  const checklistItems = t.task_checklist_items ?? [];
  const attachments = t.task_attachments ?? [];
  const comments = t.task_comments ?? [];
  const activities = t.task_activities ?? [];

  const isOverdue =
    task.due_date &&
    task.due_date < new Date().toISOString().split("T")[0] &&
    task.status !== "completed";
  const canSubmit =
    task.status === "ready" || task.status === "in_progress" || task.status === "needs_revision";
  const canWithdraw =
    task.status === "waiting_review" && !task.reviewed_at && task.submitted_at;
  const canReview =
    task.status === "waiting_review" &&
    !task.reviewed_at &&
    task.approval_required &&
    (currentRole === "admin" ||
      (hasPermission("tasks_review") &&
        currentUser != null &&
        task.assigned_to !== currentUser.id));

  const handleSubmit = async () => {
    try {
      await submitTask.mutateAsync(task.id);
      toast.success(
        task.approval_required
          ? "Task submitted for review"
          : task.workflow_instance_id
            ? "Task submitted — moving to next step"
            : "Task completed",
      );
    } catch {
      toast.error("Failed to submit task");
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdrawSubmission.mutateAsync(task.id);
      toast.success("Submission withdrawn");
    } catch {
      toast.error("Failed to withdraw submission");
    }
  };

  const handleReview = async (
    action: "approve" | "reject" | "request_changes" | "redo",
    assigneeId?: string | null,
  ) => {
    try {
      await reviewTask.mutateAsync({ taskId: task.id, action, assigneeId });
      toast.success(
        action === "approve"
          ? "Task approved"
          : action === "reject"
            ? "Task rejected"
            : "Revision requested",
      );
    } catch {
      toast.error("Failed to review task");
    }
  };

  const openRevisionDialog = () => {
    setRevisionMode("previous");
    setRevisionAssigneeId("");
    setRevisionOpen(true);
  };

  const submitRevision = async () => {
    const assigneeId = revisionMode === "specific" ? revisionAssigneeId || null : null;
    setRevisionOpen(false);
    await handleReview("request_changes", assigneeId);
  };

  const handleChecklistToggle = async (itemId: string, checked: boolean) => {
    try {
      await updateChecklist.mutateAsync({ itemId, checked, taskId: task.id });
    } catch {
      toast.error("Failed to update checklist");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ taskId: task.id, text: commentText.trim() });
      setCommentText("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAttachment.mutateAsync({ taskId: task.id, file });
      toast.success("File uploaded");
    } catch {
      toast.error("Failed to upload file");
    }
    e.target.value = "";
  };

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tasks">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to tasks
          </Link>
        </Button>
      </div>

      <PageHeader
        title={task.title}
        description={`${task.id} · ${project?.name ?? "—"} · ${dept?.name ?? "—"}`}
        actions={
          <div className="flex gap-2">
            {canWithdraw && (
              <Button
                variant="outline"
                onClick={handleWithdraw}
                disabled={withdrawSubmission.isPending}
              >
                <Undo2 className="mr-1.5 h-4 w-4" />
                Withdraw Submission
              </Button>
            )}
            {canReview && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReview("redo")}
                  disabled={reviewTask.isPending}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Undo2 className="mr-1.5 h-4 w-4" />
                  Redo
                </Button>
                <Button
                  variant="outline"
                  onClick={openRevisionDialog}
                  disabled={reviewTask.isPending}
                >
                  Request Changes
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={reviewTask.isPending}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {canSubmit && (
              <Button onClick={handleSubmit} disabled={submitTask.isPending}>
                <Send className="mr-1.5 h-4 w-4" />
                {task.approval_required ? "Submit For Review" : "Submit"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {task.description || "No description provided."}
            </CardContent>
          </Card>

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Checklist</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {checklistItems.filter((c) => c.checked).length} / {checklistItems.length}
                </span>
              </CardHeader>
              <CardContent className="space-y-1">
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/60 cursor-pointer"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(checked) =>
                        handleChecklistToggle(item.id, checked as boolean)
                      }
                      disabled={updateChecklist.isPending}
                    />
                    <span
                      className={
                        item.checked ? "text-muted-foreground line-through text-sm" : "text-sm"
                      }
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reference Files / Attachments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Files</CardTitle>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAttachment.isPending}
                >
                  <Paperclip className="mr-1.5 h-4 w-4" />
                  {uploadAttachment.isPending ? "Uploading…" : "Attach"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No files attached</p>
              ) : (
                attachments.map((f) => {
                  const signed = signedAttachments?.find((s) => s.id === f.id);
                  const FileIcon =
                    f.type === "image" ? Image : f.type === "video" ? Video : FileText;
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-md border border-border/60 p-3 text-sm"
                    >
                      {f.type === "image" && signed?.url ? (
                        <a
                          href={signed.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                          title={f.name}
                        >
                          <img
                            src={signed.url}
                            alt={f.name}
                            className="h-12 w-12 rounded-md object-cover border border-border/60"
                          />
                        </a>
                      ) : (
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {signed?.url ? (
                            <a
                              href={signed.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {f.name}
                            </a>
                          ) : (
                            f.name
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {f.size} · v{f.version}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
              ) : (
                comments.map((c) => {
                  const commenter = c.profiles;
                  return (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={cn("text-xs", commenter?.avatar_color)}>
                          {commenter?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg bg-muted/60 p-3 text-sm">
                        <div className="mb-1 flex justify-between">
                          <span className="font-medium">{commenter?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(c.created_at)}
                          </span>
                        </div>
                        {c.text}
                      </div>
                    </div>
                  );
                })
              )}
              <Separator />
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim() || addComment.isPending}
                >
                  Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Status">
                <Badge className={cn("text-[10px]", STATUS_STYLES[t.status])}>
                  {TASK_STATUS_LABELS[t.status]}
                </Badge>
              </Row>
              <Row label="Priority">
                <Badge
                  variant={
                    task.priority === "high"
                      ? "destructive"
                      : task.priority === "medium"
                        ? "default"
                        : "secondary"
                  }
                >
                  {task.priority}
                </Badge>
              </Row>
              <Row label="Project">{project?.name ?? "—"}</Row>
              <Row label="Department">{dept?.name ?? "—"}</Row>
              <Separator />
              <Row label="Assigned">
                <div className="flex items-center gap-1.5">
                  {assignee && (
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className={cn("text-[8px]", assignee.avatar_color)}>
                        {assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span>{assignee?.name ?? "—"}</span>
                </div>
              </Row>
              {approver && (
                <Row label="Approver">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className={cn("text-[8px]", approver.avatar_color)}>
                        {approver.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span>{approver.name}</span>
                  </div>
                </Row>
              )}
              <Row label="Due Date">
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  {task.due_date ?? "—"}
                </span>
              </Row>
              <Row label="Est. Time">{task.estimated_time ?? "—"}</Row>
              <Row label="Approval">
                {task.approval_required ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Required
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Not required</span>
                )}
              </Row>
            </CardContent>
          </Card>

          {/* Workflow Progress */}
          {workflowProgress && workflowProgress.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Workflow Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {workflowProgress.steps.map((step, i) => (
                  <div key={step.stepId} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : step.state === "active" ? (
                        <Circle className="h-4 w-4 text-primary shrink-0 fill-primary/20" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      {i < workflowProgress.steps.length - 1 && (
                        <div
                          className={cn(
                            "w-px flex-1 min-h-4",
                            step.state === "done" ? "bg-success/50" : "bg-border",
                          )}
                        />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          step.state === "pending" && "text-muted-foreground/60",
                        )}
                      >
                        {step.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {step.assignee ? (
                          <>
                            <User className="h-3 w-3" />
                            <span>{step.assignee.name}</span>
                          </>
                        ) : (
                          <span>Unassigned</span>
                        )}
                        {step.state === "active" && (
                          <Badge
                            variant={
                              step.taskStatus === "waiting_review"
                                ? "default"
                                : step.taskStatus === "needs_revision"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="ml-1 text-[10px]"
                          >
                            {step.taskStatus ? TASK_STATUS_LABELS[step.taskStatus] : "Current"}
                          </Badge>
                        )}
                        {step.state === "done" && (
                          <span className="ml-1 text-success">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {activities.length === 0 ? (
                <p className="text-center py-2">No activity yet</p>
              ) : (
                activities.map((a) => {
                  const actor = a.profiles;
                  return (
                    <div key={a.id} className="border-l-2 border-primary/30 pl-3">
                      <div className="text-sm">{a.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {actor?.name ?? "System"} · {formatTimeAgo(a.created_at)}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Reassign this task for revision. The assignee will redo the work and resubmit for
              review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <RadioGroup
              value={revisionMode}
              onValueChange={(v) => setRevisionMode(v as "previous" | "specific")}
            >
              <div className="flex items-start gap-2 rounded-md border p-3">
                <RadioGroupItem value="previous" id="rc-previous" />
                <Label htmlFor="rc-previous" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">Send to previous step</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {revisionAssignee.data
                      ? `Reassign to ${revisionAssignee.data.name}`
                      : "No previous step assignee — keeps the current assignee"}
                  </div>
                </Label>
              </div>
              <div className="flex items-start gap-2 rounded-md border p-3">
                <RadioGroupItem value="specific" id="rc-specific" />
                <Label htmlFor="rc-specific" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">Assign to a specific employee</div>
                </Label>
              </div>
            </RadioGroup>
            {revisionMode === "specific" && (
              <div className="space-y-1.5 pl-7">
                <Label className="text-sm">Employee</Label>
                <Select value={revisionAssigneeId} onValueChange={setRevisionAssigneeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitRevision}
              disabled={revisionMode === "specific" && !revisionAssigneeId}
            >
              Send Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}
