// ─── Brands ──────────────────────────────────────────────────────────────────
export type Brand = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

// ─── Departments ─────────────────────────────────────────────────────────────
export type Department = {
  id: string;
  name: string;
  teamLeadId: string | null;
  brandIds: string[];
};

// ─── Roles ───────────────────────────────────────────────────────────────────
export type SystemRole = "admin" | "team_lead" | "team_member";

// ─── Permission Types (Google Drive inspired) ────────────────────────────────
export type PermissionLevel = "admin" | "editor" | "reviewer" | "viewer";

// ─── Granular permissions (admin-assignable per employee) ────────────────────
export type Permission = {
  id: string;
  groupName: string;
  name: string;
  description: string;
  sortOrder: number;
};

// ─── Users ───────────────────────────────────────────────────────────────────
export type User = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: SystemRole;
  departmentId: string;
  brandIds: string[];
  avatarColor: string;
};

// ─── Projects ────────────────────────────────────────────────────────────────
export type Project = {
  id: string;
  name: string;
  description: string;
  brandId: string;
  status: "active" | "archived";
  createdAt: string;
};

// ─── Task Status ─────────────────────────────────────────────────────────────
export type TaskStatus =
  | "ready"
  | "in_progress"
  | "waiting_review"
  | "approved"
  | "completed"
  | "rejected"
  | "needs_revision";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  ready: "Ready",
  in_progress: "In Progress",
  waiting_review: "Waiting Review",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
};

export const BOARD_COLUMNS: TaskStatus[] = [
  "ready",
  "in_progress",
  "waiting_review",
  "needs_revision",
  "completed",
];

// ─── Priority ────────────────────────────────────────────────────────────────
export type Priority = "high" | "medium" | "low";

// ─── Checklist ───────────────────────────────────────────────────────────────
export type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

// ─── Attachments ─────────────────────────────────────────────────────────────
export type Attachment = {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "other";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
};

// ─── Comments ────────────────────────────────────────────────────────────────
export type Comment = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
};

// ─── Activity Timeline ───────────────────────────────────────────────────────
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
  | "redo"
  | "completed";

export type ActivityEntry = {
  id: string;
  action: ActivityAction;
  userId: string;
  description: string;
  timestamp: string;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  brandId: string;
  projectId: string;
  departmentId: string;
  workflowId: string;
  workflowStepIndex: number;
  assignedTo: string;
  approvedBy: string | null;
  dueDate: string;
  estimatedTime: string;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  comments: Comment[];
  activities: ActivityEntry[];
  approvalRequired: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
};

// ─── Workflow Steps ──────────────────────────────────────────────────────────
export type WorkflowStep = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  assignedUserId: string | null;
  approvalRequired: boolean;
  estimatedTime: string;
  deadline: string;
  checklist: { id: string; label: string }[];
  attachments: string[];
  comments: string[];
  position: { x: number; y: number };
};

// ─── Workflow Connections ────────────────────────────────────────────────────
export type WorkflowConnection = {
  id: string;
  from: string;
  to: string;
};

// ─── Workflow Templates ─────────────────────────────────────────────────────
export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  brandId: string;
  status: "active" | "archived";
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  createdAt: string;
  usageCount: number;
};

// ─── Workflow Instances ──────────────────────────────────────────────────────
export type WorkflowInstance = {
  id: string;
  templateId: string;
  projectId: string;
  brandId: string;
  status: "running" | "paused" | "completed" | "stopped";
  currentStepIndex: number;
  startedAt: string;
  startedBy: string;
};

// ─── Notifications ───────────────────────────────────────────────────────────
export type NotificationType =
  | "task_assigned"
  | "task_submitted"
  | "waiting_review"
  | "task_approved"
  | "task_rejected"
  | "revision_requested"
  | "redo_requested"
  | "submission_withdrawn"
  | "task_due_today"
  | "task_overdue"
  | "workflow_started"
  | "workflow_completed"
  | "project_updated";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string | null;
  userId: string;
  read: boolean;
  createdAt: string;
};

// ─── App State ───────────────────────────────────────────────────────────────
export type AppState = {
  currentUser: User;
  currentBrandId: string;
  currentRole: SystemRole;
};
