-- ─── 020: Per-step specific-employee approver ──────────────────────────────────
-- Replaces the role-based approver model (approver_role 'team_lead'/'admin')
-- with a specific-employee model. Every approval-required step now stores an
-- approver_id (the profile that must sign off):
--   * approver_id IS NULL -> review goes to any admin.
--   * approver_id IS SET  -> review goes ONLY to that employee (no admin override).
-- The chosen id is copied onto the task when a step is created so submit_task
-- and review_task can route + authorize without re-joining the template.

-- ─── 1. Columns ───────────────────────────────────────────────────────────────
alter table workflow_steps
  add column if not exists approver_id uuid references profiles(id);

alter table tasks
  add column if not exists approver_id uuid references profiles(id);

-- ─── 2. RLS: let the designated approver read & interact with the task ──────
-- A specific employee approver may be any employee (any department), so grant
-- read access independent of assignment / department / dashboard permissions.
drop policy if exists "tasks_read_approver" on tasks;
create policy "tasks_read_approver" on tasks
  for select to authenticated
  using (approver_id = auth.uid());

drop policy if exists "task_checklist_read_approver" on task_checklist_items;
create policy "task_checklist_read_approver" on task_checklist_items
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.approver_id = auth.uid()));

drop policy if exists "task_attachments_read_approver" on task_attachments;
create policy "task_attachments_read_approver" on task_attachments
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.approver_id = auth.uid()));

drop policy if exists "task_comments_read_approver" on task_comments;
create policy "task_comments_read_approver" on task_comments
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.approver_id = auth.uid()));

create policy "task_comments_insert_approver" on task_comments
  for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and t.approver_id = auth.uid()));

drop policy if exists "task_activities_read_approver" on task_activities;
create policy "task_activities_read_approver" on task_activities
  for select to authenticated
  using (exists (select 1 from tasks t where t.id = task_id and t.approver_id = auth.uid()));

create policy "task_activities_insert_approver" on task_activities
  for insert to authenticated
  with check (exists (select 1 from tasks t where t.id = task_id and t.approver_id = auth.uid()));

-- ─── 3. start_workflow: copy approver_id onto the created first task ─────────
create or replace function start_workflow(
  p_template_id uuid,
  p_project_id  uuid,
  p_brand_id    text,
  p_started_by  uuid
) returns uuid language plpgsql security definer as $$
declare
  v_instance_id uuid;
  v_first_step  workflow_steps%rowtype;
  v_template    workflow_templates%rowtype;
  v_task_id     uuid;
begin
  select * into v_template from workflow_templates where id = p_template_id;

  insert into workflow_instances (template_id, project_id, brand_id, started_by)
  values (p_template_id, p_project_id, p_brand_id, p_started_by)
  returning id into v_instance_id;

  select * into v_first_step
  from workflow_steps
  where template_id = p_template_id
  order by step_order asc
  limit 1;

  if not found then
    return v_instance_id;
  end if;

  insert into tasks (
    title, description, status, priority,
    brand_id, project_id, department_id,
    workflow_instance_id, workflow_step_id, workflow_step_index,
    assigned_to, approval_required, approver_role, approver_id,
    due_date, estimated_time
  ) values (
    v_first_step.name,
    v_first_step.description,
    'ready',
    'medium',
    p_brand_id,
    p_project_id,
    v_first_step.department_id,
    v_instance_id,
    v_first_step.id,
    0,
    v_first_step.assigned_user_id,
    v_first_step.approval_required,
    v_first_step.approver_role,
    v_first_step.approver_id,
    case when v_first_step.deadline_offset is not null
         then (now() + (v_first_step.deadline_offset || ' hours')::interval)::date
         else null end,
    v_first_step.estimated_time
  ) returning id into v_task_id;

  insert into task_checklist_items (task_id, label, sort_order)
  select v_task_id, label, sort_order
  from step_checklist_items
  where step_id = v_first_step.id;

  insert into task_activities (task_id, action, user_id, description)
  values (v_task_id, 'workflow_started', p_started_by,
          'Workflow "' || v_template.name || '" started');

  if v_first_step.assigned_user_id is not null then
    insert into notifications (type, title, message, task_id, user_id)
    values (
      'task_assigned',
      'New Task Assigned',
      'You have been assigned "' || v_first_step.name || '"',
      v_task_id,
      v_first_step.assigned_user_id
    );
  end if;

  update workflow_templates set usage_count = usage_count + 1 where id = p_template_id;

  return v_instance_id;
end;
$$;

-- ─── 4. advance_workflow: copy approver_id onto the next task ────────────────
create or replace function advance_workflow()
returns trigger language plpgsql security definer as $$
declare
  v_instance    workflow_instances%rowtype;
  v_template    workflow_templates%rowtype;
  v_next_step   workflow_steps%rowtype;
  v_next_index  integer;
  v_new_task_id uuid;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.status = 'completed' then
    if old.status = 'completed' then
      return new;
    end if;
  elsif new.status = 'waiting_review' and new.reviewed_at is not null then
    if old.reviewed_at is not null then
      return new;
    end if;
  else
    return new;
  end if;

  if new.workflow_instance_id is null then
    return new;
  end if;

  select * into v_instance from workflow_instances where id = new.workflow_instance_id;
  select * into v_template from workflow_templates where id = v_instance.template_id;

  v_next_index := new.workflow_step_index + 1;

  select * into v_next_step
  from workflow_steps
  where template_id = v_instance.template_id
    and step_order = v_next_index
  limit 1;

  if not found then
    update workflow_instances set status = 'completed' where id = v_instance.id;
    update tasks set status = 'completed'
    where workflow_instance_id = v_instance.id
      and status <> 'completed';
    insert into notifications (type, title, message, task_id, user_id)
    values (
      'workflow_completed',
      'Workflow Completed',
      'Workflow "' || v_template.name || '" has been completed.',
      null,
      v_instance.started_by
    );
    return new;
  end if;

  update workflow_instances
  set current_step_index = v_next_index
  where id = v_instance.id;

  insert into tasks (
    title, description, status, priority,
    brand_id, project_id, department_id,
    workflow_instance_id, workflow_step_id, workflow_step_index,
    assigned_to, approval_required, approver_role, approver_id,
    due_date, estimated_time
  ) values (
    v_next_step.name,
    v_next_step.description,
    'ready',
    'medium',
    v_instance.brand_id,
    v_instance.project_id,
    v_next_step.department_id,
    v_instance.id,
    v_next_step.id,
    v_next_index,
    v_next_step.assigned_user_id,
    v_next_step.approval_required,
    v_next_step.approver_role,
    v_next_step.approver_id,
    case when v_next_step.deadline_offset is not null and v_next_step.deadline_offset <> ''
         then (now() + (
           case when v_next_step.deadline_offset ~ '^[0-9]+(\.[0-9]+)?$'
                then (v_next_step.deadline_offset || ' days')::interval
                else v_next_step.deadline_offset::interval
           end
         ))::date
         else null end,
    v_next_step.estimated_time
  ) returning id into v_new_task_id;

  insert into task_checklist_items (task_id, label, sort_order)
  select v_new_task_id, label, sort_order
  from step_checklist_items
  where step_id = v_next_step.id;

  insert into task_comments (task_id, user_id, text, created_at)
  select v_new_task_id, user_id, text, created_at
  from task_comments
  where task_id = new.id;

  insert into task_attachments (task_id, name, type, size, storage_path, uploaded_by)
  select v_new_task_id, name, type, size, storage_path, uploaded_by
  from task_attachments
  where task_id = new.id;

  insert into task_activities (task_id, action, user_id, description)
  values (v_new_task_id, 'task_assigned', v_instance.started_by,
          'Task automatically assigned by workflow engine');

  if v_next_step.assigned_user_id is not null then
    insert into notifications (type, title, message, task_id, user_id)
    values (
      'task_assigned',
      'New Task Assigned',
      'You have been assigned "' || v_next_step.name || '"',
      v_new_task_id,
      v_next_step.assigned_user_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists workflow_advance_trigger on tasks;
create trigger workflow_advance_trigger
  after update of status, reviewed_at on tasks
  for each row execute function advance_workflow();

-- ─── 5. submit_task: route the review to the designated approver ──────────────
-- If the step picked a specific employee (approver_id set), notify that person.
-- Otherwise (null) notify an admin.
create or replace function submit_task(p_task_id uuid)
returns void language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task from tasks where id = p_task_id;
  if v_task.assigned_to <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if v_task.approval_required then
    update tasks set status = 'waiting_review', submitted_at = now() where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'submitted', auth.uid(), 'Task submitted for review');

    if v_task.approver_id is null then
      insert into notifications (type, title, message, task_id, user_id)
      select 'waiting_review', 'Waiting for Review',
             '"' || v_task.title || '" is waiting for your review',
             p_task_id, p.id
      from profiles p where p.role = 'admin' limit 1;
    else
      insert into notifications (type, title, message, task_id, user_id)
      values ('waiting_review', 'Waiting for Review',
              '"' || v_task.title || '" is waiting for your review',
              p_task_id, v_task.approver_id);
    end if;
  elsif v_task.workflow_instance_id is not null then
    update tasks set status = 'waiting_review', submitted_at = now(), reviewed_at = now()
    where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'completed', auth.uid(), 'Task submitted — workflow advanced');
  else
    update tasks set status = 'completed', submitted_at = now(), reviewed_at = now() where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'completed', auth.uid(), 'Task completed');
  end if;
end;
$$;

-- ─── 6. review_task: only the designated approver (or an admin for null) ─────
--   * approver_id null  : admins only.
--   * approver_id set   : only that specific employee (no admin override).
-- Nobody may review their own assignment.
create or replace function review_task(
  p_task_id uuid,
  p_action  text,
  p_assignee_id uuid default null
) returns void language plpgsql security definer as $$
declare
  v_task     tasks%rowtype;
  v_assignee uuid;
begin
  select * into v_task from tasks where id = p_task_id;

  -- Authorization: strictly by approver_id
  if v_task.assigned_to = auth.uid() then
    raise exception 'Not authorized to review this task';
  end if;

  if v_task.approver_id is null then
    if not is_admin() then
      raise exception 'Not authorized to review this task';
    end if;
  else
    if auth.uid() <> v_task.approver_id then
      raise exception 'Not authorized to review this task';
    end if;
  end if;

  if p_action = 'redo' then
    update tasks set status = 'in_progress', submitted_at = null, reviewed_at = null
    where id = p_task_id;
    update task_checklist_items set checked = false where task_id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'redo', auth.uid(), 'Reviewer requested redo — task reset to in progress');
    insert into notifications (type, title, message, task_id, user_id)
    values ('redo_requested', 'Redo Requested',
            'Please redo "' || v_task.title || '"',
            p_task_id, v_task.assigned_to);
    return;
  end if;

  if p_action = 'request_changes' then
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

    if v_task.workflow_instance_id is not null then
      update tasks set status = 'approved'
      where workflow_instance_id = v_task.workflow_instance_id
        and status = 'completed';
      update tasks
      set status = 'approved', reviewed_at = null, approved_by = null
      where workflow_instance_id = v_task.workflow_instance_id
        and status = 'waiting_review'
        and reviewed_at is not null;
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