-- ─── 017: Fix submit_task uuid cast for team-lead notifications ─────────────────
-- 016 routed team-lead review notifications by inserting the team lead's profile
-- id into notifications.user_id, but get_step_team_lead returns that id as text,
-- and Postgres refuses to insert text into the uuid user_id column without an
-- explicit cast (error 42804). This casts it explicitly.

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
                p_task_id, v_tl::uuid);
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
