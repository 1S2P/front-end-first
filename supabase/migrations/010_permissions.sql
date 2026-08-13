-- ─── 010: Granular per-employee permissions ───────────────────────────────────
-- Replaces the fixed role-based access (admin / team_lead / team_member) with an
-- admin-assignable permission catalog. Admins still bypass every check.
--
-- Design:
--   * permissions        : read-only catalog of assignable permissions.
--   * profile_permissions: which permissions each profile has been granted.
--   * has_permission(p)  : security-definer helper used by RLS policies, server
--                          functions and the review_task RPC.
--   * RLS write policies that were previously "admin only" now map to specific
--     permissions so they can be granted to any employee.

-- ─── 1. Permission catalog ────────────────────────────────────────────────────
create table if not exists public.permissions (
  id          text primary key,
  group_name  text not null,
  name        text not null,
  description text not null default '',
  sort_order  integer not null default 0
);

-- ─── 2. Per-profile assignments ───────────────────────────────────────────────
create table if not exists public.profile_permissions (
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  permission_id text not null references public.permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (profile_id, permission_id)
);

-- ─── 3. Seed the permission catalog ───────────────────────────────────────────
insert into public.permissions (id, group_name, name, description, sort_order) values
  -- Workflow
  ('workflow_builder_access', 'Workflow', 'Access Workflow Builder', 'Open the visual workflow builder', 1),
  ('workflow_create',        'Workflow', 'Create Workflows',         'Create new workflow templates', 2),
  ('workflow_edit',          'Workflow', 'Edit Workflows',           'Edit existing workflow templates', 3),
  ('workflow_delete',        'Workflow', 'Delete Workflows',         'Delete workflow templates', 4),
  ('workflow_start',         'Workflow', 'Start Workflows',          'Start workflow instances on projects', 5),
  -- Tasks
  ('tasks_view',           'Tasks', 'View Assigned Tasks', 'See tasks assigned to you', 1),
  ('tasks_complete',       'Tasks', 'Complete Tasks',      'Mark tasks as complete', 2),
  ('tasks_submit_review',  'Tasks', 'Submit for Review',   'Submit tasks for approval', 3),
  ('tasks_upload_files',   'Tasks', 'Upload Files',        'Attach files to tasks', 4),
  ('tasks_comment',        'Tasks', 'Comment',             'Add comments to tasks', 5),
  ('tasks_review',         'Tasks', 'Review & Approve',    'Approve, reject or request changes on submitted tasks', 6),
  -- Dashboard
  ('dashboard_personal',            'Dashboard', 'View Personal Dashboard',   'See your personal dashboard', 1),
  ('dashboard_department_tasks',    'Dashboard', 'View Department Tasks',     'See all tasks in your department', 2),
  ('dashboard_department_progress', 'Dashboard', 'View Department Progress',  'See department progress analytics', 3),
  ('dashboard_all_projects',        'Dashboard', 'View All Projects',         'See every project across brands', 4),
  ('dashboard_all_workflows',       'Dashboard', 'View All Workflows',        'See every workflow across brands', 5),
  -- Reports
  ('reports_view',     'Reports', 'View Reports',      'Access the reports page', 1),
  ('reports_analytics','Reports', 'View Analytics',    'See analytics charts and stats', 2),
  ('reports_export',   'Reports', 'Export Reports',    'Export report data', 3),
  -- Admin
  ('admin_manage_brands',      'Admin', 'Manage Brands',        'Create and edit brands', 1),
  ('admin_manage_departments', 'Admin', 'Manage Departments',   'Create and edit departments', 2),
  ('admin_manage_employees',   'Admin', 'Manage Employees',     'Invite, edit and remove employees', 3),
  ('admin_assign_permissions', 'Admin', 'Assign Permissions',   'Grant or revoke permissions for any employee', 4),
  ('admin_manage_projects',    'Admin', 'Manage Projects',      'Create, edit and archive projects', 5),
  ('admin_settings',           'Admin', 'Configure Settings',   'Platform-wide settings', 6)
on conflict (id) do nothing;

-- ─── 4. has_permission() helper ───────────────────────────────────────────────
-- Returns true for any admin, otherwise only if the permission is explicitly
-- granted to the current user. SECURITY DEFINER so policies may call it without
-- recursion.
create or replace function has_permission(p_permission text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and (
        pr.role = 'admin'
        or exists (
          select 1
          from public.profile_permissions pp
          where pp.profile_id = pr.id and pp.permission_id = p_permission
        )
      )
  )
$$;

-- ─── 5. RLS for the new tables ────────────────────────────────────────────────
alter table public.permissions        enable row level security;
alter table public.profile_permissions enable row level security;

create policy "permissions_read" on public.permissions
  for select to authenticated using (true);

-- Users may read their own grants; anyone with the Assign Permissions permission
-- (admins included) may read any profile's grants.
create policy "profile_permissions_read" on public.profile_permissions
  for select to authenticated
  using (profile_id = auth.uid() or has_permission('admin_assign_permissions'));

create policy "profile_permissions_write" on public.profile_permissions
  for all to authenticated
  using (has_permission('admin_assign_permissions'))
  with check (has_permission('admin_assign_permissions'));

-- ─── 6. Migrate existing admin-only policies to permission checks ─────────────
-- Brands
drop policy if exists "brands_write" on brands;
create policy "brands_write" on brands for all to authenticated
  using (has_permission('admin_manage_brands'));

-- Departments
drop policy if exists "departments_write" on departments;
create policy "departments_write" on departments for all to authenticated
  using (has_permission('admin_manage_departments'));
drop policy if exists "dept_brands_write" on department_brands;
create policy "dept_brands_write" on department_brands for all to authenticated
  using (has_permission('admin_manage_departments'));

-- Profiles
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update to authenticated
  using (id = auth.uid() or has_permission('admin_manage_employees'));
drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert" on profiles for insert to authenticated
  with check (has_permission('admin_manage_employees'));
drop policy if exists "profiles_delete" on profiles;
create policy "profiles_delete" on profiles for delete to authenticated
  using (has_permission('admin_manage_employees'));
drop policy if exists "profile_brands_write" on profile_brands;
create policy "profile_brands_write" on profile_brands for all to authenticated
  using (has_permission('admin_manage_employees'));

-- Projects
drop policy if exists "projects_write" on projects;
create policy "projects_write" on projects for all to authenticated
  using (has_permission('admin_manage_projects'));

-- Workflow templates, steps, checklists, connections
drop policy if exists "wf_templates_write" on workflow_templates;
create policy "wf_templates_write" on workflow_templates for all to authenticated
  using (has_permission('workflow_create') or has_permission('workflow_edit'));
drop policy if exists "wf_steps_write" on workflow_steps;
create policy "wf_steps_write" on workflow_steps for all to authenticated
  using (has_permission('workflow_create') or has_permission('workflow_edit'));
drop policy if exists "step_checklist_write" on step_checklist_items;
create policy "step_checklist_write" on step_checklist_items for all to authenticated
  using (has_permission('workflow_create') or has_permission('workflow_edit'));
drop policy if exists "wf_connections_write" on workflow_connections;
create policy "wf_connections_write" on workflow_connections for all to authenticated
  using (has_permission('workflow_create') or has_permission('workflow_edit'));

-- Workflow instances (starting workflows)
drop policy if exists "wf_instances_write" on workflow_instances;
create policy "wf_instances_write" on workflow_instances for all to authenticated
  using (has_permission('workflow_start'));

-- ─── 7. Tasks: department-wide access now comes from a permission ─────────────
drop policy if exists "tasks_read" on tasks;
create policy "tasks_read" on tasks for select to authenticated
  using (
    is_admin() or
    assigned_to = auth.uid() or
    (
      has_permission('dashboard_department_tasks') and
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.department_id = tasks.department_id
      )
    )
  );

drop policy if exists "task_checklist_read" on task_checklist_items;
create policy "task_checklist_read" on task_checklist_items for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (has_permission('dashboard_department_tasks') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

drop policy if exists "task_attachments_read" on task_attachments;
create policy "task_attachments_read" on task_attachments for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (has_permission('dashboard_department_tasks') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

drop policy if exists "task_comments_read" on task_comments;
create policy "task_comments_read" on task_comments for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (has_permission('dashboard_department_tasks') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

drop policy if exists "task_comments_insert" on task_comments;
create policy "task_comments_insert" on task_comments for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (has_permission('dashboard_department_tasks') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

drop policy if exists "task_activities_read" on task_activities;
create policy "task_activities_read" on task_activities for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (has_permission('dashboard_department_tasks') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

drop policy if exists "task_activities_insert" on task_activities;
create policy "task_activities_insert" on task_activities for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (has_permission('dashboard_department_tasks') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

-- Reviewers (permission holders) can tick checklist items on any task they can see
drop policy if exists "task_checklist_update" on task_checklist_items;
create policy "task_checklist_update" on task_checklist_items for update to authenticated
  using (exists (
    select 1 from tasks t
    where t.id = task_id and (t.assigned_to = auth.uid() or has_permission('tasks_review'))
  ));

-- ─── 8. review_task: permission-based review gate ─────────────────────────────
-- Anyone with the "Review & Approve" permission may review, except on their own
-- submitted task (blocks self-approval). Admins may still review tasks assigned
-- to them, preserving the "admin signs off" behaviour.
drop function if exists review_task(uuid, text, uuid);
create function review_task(
  p_task_id uuid,
  p_action  text,
  p_assignee_id uuid default null
) returns void language plpgsql security definer as $$
declare
  v_task     tasks%rowtype;
  v_assignee uuid;
begin
  select * into v_task from tasks where id = p_task_id;

  if not is_admin()
     and (not has_permission('tasks_review') or v_task.assigned_to = auth.uid()) then
    raise exception 'Not authorized to review this task';
  end if;

  if p_action = 'redo' then
    update tasks set status = 'in_progress', submitted_at = null, reviewed_at = null
    where id = p_task_id;
    update task_checklist_items set checked = false where task_id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'redo', auth.uid(), 'Admin requested redo — task reset to in progress');
    insert into notifications (type, title, message, task_id, user_id)
    values ('redo_requested', 'Redo Requested',
            'Please redo "' || v_task.title || '"',
            p_task_id, v_task.assigned_to);
    return;
  end if;

  if p_action = 'request_changes' then
    -- Prefer the explicitly chosen assignee, then the previous step's assignee,
    -- then fall back to the current assignee.
    v_assignee := coalesce(
      p_assignee_id,
      case when v_task.workflow_instance_id is not null then
        (select ws.assigned_user_id
         from workflow_steps ws
         join workflow_instances wi on wi.template_id = ws.template_id
         where wi.id = v_task.workflow_instance_id
           and ws.step_order = v_task.workflow_step_index - 1
         limit 1)
      else null end,
      v_task.assigned_to
    );

    update tasks
    set status = 'needs_revision', submitted_at = null, reviewed_at = null,
        approved_by = null, assigned_to = v_assignee
    where id = p_task_id;

    -- The workflow is no longer finished: previously completed sibling steps
    -- must not stay completed until the whole workflow completes again.
    if v_task.workflow_instance_id is not null then
      update tasks set status = 'approved'
      where workflow_instance_id = v_task.workflow_instance_id
        and status = 'completed';
      update workflow_instances set status = 'running'
      where id = v_task.workflow_instance_id;
    end if;

    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'revision_requested', auth.uid(),
            'Changes requested — reassigned for revision');

    if v_assignee is not null then
      insert into notifications (type, title, message, task_id, user_id)
      values ('revision_requested', 'Revision Requested',
              'Changes requested on "' || v_task.title || '"',
              p_task_id, v_assignee);
    end if;
    return;
  end if;

  update tasks set reviewed_at = now(), approved_by = auth.uid() where id = p_task_id;

  if p_action = 'approve' then
    update tasks set status = 'completed' where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'approved', auth.uid(), 'Task approved');
    insert into notifications (type, title, message, task_id, user_id)
    values ('task_approved', 'Task Approved', '"' || v_task.title || '" has been approved',
            p_task_id, v_task.assigned_to);

  elsif p_action = 'reject' then
    update tasks set status = 'rejected' where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'rejected', auth.uid(), 'Task rejected');
    insert into notifications (type, title, message, task_id, user_id)
    values ('task_rejected', 'Task Rejected', '"' || v_task.title || '" has been rejected',
            p_task_id, v_task.assigned_to);
  end if;
end;
$$;
