-- ─── 014: Every workflow step stays "In Review" until the workflow completes ──
-- Extension of 013: previously, a workflow step that required no approval was
-- set straight to 'completed' on submit. In a multi-step workflow the assignee's
-- dashboard then showed their step as Completed while the workflow was still
-- running (e.g. the admin review step was still pending).
--
-- New behaviour:
--   * A workflow step with no approval stays 'waiting_review' (In Review) when
--     submitted. reviewed_at is set so advance_workflow still moves the workflow
--     on to the next step, but the task never reads as "Completed" until the
--     final step finishes and every task of the instance is completed.
--   * Standalone tasks (no workflow_instance_id) without approval still complete
--     immediately, since there is no larger workflow to wait for.

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
  elsif v_task.workflow_instance_id is not null then
    -- Workflow step that needs no approval: it stays "In Review" until the
    -- whole workflow completes. Setting reviewed_at makes advance_workflow move
    -- the workflow on while the task stays waiting_review.
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

-- ─── Backfill existing data ───────────────────────────────────────────────────
-- Any task already marked 'completed' whose workflow instance is still running
-- was completed before this rule existed. Revert it to 'waiting_review' (In
-- Review) — reviewed_at is kept so it does NOT re-enter the pending review queue
-- and does NOT re-trigger workflow advancement (which would duplicate steps).
update tasks t
set status = 'waiting_review'
from workflow_instances wi
where t.workflow_instance_id = wi.id
  and wi.status = 'running'
  and t.status = 'completed';
