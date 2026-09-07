-- ─── 022: Employee "Start" action + recurring/scheduled workflow execution ────
-- Two additions:
--   1. Adds a 'started' action to the activity enum, so when an assignee clicks
--      "Start" on a ready task the activity timeline can show it.
--   2. Adds a workflow_schedules table + a scheduled runner so admins / team
--      leads can make a workflow repeat automatically on selected days of the
--      week (Asana-style "repeat by days on a calendar").

-- ═══ 1. Task "Start" activity action ═════════════════════════════════════════
alter type activity_action add value if not exists 'started';

-- ═══ 2. Recurring workflow schedules ═════════════════════════════════════════
create table workflow_schedules (
  id          uuid primary key default uuid_generate_v4(),
  template_id uuid not null references workflow_templates(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  brand_id    text not null references brands(id),
  -- Days of the week to run, using Postgres dow numbering: 0 = Sunday, 6 = Saturday.
  -- (This matches JavaScript Date.getDay() so the UI can map 1:1.)
  repeat_days smallint[] not null default '{}',
  start_date  date,
  end_date    date,
  next_run_at timestamptz not null default now(),
  last_run_at timestamptz,
  active      boolean not null default true,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

alter table workflow_schedules enable row level security;

create policy "workflow_schedules_read" on workflow_schedules
  for select to authenticated
  using (
    is_admin() or
    exists (
      select 1 from profile_brands pb
      where pb.profile_id = auth.uid() and pb.brand_id = workflow_schedules.brand_id
    )
  );
create policy "workflow_schedules_write" on workflow_schedules
  for all to authenticated using (is_admin() or has_permission('workflow_start'));

-- ═══ 3. Runner that starts a workflow instance for every schedule due today ──
-- Starts at most one instance per schedule per day (guarded by last_run_at::date).
create or replace function run_due_workflow_schedules()
returns void language plpgsql security definer as $$
declare
  s workflow_schedules%rowtype;
  v_dow integer := extract(dow from now());
begin
  for s in
    select *
    from workflow_schedules
    where active
      and (repeat_days is null or array_length(repeat_days, 1) is null or v_dow = any(repeat_days))
      and (start_date is null or start_date <= current_date)
      and (end_date is null or end_date >= current_date)
      and (last_run_at is null or last_run_at::date < current_date)
  loop
    perform start_workflow(
      s.template_id,
      s.project_id,
      s.brand_id,
      s.created_by
    );
    update workflow_schedules
       set last_run_at = now(),
           next_run_at = now() + interval '1 day'
     where id = s.id;
  end loop;
end;
$$;

grant execute on function run_due_workflow_schedules() to service_role;

-- ═══ 4. Schedule the runner daily via pg_cron (safe if cron isn't enabled) ──
do $$
begin
  if to_regnamespace('cron') is not null then
    perform cron.unschedule('run-workflow-schedules-daily');
    perform cron.schedule(
      'run-workflow-schedules-daily',
      '0 6 * * *',
      $cmd$ select public.run_due_workflow_schedules(); $cmd$
    );
  end if;
end $$;
