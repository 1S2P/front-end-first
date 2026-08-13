-- ─── 011: Deadlines are specified in days, not hours ──────────────────────────
-- Previously deadline_offset was appended with ' hours' (e.g. "24" = 24 hours)
-- while the builder suggested "24 hours, 2 days". To match the UI, deadlines are
-- now interpreted as a number of DAYS. For backwards compatibility a plain number
-- is treated as days, and any full interval string ("3 days", "72 hours") is
-- still accepted.

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
  where template_id = v_instance.template_id
    and step_order = v_next_index
  limit 1;

  if not found then
    update workflow_instances set status = 'completed' where id = v_instance.id;
    -- Only when the whole workflow finishes do the tasks stay completed.
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

  -- Carry comments from the completed task so the next step keeps context
  insert into task_comments (task_id, user_id, text, created_at)
  select v_new_task_id, user_id, text, created_at
  from task_comments
  where task_id = new.id;

  -- Carry attached files from the completed task so the next step (usually the
  -- review step) can see what was produced
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
    case when v_first_step.deadline_offset is not null and v_first_step.deadline_offset <> ''
         then (now() + (
           case when v_first_step.deadline_offset ~ '^[0-9]+(\.[0-9]+)?$'
                then (v_first_step.deadline_offset || ' days')::interval
                else v_first_step.deadline_offset::interval
           end
         ))::date
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
