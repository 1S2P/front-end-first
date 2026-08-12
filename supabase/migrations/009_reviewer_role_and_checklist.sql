-- ─── 009: Reviewer role + checklist permissions ────────────────────────────────
-- 1. review_task now blocks SELF-review: a user can never approve/reject/review
--    a task they are assigned to, and team members can never review.
--    Previously any team_lead could review a task in waiting_review — including
--    their OWN submitted work. In a design workflow this let a designer who is a
--    team_lead approve their own submission, skipping the admin review step and
--    jumping straight to the next step (posting). The loop now keeps running
--    until an ADMIN approves (admins may still review the review step assigned
--    to them, which is the intended "admin signs off" behaviour).
-- 2. task_checklist_items UPDATE now also allows admins to tick checklist items
--    on any task (the assignee already could). A reviewer can therefore tick
--    items when reviewing instead of being silently blocked by RLS.

-- ─── 1. review_task: block self-review, team members cannot review ────────────
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
     and (get_my_role() <> 'team_lead' or v_task.assigned_to = auth.uid()) then
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

-- ─── 2. task_checklist_items UPDATE: admins can tick any checklist ─────────────
drop policy if exists "task_checklist_update" on task_checklist_items;
create policy "task_checklist_update" on task_checklist_items for update to authenticated
  using (exists (
    select 1 from tasks t
    where t.id = task_id and (t.assigned_to = auth.uid() or is_admin())
  ));
