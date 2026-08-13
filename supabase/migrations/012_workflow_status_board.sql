-- ─── 012: Workflow Status Board ("Where's it at?") ────────────────────────────
-- A read-only board showing where every running workflow is, for every employee
-- (transparency on by default, revocable per employee). Additive only: does not
-- touch the workflow engine functions or any existing RLS policy.
--
-- Permission id follows the product spec exactly ("workflow.view_status").
-- Admin users always qualify because has_permission() already returns true for
-- the admin role.

-- 1. Permission catalog entry ───────────────────────────────────────────────────
insert into public.permissions (id, group_name, name, description, sort_order)
values (
  'workflow.view_status',
  'Workflow',
  'View Workflow Status Board',
  'See where every running workflow is and who currently holds the step',
  6
)
on conflict (id) do nothing;

-- 2. Grant it to every employee by default (unless an admin later revokes it via
--    the Assign Permissions page) ───────────────────────────────────────────────
insert into public.profile_permissions (profile_id, permission_id)
select p.id, 'workflow.view_status'
from public.profiles p
on conflict (profile_id, permission_id) do nothing;

-- New sign-ups get it automatically. Rebuilt from 003_functions_safe.sql plus the
-- default grant. `on conflict (id) do nothing` keeps existing profiles untouched.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name     text;
  v_initials text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_initials := upper(
    left(v_name, 1) ||
    coalesce(left(trim(split_part(v_name, ' ', 2)), 1), '')
  );

  insert into profiles (id, name, email, initials, role)
  values (new.id, v_name, new.email, v_initials, 'team_member')
  on conflict (id) do nothing;

  insert into public.profile_permissions (profile_id, permission_id)
  values (new.id, 'workflow.view_status')
  on conflict (profile_id, permission_id) do nothing;

  return new;
end;
$$;

-- 3. app_settings for tunable defaults ──────────────────────────────────────────
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);

alter table public.app_settings enable row level security;

create policy "app_settings_read" on public.app_settings
  for select to authenticated using (true);

-- Default number of hours before a running step with no deadline of its own is
-- flagged as "stuck".
insert into public.app_settings (key, value)
values ('workflow_status.default_stuck_hours', '48'::jsonb)
on conflict (key) do nothing;

-- 4. Status board function ──────────────────────────────────────────────────────
-- Returns the current step of every running workflow the caller may see. Callers
-- must hold the workflow.view_status permission (admins always qualify) and are
-- limited to their own brands unless they are admins. The app may pass an
-- explicit brand filter.
--
-- step_due_at resolution (mirrors 011_deadline_days.sql):
--   1. tasks.due_date when the engine computed one,
--   2. otherwise the step's deadline_offset: numeric values are DAYS (e.g. "3"),
--      interval strings are accepted as-is,
--   3. otherwise created_at + workflow_status.default_stuck_hours from app_settings.
create or replace function get_workflow_status_board(p_brand_id text default null)
returns table (
  instance_id           uuid,
  workflow_name         text,
  project_name          text,
  brand_id              text,
  department_name       text,
  current_step_name     text,
  step_order            integer,
  total_steps           integer,
  task_id               uuid,
  task_title            text,
  assigned_to           uuid,
  assignee_name         text,
  assignee_initials     text,
  assignee_avatar_color text,
  step_started_at       timestamptz,
  step_due_at           timestamptz,
  hours_in_step         numeric,
  is_overdue            boolean,
  instance_status       text
)
language plpgsql security definer stable as $$
begin
  if not has_permission('workflow.view_status') then
    return;
  end if;

  return query
  select
    b.instance_id,
    b.workflow_name,
    b.project_name,
    b.brand_id,
    b.department_name,
    b.current_step_name,
    b.step_order,
    b.total_steps,
    b.task_id,
    b.task_title,
    b.assigned_to,
    b.assignee_name,
    b.assignee_initials,
    b.assignee_avatar_color,
    b.step_started_at,
    b.step_due_at,
    b.hours_in_step,
    now() > b.step_due_at as is_overdue,
    b.instance_status
  from (
    select
      wi.id                                        as instance_id,
      wt.name                                      as workflow_name,
      pj.name                                      as project_name,
      wi.brand_id                                  as brand_id,
      d.name                                       as department_name,
      ws.name                                      as current_step_name,
      wi.current_step_index                        as step_order,
      (select count(*)::int
         from public.workflow_steps s
        where s.template_id = wi.template_id)      as total_steps,
      tk.id                                        as task_id,
      tk.title                                     as task_title,
      tk.assigned_to                               as assigned_to,
      pr.name                                      as assignee_name,
      pr.initials                                  as assignee_initials,
      pr.avatar_color                              as assignee_avatar_color,
      tk.created_at                                as step_started_at,
      case
        when tk.due_date is not null then tk.due_date::timestamptz
        when ws.deadline_offset is not null and ws.deadline_offset <> '' then
          tk.created_at + case when ws.deadline_offset ~ '^[0-9]+(\.[0-9]+)?$'
                               then (ws.deadline_offset || ' days')::interval
                               else ws.deadline_offset::interval end
        else
          tk.created_at + (coalesce(
            (select value from public.app_settings
              where key = 'workflow_status.default_stuck_hours'),
            '48'::jsonb
          )::text || ' hours')::interval
      end                                          as step_due_at,
      round(extract(epoch from (now() - tk.created_at)) / 3600.0, 1)
                                                   as hours_in_step,
      wi.status::text                              as instance_status
    from public.workflow_instances wi
    join public.workflow_templates wt on wt.id = wi.template_id
    join public.projects pj on pj.id = wi.project_id
    left join public.workflow_steps ws
      on ws.template_id = wi.template_id
     and ws.step_order = wi.current_step_index
    join public.tasks tk
      on tk.workflow_instance_id = wi.id
     and tk.workflow_step_index = wi.current_step_index
    left join public.departments d on d.id = ws.department_id
    left join public.profiles pr on pr.id = tk.assigned_to
    where wi.status = 'running'
      and (is_admin() or exists (
        select 1 from public.profile_brands pb
        where pb.profile_id = auth.uid() and pb.brand_id = wi.brand_id
      ))
      and (p_brand_id is null or wi.brand_id = p_brand_id)
  ) b
  order by (now() > b.step_due_at) desc, b.hours_in_step desc;
end;
$$;

revoke all on function get_workflow_status_board(text) from public;
grant execute on function get_workflow_status_board(text) to authenticated;
