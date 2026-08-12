-- ─── 008: Carry attachments forward between workflow steps ─────────────────────
-- When a workflow task is completed and the engine creates the next step's task,
-- it already copies comments so the next assignee keeps context. It must also
-- carry the attached files (e.g. the poster the designer uploaded) so the
-- reviewer actually sees them. Rows are inserted pointing at the same storage
-- object (task_attachments.storage_path has no uniqueness constraint), keeping
-- the uploader attribution intact.

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
    case when v_next_step.deadline_offset is not null
         then (now() + (v_next_step.deadline_offset || ' hours')::interval)::date
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
