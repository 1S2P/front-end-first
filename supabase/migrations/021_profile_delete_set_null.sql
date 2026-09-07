-- ─── 021: Allow deleting employees that have history ──────────────────────────
-- Fixes "update or delete on table profiles violates foreign key constraint"
-- when deleting an employee profile. Several tables reference profiles(id)
-- without an ON DELETE action (defaults to NO ACTION), which blocks profile
-- deletion once a user has created/uploaded/started anything.
--
-- Strategy: preserve history by switching every nullable profile reference to
-- ON DELETE SET NULL. The one NOT NULL reference (task_comments.user_id) is
-- relaxed to nullable + SET NULL so deleting a user doesn't destroy comment
-- text but orphans its author id.
--
-- Constraint names are dropped by the names PostgreSQL auto-generates
-- (<table>_<column>_fkey). Both the migration's column name and the live-DB
-- variant are handled where they may differ.

-- ─── Task attachments (reported cause) ────────────────────────────────────────
alter table task_attachments
  drop constraint if exists task_attachments_uploaded_by_fkey,
  drop constraint if exists task_attachments_upload_by_fkey,
  drop constraint if exists task_attachment_uploaded_by_fkey,
  drop constraint if exists task_attachment_upload_by_fkey;

alter table task_attachments
  add constraint task_attachments_uploaded_by_fkey
  foreign key (uploaded_by) references profiles(id) on delete set null;

-- ─── Task comments (NOT NULL -> relax + set null) ─────────────────────────────
alter table task_comments
  drop constraint if exists task_comments_user_id_fkey,
  alter column user_id drop not null;

alter table task_comments
  add constraint task_comments_user_id_fkey
  foreign key (user_id) references profiles(id) on delete set null;

-- ─── Task activities ──────────────────────────────────────────────────────────
alter table task_activities
  drop constraint if exists task_activities_user_id_fkey;

alter table task_activities
  add constraint task_activities_user_id_fkey
  foreign key (user_id) references profiles(id) on delete set null;

-- ─── Projects & workflow templates / steps / instances ────────────────────────
alter table projects
  drop constraint if exists projects_created_by_fkey;

alter table projects
  add constraint projects_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;

alter table workflow_templates
  drop constraint if exists workflow_templates_created_by_fkey;

alter table workflow_templates
  add constraint workflow_templates_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;

alter table workflow_steps
  drop constraint if exists workflow_steps_assigned_user_id_fkey;

alter table workflow_steps
  add constraint workflow_steps_assigned_user_id_fkey
  foreign key (assigned_user_id) references profiles(id) on delete set null;

alter table workflow_instances
  drop constraint if exists workflow_instances_started_by_fkey;

alter table workflow_instances
  add constraint workflow_instances_started_by_fkey
  foreign key (started_by) references profiles(id) on delete set null;

-- ─── Tasks ────────────────────────────────────────────────────────────────────
alter table tasks
  drop constraint if exists tasks_assigned_to_fkey,
  drop constraint if exists tasks_approved_by_fkey,
  drop constraint if exists tasks_approver_id_fkey;

alter table tasks
  add constraint tasks_assigned_to_fkey
  foreign key (assigned_to) references profiles(id) on delete set null,
  add constraint tasks_approved_by_fkey
  foreign key (approved_by) references profiles(id) on delete set null,
  add constraint tasks_approver_id_fkey
  foreign key (approver_id) references profiles(id) on delete set null;

-- ─── Workflow step per-step approver (020) ────────────────────────────────────
alter table workflow_steps
  drop constraint if exists workflow_steps_approver_id_fkey;

alter table workflow_steps
  add constraint workflow_steps_approver_id_fkey
  foreign key (approver_id) references profiles(id) on delete set null;
