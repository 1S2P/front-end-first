-- ─── 007: Fix workflow-participant read policy (infinite recursion) ───────────
-- The 006 policy sub-queried `tasks` directly, which re-evaluated the same
-- policy on the inner query and triggered `infinite recursion detected in
-- policy for relation "tasks"`, breaking EVERY tasks SELECT (500 errors).
--
-- Fix: move the membership check into a SECURITY DEFINER function, which runs
-- as the table owner and bypasses RLS, so the inner lookup never recurses.
create or replace function is_workflow_participant(p_instance uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tasks t
    where t.workflow_instance_id = p_instance
      and t.assigned_to = auth.uid()
  );
$$;

drop policy if exists "tasks_read_workflow_participant" on tasks;
create policy "tasks_read_workflow_participant" on tasks for select to authenticated
  using (
    workflow_instance_id is not null
    and is_workflow_participant(workflow_instance_id)
  );
