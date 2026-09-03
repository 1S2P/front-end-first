-- ─── 019: Let a department's team lead read & interact with review tasks ────────
-- The tasks_read RLS policy requires the 'dashboard_department_tasks' permission
-- for a non-admin to read department tasks. Department team leads act as reviewers
-- (approve / reassign) but may not have that dashboard permission granted, so the
-- review queue and task detail were invisible to them.
--
-- This adds team-lead-based read (and comment/activity insert) access scoped to
-- the team lead's own department, independent of dashboard permissions. Review
-- actions (approve/reject/reassign) already run through the security-definer
-- review_task RPC, so they are unaffected by RLS.

-- Helper: is the current user a team lead of the given task's department?
create or replace function is_dept_team_lead(p_task_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1
    from tasks t
    join profiles p on p.department_id = t.department_id
    where t.id = p_task_id
      and p.id = auth.uid()
      and p.role = 'team_lead'
  )
$$;

-- Tasks
create policy "tasks_read_team_lead_dept" on tasks
  for select to authenticated
  using (is_dept_team_lead(id));

-- Checklist
create policy "task_checklist_read_team_lead_dept" on task_checklist_items
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and is_dept_team_lead(t.id)));

-- Attachments
create policy "task_attachments_read_team_lead_dept" on task_attachments
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and is_dept_team_lead(t.id)));

-- Comments: read + insert (a team lead may discuss a task they are reviewing)
create policy "task_comments_read_team_lead_dept" on task_comments
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and is_dept_team_lead(t.id)));

create policy "task_comments_insert_team_lead_dept" on task_comments
  for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and is_dept_team_lead(t.id)));

-- Activities: read + insert
create policy "task_activities_read_team_lead_dept" on task_activities
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and is_dept_team_lead(t.id)));

create policy "task_activities_insert_team_lead_dept" on task_activities
  for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and is_dept_team_lead(t.id)));
