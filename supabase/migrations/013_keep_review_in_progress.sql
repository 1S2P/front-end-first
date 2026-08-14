-- ─── 013: Tasks stay "In Review" until the whole workflow is complete ─────────
-- Previously, approving a task set its status straight to 'completed'. In a
-- multi-step workflow the assignee's dashboard then showed the step as Completed
-- while the admin review / overall workflow was still running.
--
-- New behaviour:
--   * Approving a review-required task keeps it in 'waiting_review' (In Review)
--     and records reviewed_at / approved_by so it drops out of the pending
--     review queue but never reads as "Completed".
--   * The workflow still advances immediately after an approval (the next step's
--     task is created as before).
--   * Only when the FINAL step finishes does advance_workflow flip every task of
--     the instance to 'completed'.

-- ─── 1. advance_workflow: also advance when an approval-required step is approved
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

  -- Advance when either:
  --   (a) a step is fully completed (submitted without approval), or
  --   (b) an approval-required step is approved — the status stays
  --       'waiting_review' (In Review) but reviewed_at is set.
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

-- Fire the trigger when either the status changes or a review is recorded
drop trigger if exists workflow_advance_trigger on tasks;
create trigger workflow_advance_trigger
  after update of status, reviewed_at on tasks
  for each row execute function advance_workflow();

-- ─── 2. review_task: approving keeps the task "In Review" ──────────────────────
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

    -- The workflow is no longer finished: previously completed / approved
    -- sibling steps must not stay in a final state until the whole workflow
    -- completes again.
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
    -- The task stays 'waiting_review' (In Review) so the assignee's dashboard
    -- never shows it as Completed before the whole workflow is done. The
    -- reviewed_at / approved_by update above already triggered advance_workflow,
    -- which moves the workflow on (or completes every task on the final step).
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
