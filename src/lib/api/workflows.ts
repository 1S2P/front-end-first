import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

const TEMPLATE_SELECT = `
  *,
  department:departments(id, name),
  brand:brands(id, name, initials, color),
  workflow_steps(
    *,
    step_checklist_items(id, label, sort_order)
  ),
  workflow_connections(id, from_step, to_step)
`;

export function useWorkflowTemplates(brandId?: string) {
  return useQuery({
    queryKey: ["workflows", "templates", brandId],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("workflow_templates")
        .select(TEMPLATE_SELECT)
        .order("created_at", { ascending: false })
        .limit(200);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkflowTemplate(id: string) {
  return useQuery({
    queryKey: ["workflow", "template", id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_templates")
        .select(TEMPLATE_SELECT)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkflowInstances(brandId?: string) {
  return useQuery({
    queryKey: ["workflows", "instances", brandId],
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("workflow_instances")
        .select(
          `*, workflow_templates(id, name), projects(id, name), brands(id, name, initials, color)`,
        )
        .order("started_at", { ascending: false })
        .limit(200);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useStartWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      projectId,
      brandId,
    }: {
      templateId: string;
      projectId: string;
      brandId: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.rpc("start_workflow", {
        p_template_id: templateId,
        p_project_id: projectId,
        p_brand_id: brandId,
        p_started_by: session.session!.user.id,
      });
      if (error) {
        console.error("start_workflow error:", error);
        throw new Error(error.message || error.details || "Failed to start workflow");
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useStopWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { error } = await supabase
        .from("workflow_instances")
        .update({ status: "stopped" })
        .eq("id", instanceId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useSaveWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      template,
      steps,
      connections,
    }: {
      template: {
        id?: string;
        name: string;
        description?: string;
        department_id?: string;
        brand_id: string;
      };
      steps: Array<{
        id?: string;
        name: string;
        description?: string;
        department_id?: string;
        assigned_user_id?: string;
        approval_required: boolean;
        estimated_time?: string;
        deadline_offset?: string;
        step_order: number;
        position_x: number;
        position_y: number;
        checklist: Array<{ label: string; sort_order: number }>;
      }>;
      connections: Array<{ from_step_order: number; to_step_order: number }>;
    }) => {
      const { data: session } = await supabase.auth.getSession();

      // Upsert template
      const { data: tpl, error: tplErr } = await supabase
        .from("workflow_templates")
        .upsert({ ...template, created_by: session.session!.user.id })
        .select()
        .single();
      if (tplErr) throw tplErr;

      // Delete existing steps (cascade deletes checklist + connections)
      const { error: delStepsErr } = await supabase
        .from("workflow_steps")
        .delete()
        .eq("template_id", tpl.id);
      if (delStepsErr) throw delStepsErr;

      // Also explicitly delete connections for this template
      await supabase.from("workflow_connections").delete().eq("template_id", tpl.id);

      // Insert steps
      const stepInserts = steps.map((s) => ({
        template_id: tpl.id,
        name: s.name,
        description: s.description,
        department_id: s.department_id,
        assigned_user_id: s.assigned_user_id,
        approval_required: s.approval_required,
        estimated_time: s.estimated_time,
        deadline_offset: s.deadline_offset,
        step_order: s.step_order,
        position_x: s.position_x,
        position_y: s.position_y,
      }));

      const { data: savedSteps, error: stepsErr } = await supabase
        .from("workflow_steps")
        .insert(stepInserts)
        .select();
      if (stepsErr) throw stepsErr;

      // Build a map from step_order → saved step id (order-safe)
      const orderToId = new Map<number, string>();
      for (const ss of savedSteps) {
        orderToId.set(ss.step_order, ss.id);
      }

      // Insert checklist items
      const checklistInserts = steps.flatMap((s) =>
        s.checklist.map((c) => ({
          step_id: orderToId.get(s.step_order)!,
          label: c.label,
          sort_order: c.sort_order,
        })),
      );
      if (checklistInserts.length > 0) {
        const { error: clErr } = await supabase
          .from("step_checklist_items")
          .insert(checklistInserts);
        if (clErr) throw clErr;
      }

      // Insert connections using saved step IDs
      const connInserts = connections.map((c) => ({
        template_id: tpl.id,
        from_step: orderToId.get(c.from_step_order)!,
        to_step: orderToId.get(c.to_step_order)!,
      }));
      if (connInserts.length > 0) {
        const { error: connErr } = await supabase
          .from("workflow_connections")
          .insert(connInserts);
        if (connErr) throw connErr;
      }

      return tpl;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useArchiveWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from("workflow_templates")
        .update({ status: archive ? "archived" : "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useDeleteWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflow_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export type WorkflowStatusRow = {
  instance_id: string;
  workflow_name: string;
  project_name: string;
  brand_id: string;
  department_name: string | null;
  current_step_name: string | null;
  step_order: number;
  total_steps: number;
  task_id: string;
  task_title: string;
  assigned_to: string | null;
  assignee_name: string | null;
  assignee_initials: string | null;
  assignee_avatar_color: string | null;
  step_started_at: string;
  step_due_at: string | null;
  hours_in_step: number;
  is_overdue: boolean;
  instance_status: string;
};

export function useWorkflowStatusBoard(brandId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["workflow-status-board", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_workflow_status_board", {
        p_brand_id: brandId,
      });
      if (error) throw error;
      return (data ?? []) as WorkflowStatusRow[];
    },
  });

  // Realtime: any change to tasks in this brand refreshes the board (same
  // postgres_changes pattern as notifications.ts).
  useEffect(() => {
    if (!brandId) return;
    const channel = supabase
      .channel(`workflow-status-board-${brandId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `brand_id=eq.${brandId}` },
        () => qc.invalidateQueries({ queryKey: ["workflow-status-board", brandId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId, qc]);

  return query;
}
