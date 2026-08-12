-- ─── Enable RLS on all tables ─────────────────────────────────────────────────
alter table brands               enable row level security;
alter table departments          enable row level security;
alter table department_brands    enable row level security;
alter table profiles             enable row level security;
alter table profile_brands       enable row level security;
alter table projects             enable row level security;
alter table workflow_templates   enable row level security;
alter table workflow_steps       enable row level security;
alter table step_checklist_items enable row level security;
alter table workflow_connections  enable row level security;
alter table workflow_instances   enable row level security;
alter table tasks                enable row level security;
alter table task_checklist_items enable row level security;
alter table task_attachments     enable row level security;
alter table task_comments        enable row level security;
alter table task_activities      enable row level security;
alter table notifications        enable row level security;

-- ─── Helper: get current user role ───────────────────────────────────────────
create or replace function get_my_role()
returns system_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select get_my_role() = 'admin'
$$;

-- ─── Brands: everyone authenticated can read ─────────────────────────────────
create policy "brands_read" on brands for select to authenticated using (true);
create policy "brands_write" on brands for all to authenticated using (is_admin());

-- ─── Departments ─────────────────────────────────────────────────────────────
create policy "departments_read" on departments for select to authenticated using (true);
create policy "departments_write" on departments for all to authenticated using (is_admin());
create policy "dept_brands_read" on department_brands for select to authenticated using (true);
create policy "dept_brands_write" on department_brands for all to authenticated using (is_admin());

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Everyone can read profiles (needed for task assignment display)
create policy "profiles_read" on profiles for select to authenticated using (true);
-- Users can update their own profile; admins can update any
create policy "profiles_update_own" on profiles for update to authenticated
  using (id = auth.uid() or is_admin());
-- Only admins can insert/delete profiles
create policy "profiles_insert" on profiles for insert to authenticated
  with check (is_admin());
create policy "profiles_delete" on profiles for delete to authenticated
  using (is_admin());

create policy "profile_brands_read" on profile_brands for select to authenticated using (true);
create policy "profile_brands_write" on profile_brands for all to authenticated using (is_admin());

-- ─── Projects ────────────────────────────────────────────────────────────────
-- Users see projects for brands they belong to
create policy "projects_read" on projects for select to authenticated
  using (
    is_admin() or
    exists (
      select 1 from profile_brands pb
      where pb.profile_id = auth.uid() and pb.brand_id = projects.brand_id
    )
  );
create policy "projects_write" on projects for all to authenticated using (is_admin());

-- ─── Workflow Templates ───────────────────────────────────────────────────────
create policy "wf_templates_read" on workflow_templates for select to authenticated
  using (
    is_admin() or
    exists (
      select 1 from profile_brands pb
      where pb.profile_id = auth.uid() and pb.brand_id = workflow_templates.brand_id
    )
  );
create policy "wf_templates_write" on workflow_templates for all to authenticated using (is_admin());

create policy "wf_steps_read" on workflow_steps for select to authenticated using (true);
create policy "wf_steps_write" on workflow_steps for all to authenticated using (is_admin());

create policy "step_checklist_read" on step_checklist_items for select to authenticated using (true);
create policy "step_checklist_write" on step_checklist_items for all to authenticated using (is_admin());

create policy "wf_connections_read" on workflow_connections for select to authenticated using (true);
create policy "wf_connections_write" on workflow_connections for all to authenticated using (is_admin());

-- ─── Workflow Instances ───────────────────────────────────────────────────────
create policy "wf_instances_read" on workflow_instances for select to authenticated
  using (
    is_admin() or
    exists (
      select 1 from profile_brands pb
      where pb.profile_id = auth.uid() and pb.brand_id = workflow_instances.brand_id
    )
  );
create policy "wf_instances_write" on workflow_instances for all to authenticated using (is_admin());

-- ─── Tasks ───────────────────────────────────────────────────────────────────
-- Team members see only their own tasks
-- Team leads see tasks in their department
-- Admins see all tasks
create policy "tasks_read" on tasks for select to authenticated
  using (
    is_admin() or
    assigned_to = auth.uid() or
    (
      get_my_role() = 'team_lead' and
      exists (
        select 1 from profiles p
        where p.id = auth.uid() and p.department_id = tasks.department_id
      )
    )
  );

-- Tasks are created/updated by the system (admin or workflow engine via service role)
create policy "tasks_insert" on tasks for insert to authenticated with check (is_admin());
create policy "tasks_update" on tasks for update to authenticated
  using (is_admin() or assigned_to = auth.uid() or approved_by = auth.uid());

-- ─── Task sub-tables ─────────────────────────────────────────────────────────
create policy "task_checklist_read" on task_checklist_items for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (get_my_role() = 'team_lead' and exists (
      select 1 from profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));
create policy "task_checklist_update" on task_checklist_items for update to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.assigned_to = auth.uid()));
create policy "task_checklist_insert" on task_checklist_items for insert to authenticated
  with check (is_admin());

create policy "task_attachments_read" on task_attachments for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (get_my_role() = 'team_lead' and exists (
      select 1 from profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));
create policy "task_attachments_insert" on task_attachments for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and t.assigned_to = auth.uid()));

create policy "task_comments_read" on task_comments for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (get_my_role() = 'team_lead' and exists (
      select 1 from profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));
create policy "task_comments_insert" on task_comments for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (get_my_role() = 'team_lead' and exists (
      select 1 from profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

create policy "task_activities_read" on task_activities for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and (
    is_admin() or t.assigned_to = auth.uid() or
    (get_my_role() = 'team_lead' and exists (
      select 1 from profiles p where p.id = auth.uid() and p.department_id = t.department_id
    ))
  )));

-- ─── Notifications ────────────────────────────────────────────────────────────
create policy "notifications_read" on notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_update" on notifications for update to authenticated
  using (user_id = auth.uid());
