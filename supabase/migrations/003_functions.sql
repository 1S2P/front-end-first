-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, email, initials, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 1) ||
          coalesce(split_part(new.raw_user_meta_data->>'name', ' ', 2), '')),
    'team_member'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Workflow Engine: advance workflow after task completion ──────────────────
create or replace function advance_workflow()
returns trigger language plpgsql security definer as $$
declare
  v_instance    workflow_instances%rowtype;
  v_template    workflow_templates%rowtype;
  v_next_step   workflow_steps%rowtype;
  v_next_index  integer;
  v_new_task_id uuid;
begin
  -- Only fire when status changes to 'completed'
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  if new.workflow_instance_id is null then
    return new;
  end if;

  select * into v_instance from workflow_instances where id = new.workflow_instance_id;
  select * into v_template from workflow_templates where id = v_instance.template_id;

  v_next_index := new.workflow_step_index + 1;

  -- Get next step
  select * into v_next_step
  from workflow_steps
  where template_id = v_instance.template_id
    and step_order = v_next_index
  limit 1;

  if not found then
    -- No more steps — mark instance complete
    update workflow_instances set status = 'completed' where id = v_instance.id;
    -- Notify workflow starter
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

  -- Update instance current step
  update workflow_instances
  set current_step_index = v_next_index
  where id = v_instance.id;

  -- Create next task
  insert into tasks (
    title, description, status, priority,
    brand_id, project_id, department_id,
    workflow_instance_id, workflow_step_id, workflow_step_index,
    assigned_to, approval_required,
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
    case when v_next_step.deadline_offset is not null
         then (now() + (v_next_step.deadline_offset || ' hours')::interval)::date
         else null end,
    v_next_step.estimated_time
  ) returning id into v_new_task_id;

  -- Copy checklist items from step template
  insert into task_checklist_items (task_id, label, sort_order)
  select v_new_task_id, label, sort_order
  from step_checklist_items
  where step_id = v_next_step.id;

  -- Log activity
  insert into task_activities (task_id, action, user_id, description)
  values (v_new_task_id, 'task_assigned', v_instance.started_by,
          'Task automatically assigned by workflow engine');

  -- Notify assigned user
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

create trigger workflow_advance_trigger
  after update of status on tasks
  for each row execute function advance_workflow();

-- ─── Workflow Engine: start workflow (creates first task) ─────────────────────
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

  -- Create instance
  insert into workflow_instances (template_id, project_id, brand_id, started_by)
  values (p_template_id, p_project_id, p_brand_id, p_started_by)
  returning id into v_instance_id;

  -- Get first step (step_order = 0)
  select * into v_first_step
  from workflow_steps
  where template_id = p_template_id
  order by step_order asc
  limit 1;

  if not found then
    return v_instance_id;
  end if;

  -- Create first task
  insert into tasks (
    title, description, status, priority,
    brand_id, project_id, department_id,
    workflow_instance_id, workflow_step_id, workflow_step_index,
    assigned_to, approval_required,
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
    case when v_first_step.deadline_offset is not null
         then (now() + (v_first_step.deadline_offset || ' hours')::interval)::date
         else null end,
    v_first_step.estimated_time
  ) returning id into v_task_id;

  -- Copy checklist
  insert into task_checklist_items (task_id, label, sort_order)
  select v_task_id, label, sort_order
  from step_checklist_items
  where step_id = v_first_step.id;

  -- Log activity
  insert into task_activities (task_id, action, user_id, description)
  values (v_task_id, 'workflow_started', p_started_by,
          'Workflow "' || v_template.name || '" started');

  -- Notify assigned user
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

  -- Increment usage count
  update workflow_templates set usage_count = usage_count + 1 where id = p_template_id;

  return v_instance_id;
end;
$$;

-- ─── Task submission ──────────────────────────────────────────────────────────
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

    -- Notify approver (admin or team lead of department)
    insert into notifications (type, title, message, task_id, user_id)
    select 'waiting_review', 'Waiting for Review',
           '"' || v_task.title || '" is waiting for your review',
           p_task_id, p.id
    from profiles p
    where p.role = 'admin'
    limit 1;
  else
    update tasks set status = 'completed', submitted_at = now(), reviewed_at = now()
    where id = p_task_id;

    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'completed', auth.uid(), 'Task completed');
  end if;
end;
$$;

-- ─── Withdraw submission ──────────────────────────────────────────────────────
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

  -- Notify reviewer
  insert into notifications (type, title, message, task_id, user_id)
  select 'submission_withdrawn', 'Submission Withdrawn',
         '"' || v_task.title || '" submission was withdrawn',
         p_task_id, p.id
  from profiles p
  where p.role = 'admin'
  limit 1;
end;
$$;

-- ─── Review task (approve / reject / request_changes / redo) ──────────────────
create or replace function review_task(
  p_task_id uuid,
  p_action  text  -- 'approve' | 'reject' | 'request_changes' | 'redo'
) returns void language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task from tasks where id = p_task_id;

  if not is_admin() and get_my_role() <> 'team_lead' then
    raise exception 'Not authorized to review tasks';
  end if;

  if p_action = 'redo' then
    -- Reset task to in_progress, uncheck checklist, clear submission
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

-- ─── Enum updates for redo support ──────────────────────────────────────────
alter type activity_action add value if not exists 'redo';
alter type notification_type add value if not exists 'redo_requested';

-- ─── Realtime: enable for notifications and tasks ────────────────────────────
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_activities;
