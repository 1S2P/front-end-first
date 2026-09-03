-- ─── 016: Fix team-lead review routing (use profiles, not departments.team_lead_id) ──
-- 015 routed team-lead approval via departments.team_lead_id, but that column is
-- empty. The rest of the schema identifies "team lead of a department" through
-- profiles (role = 'team_lead' AND department_id = <task's department>), which is
-- the convention used by the RLS policies. This migration:
--   * makes get_step_team_lead resolve the department's team lead from profiles,
--   * restores review_task authorization to the original admin-or-team-lead model
--     (admins always; team leads of the task's department), while blocking
--     self-review, and
--   * routes submit_task notifications to the department's team lead(s) for
--     team-lead-designated steps, falling back to an admin when none exists.

-- ─── 1. Helper: resolve the approver for a task's department ─────────────────────
-- Returns the profile id (as text) of a team lead in the task's department, or
-- NULL if there is no team lead configured for that department.
drop function if exists get_step_team_lead(uuid);
create or replace function get_step_team_lead(p_task_id uuid)
returns text language sql security definer stable as $$
  select p.id::text
  from tasks t
  join profiles p on p.department_id = t.department_id
  where t.id = p_task_id
    and p.role = 'team_lead'
  limit 1
$$;

-- ─── 2. review_task: authorize admins and the department's team lead ─────────────
--   * admin       : may always review (admin override), except their own task.
--   * team lead   : may review tasks in their own department.
-- The reassign-on-request-changes behaviour (pick a specific employee, previous
-- step assignee, or keep the current assignee) applies to both reviewers.
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

  -- Authorization: admins always; team leads only for their own department.
  -- Nobody may review their own assignment.
  if is_admin() then
    if v_task.assigned_to = auth.uid() then
      raise exception 'Not authorized to review this task';
    end if;
  elsif get_my_role() = 'team_lead' then
    if v_task.assigned_to = auth.uid() then
      raise exception 'Not authorized to review this task';
    end if;
    if not exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.department_id = v_task.department_id
    ) then
      raise exception 'Not authorized to review this task';
    end if;
  else
    raise exception 'Not authorized to review this task';
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

-- ─── 3. submit_task: notify the department's team lead for team-lead steps ──────
-- Falls back to notifying an admin if the department has no team lead.
create or replace function submit_task(p_task_id uuid)
returns void language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
  v_tl   text;
begin
  select * into v_task from tasks where id = p_task_id;
  if v_task.assigned_to <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if v_task.approval_required then
    update tasks set status = 'waiting_review', submitted_at = now() where id = p_task_id;
    insert into task_activities (task_id, action, user_id, description)
    values (p_task_id, 'submitted', auth.uid(), 'Task submitted for review');

    if v_task.approver_role = 'team_lead' then
      v_tl := get_step_team_lead(p_task_id);
      if v_tl is not null then
        insert into notifications (type, title, message, task_id, user_id)
        values ('waiting_review', 'Waiting for Review',
                '"' || v_task.title || '" is waiting for your review',
                p_task_id, v_tl);
      else
        insert into notifications (type, title, message, task_id, user_id)
        select 'waiting_review', 'Waiting for Review',
               '"' || v_task.title || '" is waiting for your review',
               p_task_id, p.id
        from profiles p where p.role = 'admin' limit 1;
      end if;
    else
      insert into notifications (type, title, message, task_id, user_id)
      select 'waiting_review', 'Waiting for Review',
             '"' || v_task.title || '" is waiting for your review',
             p_task_id, p.id
      from profiles p where p.role = 'admin' limit 1;
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
