-- ─── 006: Workflow progress visibility ────────────────────────────────────────
-- Employees participate in a workflow should see every step's task of that
-- workflow (needed for the Workflow Progress card on the task detail page),
-- even when a sibling task belongs to another employee or department.
create policy "tasks_read_workflow_participant" on tasks for select to authenticated
  using (
    workflow_instance_id is not null and exists (
      select 1 from tasks t2
      where t2.workflow_instance_id = tasks.workflow_instance_id
        and t2.assigned_to = auth.uid()
    )
  );
