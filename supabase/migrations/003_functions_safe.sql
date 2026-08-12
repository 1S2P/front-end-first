-- Safe migration: skips existing objects, creates missing ones
-- Run this in Supabase SQL Editor

-- ─── Functions (CREATE OR REPLACE = safe to re-run) ──────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name     text;
  v_initials text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_initials := upper(
    left(v_name, 1) ||
    coalesce(left(trim(split_part(v_name, ' ', 2)), 1), '')
  );

  insert into profiles (id, name, email, initials, role)
  values (new.id, v_name, new.email, v_initials, 'team_member')
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function advance_workflow()
returns trigger language plpgsql security definer as $$
declare
  v_instance    workflow_instances%rowtype;
  v_template    workflow_templates%rowtype;
  v_next_step   workflow_steps%rowtype;
  v_next_index  integer;
  v_new_task_id uuid;
begin
  if new.status <> 'completed' or old.status = 'completed' then
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
  where template_id = v_instance.template_id and step_order = v_next_index
  limit 1;
  if not found then
    update workflow_instances set status = 'completed' where id = v_instance.id;
    insert into notifications (type, title, message, task_id, user_id)
    values ('workflow_completed', 'Workflow Completed',
            'Workflow "' || v_template.name || '" has been completed.', null, v_instance.started_by);
    return new;
  end if;
  update workflow_instances set current_step_index = v_next_index where id = v_instance.id;
  insert into tasks (
    title, description, status, priority, brand_id, project_id, department_id,
    workflow_instance_id, workflow_step_id, workflow_step_index,
    assigned_to, approval_required, due_date, estimated_time
  ) values (
    v_next_step.name, v_next_step.description, 'ready', 'medium',
    v_instance.brand_id, v_instance.project_id, v_next_step.department_id,
    v_instance.id, v_next_step.id, v_next_index,
    v_next_step.assigned_user_id, v_next_step.approval_required,
    case when v_next_step.deadline_offset is not null and v_next_step.deadline_offset <> ''
         then (now() + v_next_step.deadline_offset::interval)::date
         else null end,
    v_next_step.estimated_time
  ) returning id into v_new_task_id;
  insert into task_checklist_items (task_id, label, sort_order)
  select v_new_task_id, label, sort_order
  from step_checklist_items where step_id = v_next_step.id;
  insert into task_activities (task_id, action, user_id, description)
  values (v_new_task_id, 'task_assigned', v_instance.started_by, 'Task automatically assigned by workflow engine');
  if v_next_step.assigned_user_id is not null then
    insert into notifications (type, title, message, task_id, user_id)
    values ('task_assigned', 'New Task Assigned',
            'You have been assigned "' || v_next_step.name || '"',
            v_new_task_id, v_next_step.assigned_user_id);
  end if;
  return new;
end;
$$;

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
  order by step_order asc limit 1;
  if not found then
    return v_instance_id;
  end if;
  insert into tasks (
    title, description, status, priority, brand_id, project_id, department_id,
    workflow_instance_id, workflow_step_id, workflow_step_index,
    assigned_to, approval_required, due_date, estimated_time
  ) values (
    v_first_step.name, v_first_step.description, 'ready', 'medium',
    p_brand_id, p_project_id, v_first_step.department_id,
    v_instance_id, v_first_step.id, 0,
    v_first_step.assigned_user_id, v_first_step.approval_required,
    case when v_first_step.deadline_offset is not null and v_first_step.deadline_offset <> ''
         then (now() + v_first_step.deadline_offset::interval)::date
         else null end,
    v_first_step.estimated_time
  ) returning id into v_task_id;
  insert into task_checklist_items (task_id, label, sort_order)
  select v_task_id, label, sort_order
  from step_checklist_items where step_id = v_first_step.id;
  insert into task_activities (task_id, action, user_id, description)
  values (v_task_id, 'workflow_started', p_started_by, 'Workflow "' || v_template.name || '" started');
  if v_first_step.assigned_user_id is not null then
    insert into notifications (type, title, message, task_id, user_id)
    values ('task_assigned', 'New Task Assigned',
            'You have been assigned "' || v_first_step.name || '"',
            v_task_id, v_first_step.assigned_user_id);
  end if;
  update workflow_templates set usage_count = usage_count + 1 where id = p_template_id;
  return v_instance_id;
end;
$$;

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
    insert into notifications (type, title, message, task_id, user_id)
    select 'waiting_review', 'Waiting for Review',
           '"' || v_task.title || '" is waiting for your review',
           p_task_id, p.id
    from profiles p where p.role = 'admin' limit 1;
  else
    update tasks set status = 'completed', submitted_at = now(), reviewed_at = now() where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'completed', auth.uid(), 'Task completed');
  end if;
end;
$$;

create or replace function withdraw_submission(p_task_id uuid)
returns void language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task from tasks where id = p_task_id;
  if v_task.assigned_to <> auth.uid() then
    raise exception 'Not authorized';
  end if;
  if v_task.status <> 'waiting_review' then
    raise exception 'Task is not in waiting_review status';
  end if;
  if v_task.reviewed_at is not null then
    raise exception 'Review already started, cannot withdraw';
  end if;
  update tasks set status = 'in_progress', submitted_at = null where id = p_task_id;
  insert into task_activities (task_id, action, user_id, description)
  values (p_task_id, 'withdrawn', auth.uid(), 'Submission withdrawn');
  insert into notifications (type, title, message, task_id, user_id)
  select 'submission_withdrawn', 'Submission Withdrawn',
         '"' || v_task.title || '" submission was withdrawn',
         p_task_id, p.id
  from profiles p where p.role = 'admin' limit 1;
end;
$$;

create or replace function review_task(
  p_task_id uuid,
  p_action  text
) returns void language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task from tasks where id = p_task_id;
  if not is_admin() and get_my_role() <> 'team_lead' then
    raise exception 'Not authorized to review tasks';
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
  elsif p_action = 'request_changes' then
    update tasks set status = 'needs_revision' where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'revision_requested', auth.uid(), 'Revision requested');
    insert into notifications (type, title, message, task_id, user_id)
    values ('revision_requested', 'Revision Requested',
            'Changes requested on "' || v_task.title || '"',
            p_task_id, v_task.assigned_to);
  end if;
end;
$$;

-- ─── Triggers (drop + recreate to avoid "already exists" error) ──────────────

-- Trigger 1: auto-create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Trigger 2: advance workflow on task completion
drop trigger if exists workflow_advance_trigger on tasks;
create trigger workflow_advance_trigger
  after update of status on tasks
  for each row execute function advance_workflow();

-- ─── Grants ─────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION start_workflow(uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_task(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_submission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION review_task(uuid, text) TO authenticated;

-- ─── Realtime (safe to re-run) ──────────────────────────────────────────────
-- Ignore errors if already added
DO $$ BEGIN
  alter publication supabase_realtime add table notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  alter publication supabase_realtime add table tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  alter publication supabase_realtime add table task_activities;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
