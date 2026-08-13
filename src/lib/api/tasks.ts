import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useApp } from "../app-context";
import type { TaskStatus, TaskPriority, Database } from "../database.types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskProfile = { id: string; name: string; initials: string; avatar_color: string };
export type TaskChecklistItem = { id: string; label: string; checked: boolean; sort_order: number };
export type TaskAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  storage_path: string;
  uploaded_by: string;
  version: number;
  uploaded_at: string;
};
export type TaskComment = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles: TaskProfile | null;
};
export type TaskActivity = {
  id: string;
  action: string;
  user_id: string;
  description: string;
  created_at: string;
  profiles: Pick<TaskProfile, "id" | "name" | "initials"> | null;
};

export type TaskWithRelations = TaskRow & {
  assigned_profile?: TaskProfile | null;
  approver_profile?: TaskProfile | null;
  department?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
  task_checklist_items?: TaskChecklistItem[];
  task_attachments?: TaskAttachment[];
  task_comments?: TaskComment[];
  task_activities?: TaskActivity[];
};

const TASK_SELECT = `
  *,
  assigned_profile:profiles!tasks_assigned_to_fkey(id, name, initials, avatar_color),
  approver_profile:profiles!tasks_approved_by_fkey(id, name, initials, avatar_color),
  project:projects(id, name),
  department:departments(id, name),
  task_checklist_items(id, label, checked, sort_order),
  task_attachments(id, name, type, size, storage_path, uploaded_by, version, uploaded_at),
  task_comments(id, user_id, text, created_at, profiles(id, name, initials, avatar_color)),
  task_activities(id, action, user_id, description, created_at, profiles(id, name, initials))
`;

const TASK_LIST_SELECT = `
  *,
  assigned_profile:profiles!tasks_assigned_to_fkey(id, name, initials, avatar_color),
  department:departments(id, name)
`;

export function useMyTasks(brandId?: string) {
  return useQuery({
    queryKey: ["tasks", "mine", brandId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      let q = supabase
        .from("tasks")
        .select(TASK_LIST_SELECT)
        .eq("assigned_to", session.session!.user.id)
        .order("created_at", { ascending: false });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useDepartmentTasks(departmentId: string, brandId?: string) {
  return useQuery({
    queryKey: ["tasks", "department", departmentId, brandId],
    enabled: !!departmentId,
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select(TASK_LIST_SELECT)
        .eq("department_id", departmentId)
        .order("created_at", { ascending: false });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ["tasks", "project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_LIST_SELECT)
        .eq("project_id", projectId)
        .order("workflow_step_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyActionableTaskCount(brandId?: string) {
  return useQuery({
    queryKey: ["tasks", "mine", "actionable-count", brandId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      let q = supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", session.session!.user.id)
        .in("status", ["ready", "in_progress", "needs_revision"]);
      if (brandId) q = q.eq("brand_id", brandId);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useTaskBadgeCount(brandId?: string) {
  const { currentUser, currentRole, hasPermission } = useApp();
  const { data: myActionableCount = 0 } = useMyActionableTaskCount(brandId);
  const { data: pendingReviews = [] } = usePendingReviews(brandId);

  const canReviewTasks = currentRole === "admin" || hasPermission("tasks_review");
  if (!canReviewTasks) return myActionableCount;

  const reviewCount =
    currentRole === "admin"
      ? pendingReviews.length
      : pendingReviews.filter((t) => t.assigned_to !== currentUser?.id).length;

  return myActionableCount + reviewCount;
}

export function useAllBrandTasks(brandId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tasks", "all", brandId],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      let q = supabase.from("tasks").select(TASK_LIST_SELECT).order("created_at", { ascending: false });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function usePendingReviews(brandId?: string) {
  return useQuery({
    queryKey: ["tasks", "pending-review", brandId],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select(TASK_LIST_SELECT)
        .eq("status", "waiting_review")
        .order("submitted_at", { ascending: true });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useReassignedTasks(brandId?: string) {
  return useQuery({
    queryKey: ["tasks", "reassigned", brandId],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select(TASK_LIST_SELECT)
        .eq("status", "needs_revision")
        .order("created_at", { ascending: false });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc("submit_task", { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: (_, taskId) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useWithdrawSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc("withdraw_submission", { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: (_, taskId) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReviewTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      action,
      assigneeId,
    }: {
      taskId: string;
      action: "approve" | "reject" | "request_changes" | "redo";
      assigneeId?: string | null;
    }) => {
      const { error } = await supabase.rpc("review_task", {
        p_task_id: taskId,
        p_action: action,
        p_assignee_id: assigneeId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      checked,
    }: {
      itemId: string;
      checked: boolean;
      taskId: string;
    }) => {
      const { error } = await supabase
        .from("task_checklist_items")
        .update({ checked })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, text }: { taskId: string; text: string }) => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        user_id: session.session!.user.id,
        text,
      });
      if (error) throw error;
      try {
        await supabase.from("task_activities").insert({
          task_id: taskId,
          action: "comment_added",
          user_id: session.session!.user.id,
          description: "Comment added",
        });
      } catch {
        console.warn("Failed to log comment activity");
      }
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const { uploadTaskAttachment } = await import("@/lib/server-functions");
      await uploadTaskAttachment({
        data: {
          accessToken,
          taskId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          content,
        },
      });
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["task", "attachments", taskId] });
    },
  });
}

export type SignedAttachmentUrl = {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string | undefined;
};

export function useTaskAttachmentSignedUrls(taskId?: string) {
  return useQuery({
    queryKey: ["task", "attachments", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<SignedAttachmentUrl[]> => {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const { getTaskAttachmentSignedUrls } = await import("@/lib/server-functions");
      return getTaskAttachmentSignedUrls({ data: { accessToken, taskId: taskId! } });
    },
  });
}

export function useRevisionAssignee(task: TaskRow) {
  return useQuery({
    queryKey: ["revision-assignee", task?.id],
    enabled: !!task?.workflow_instance_id,
    queryFn: async () => {
      const { data: instance } = await supabase
        .from("workflow_instances")
        .select("template_id")
        .eq("id", task.workflow_instance_id)
        .single();
      if (!instance) return null;

      const { data: step } = await supabase
        .from("workflow_steps")
        .select("assigned_user_id")
        .eq("template_id", instance.template_id)
        .eq("step_order", task.workflow_step_index - 1)
        .single();
      if (!step?.assigned_user_id) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, initials, avatar_color")
        .eq("id", step.assigned_user_id)
        .single();
      return profile;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority: TaskPriority;
      brand_id: string;
      project_id: string;
      department_id?: string;
      assigned_to?: string;
      due_date?: string;
      estimated_time?: string;
      approval_required?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, status: "ready", workflow_step_index: 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export type WorkflowProgressStep = {
  stepId: string;
  stepOrder: number;
  name: string;
  description: string | null;
  state: "done" | "active" | "pending";
  taskId: string | null;
  taskStatus: TaskStatus | null;
  assignee: Pick<TaskProfile, "id" | "name" | "initials" | "avatar_color"> | null;
};

export type WorkflowProgress = {
  instanceId: string;
  templateId: string;
  instanceStatus: string;
  steps: WorkflowProgressStep[];
};

export function useWorkflowProgress(task?: Pick<TaskWithRelations, "workflow_instance_id"> | null) {
  return useQuery({
    queryKey: ["task", "workflow", task?.workflow_instance_id],
    enabled: !!task?.workflow_instance_id,
    queryFn: async (): Promise<WorkflowProgress | null> => {
      const instanceId = task!.workflow_instance_id!;

      const { data: instance } = await supabase
        .from("workflow_instances")
        .select("id, template_id, status")
        .eq("id", instanceId)
        .single();
      if (!instance) return null;

      const [{ data: stepsData }, { data: instanceTasksData }] = await Promise.all([
        supabase
          .from("workflow_steps")
          .select("id, name, description, step_order, assigned_user_id")
          .eq("template_id", instance.template_id)
          .order("step_order", { ascending: true }),
        supabase
          .from("tasks")
          .select("id, status, workflow_step_index, assigned_to")
          .eq("workflow_instance_id", instanceId)
          .order("workflow_step_index", { ascending: true }),
      ]);

      const steps = stepsData ?? [];
      const instanceTasks = instanceTasksData ?? [];

      const assigneeIds = [
        ...new Set(
          [
            ...steps.map((s) => s.assigned_user_id),
            ...instanceTasks.map((t) => t.assigned_to),
          ].filter((id): id is string => !!id),
        ),
      ];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, initials, avatar_color")
        .in("id", assigneeIds);
      const profileById = new Map((profilesData ?? []).map((p) => [p.id, p]));

      const firstIncomplete = instanceTasks.find((t) => t.status !== "completed");

      const stepsWithState: WorkflowProgressStep[] = steps.map((s) => {
        const t = instanceTasks.find((task) => task.workflow_step_index === s.step_order);
        const taskCompleted = t?.status === "completed";
        const state: "done" | "active" | "pending" = taskCompleted
          ? "done"
          : t && t.id === firstIncomplete?.id
            ? "active"
            : "pending";
        const assignee =
          (t?.assigned_to ? profileById.get(t.assigned_to) : null) ??
          (s.assigned_user_id ? profileById.get(s.assigned_user_id) : null) ??
          null;
        return {
          stepId: s.id,
          stepOrder: s.step_order,
          name: s.name,
          description: s.description,
          state,
          taskId: t?.id ?? null,
          taskStatus: t?.status ?? null,
          assignee,
        };
      });

      return {
        instanceId,
        templateId: instance.template_id,
        instanceStatus: instance.status,
        steps: stepsWithState,
      };
    },
  });
}
