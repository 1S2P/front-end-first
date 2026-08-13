export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type SystemRole = "admin" | "team_lead" | "team_member";
export type PermissionLevel = "admin" | "editor" | "reviewer" | "viewer";
export type ProjectStatus = "active" | "archived";
export type WorkflowStatus = "active" | "archived";
export type InstanceStatus = "running" | "paused" | "completed" | "stopped";
export type TaskStatus =
  | "ready"
  | "in_progress"
  | "waiting_review"
  | "approved"
  | "completed"
  | "rejected"
  | "needs_revision";
export type TaskPriority = "high" | "medium" | "low";
export type AttachmentType = "document" | "image" | "video" | "other";
export type ActivityAction =
  | "workflow_started"
  | "task_assigned"
  | "files_uploaded"
  | "comment_added"
  | "submitted"
  | "withdrawn"
  | "approved"
  | "rejected"
  | "revision_requested"
  | "completed";
export type NotificationType =
  | "task_assigned"
  | "task_submitted"
  | "waiting_review"
  | "task_approved"
  | "task_rejected"
  | "revision_requested"
  | "submission_withdrawn"
  | "task_due_today"
  | "task_overdue"
  | "workflow_started"
  | "workflow_completed"
  | "project_updated";

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: { id: string; name: string; initials: string; color: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["brands"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
      };
      departments: {
        Row: { id: string; name: string; team_lead_id: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["departments"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>;
      };
      department_brands: {
        Row: { department_id: string; brand_id: string };
        Insert: Database["public"]["Tables"]["department_brands"]["Row"];
        Update: Partial<Database["public"]["Tables"]["department_brands"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          initials: string;
          role: SystemRole;
          department_id: string | null;
          avatar_color: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      profile_brands: {
        Row: { profile_id: string; brand_id: string };
        Insert: Database["public"]["Tables"]["profile_brands"]["Row"];
        Update: Partial<Database["public"]["Tables"]["profile_brands"]["Row"]>;
      };
      permissions: {
        Row: {
          id: string;
          group_name: string;
          name: string;
          description: string;
          sort_order: number;
        };
        Insert: Database["public"]["Tables"]["permissions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["permissions"]["Row"]>;
      };
      profile_permissions: {
        Row: { profile_id: string; permission_id: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["profile_permissions"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profile_permissions"]["Row"]>;
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          brand_id: string;
          status: ProjectStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      workflow_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          department_id: string | null;
          brand_id: string;
          status: WorkflowStatus;
          usage_count: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workflow_templates"]["Row"],
          "id" | "created_at" | "usage_count"
        >;
        Update: Partial<Database["public"]["Tables"]["workflow_templates"]["Insert"]>;
      };
      workflow_steps: {
        Row: {
          id: string;
          template_id: string;
          name: string;
          description: string | null;
          department_id: string | null;
          assigned_user_id: string | null;
          approval_required: boolean;
          estimated_time: string | null;
          deadline_offset: string | null;
          step_order: number;
          position_x: number;
          position_y: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["workflow_steps"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["workflow_steps"]["Insert"]>;
      };
      step_checklist_items: {
        Row: { id: string; step_id: string; label: string; sort_order: number };
        Insert: Omit<Database["public"]["Tables"]["step_checklist_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["step_checklist_items"]["Insert"]>;
      };
      workflow_connections: {
        Row: { id: string; template_id: string; from_step: string; to_step: string };
        Insert: Omit<Database["public"]["Tables"]["workflow_connections"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["workflow_connections"]["Insert"]>;
      };
      workflow_instances: {
        Row: {
          id: string;
          template_id: string;
          project_id: string;
          brand_id: string;
          status: InstanceStatus;
          current_step_index: number;
          started_by: string | null;
          started_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workflow_instances"]["Row"],
          "id" | "started_at" | "current_step_index"
        >;
        Update: Partial<Database["public"]["Tables"]["workflow_instances"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          brand_id: string;
          project_id: string;
          department_id: string | null;
          workflow_instance_id: string | null;
          workflow_step_id: string | null;
          workflow_step_index: number;
          assigned_to: string | null;
          approved_by: string | null;
          due_date: string | null;
          estimated_time: string | null;
          approval_required: boolean;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      task_checklist_items: {
        Row: { id: string; task_id: string; label: string; checked: boolean; sort_order: number };
        Insert: Omit<Database["public"]["Tables"]["task_checklist_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["task_checklist_items"]["Insert"]>;
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          name: string;
          type: AttachmentType;
          size: string | null;
          storage_path: string | null;
          uploaded_by: string | null;
          version: number;
          uploaded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["task_attachments"]["Row"], "id" | "uploaded_at">;
        Update: Partial<Database["public"]["Tables"]["task_attachments"]["Insert"]>;
      };
      task_comments: {
        Row: { id: string; task_id: string; user_id: string; text: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["task_comments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["task_comments"]["Insert"]>;
      };
      task_activities: {
        Row: {
          id: string;
          task_id: string;
          action: ActivityAction;
          user_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["task_activities"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["task_activities"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          type: NotificationType;
          title: string;
          message: string;
          task_id: string | null;
          user_id: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["notifications"]["Row"],
          "id" | "created_at" | "read"
        >;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
    Functions: {
      start_workflow: {
        Args: {
          p_template_id: string;
          p_project_id: string;
          p_brand_id: string;
          p_started_by: string;
        };
        Returns: string;
      };
      submit_task: { Args: { p_task_id: string }; Returns: void };
      withdraw_submission: { Args: { p_task_id: string }; Returns: void };
      review_task: { Args: { p_task_id: string; p_action: string }; Returns: void };
      is_admin: { Args: Record<never, never>; Returns: boolean };
      get_my_role: { Args: Record<never, never>; Returns: SystemRole };
      has_permission: { Args: { p_permission: string }; Returns: boolean };
      get_workflow_status_board: {
        Args: { p_brand_id?: string | null };
        Returns: Array<{
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
        }>;
      };
    };
  };
}
