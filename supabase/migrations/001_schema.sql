-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Brands ──────────────────────────────────────────────────────────────────
create table brands (
  id         text primary key,
  name       text not null,
  initials   text not null,
  color      text not null,
  created_at timestamptz default now()
);

-- ─── Departments ─────────────────────────────────────────────────────────────
create table departments (
  id           text primary key,
  name         text not null,
  team_lead_id text,
  created_at   timestamptz default now()
);

create table department_brands (
  department_id text references departments(id) on delete cascade,
  brand_id      text references brands(id) on delete cascade,
  primary key (department_id, brand_id)
);

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────
create type system_role as enum ('admin', 'team_lead', 'team_member');
create type permission_level as enum ('admin', 'editor', 'reviewer', 'viewer');

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  initials      text not null,
  role          system_role not null default 'team_member',
  department_id text references departments(id),
  avatar_color  text not null default 'bg-primary/15 text-primary',
  created_at    timestamptz default now()
);

create table profile_brands (
  profile_id uuid references profiles(id) on delete cascade,
  brand_id   text references brands(id) on delete cascade,
  primary key (profile_id, brand_id)
);

-- ─── Projects ────────────────────────────────────────────────────────────────
create type project_status as enum ('active', 'archived');

create table projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  brand_id    text not null references brands(id),
  status      project_status not null default 'active',
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- ─── Workflow Templates ───────────────────────────────────────────────────────
create type workflow_status as enum ('active', 'archived');

create table workflow_templates (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  department_id text references departments(id),
  brand_id      text not null references brands(id),
  status        workflow_status not null default 'active',
  usage_count   integer not null default 0,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now()
);

create table workflow_steps (
  id                uuid primary key default uuid_generate_v4(),
  template_id       uuid not null references workflow_templates(id) on delete cascade,
  name              text not null,
  description       text,
  department_id     text references departments(id),
  assigned_user_id  uuid references profiles(id),
  approval_required boolean not null default false,
  estimated_time    text,
  deadline_offset   text,
  step_order        integer not null,
  position_x        float not null default 100,
  position_y        float not null default 100,
  created_at        timestamptz default now()
);

create table step_checklist_items (
  id        uuid primary key default uuid_generate_v4(),
  step_id   uuid not null references workflow_steps(id) on delete cascade,
  label     text not null,
  sort_order integer not null default 0
);

create table workflow_connections (
  id          uuid primary key default uuid_generate_v4(),
  template_id uuid not null references workflow_templates(id) on delete cascade,
  from_step   uuid not null references workflow_steps(id) on delete cascade,
  to_step     uuid not null references workflow_steps(id) on delete cascade
);

-- ─── Workflow Instances ───────────────────────────────────────────────────────
create type instance_status as enum ('running', 'paused', 'completed', 'stopped');

create table workflow_instances (
  id                  uuid primary key default uuid_generate_v4(),
  template_id         uuid not null references workflow_templates(id),
  project_id          uuid not null references projects(id),
  brand_id            text not null references brands(id),
  status              instance_status not null default 'running',
  current_step_index  integer not null default 0,
  started_by          uuid references profiles(id),
  started_at          timestamptz default now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create type task_status as enum (
  'ready', 'in_progress', 'waiting_review', 'approved',
  'completed', 'rejected', 'needs_revision'
);
create type task_priority as enum ('high', 'medium', 'low');

create table tasks (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  description         text,
  status              task_status not null default 'ready',
  priority            task_priority not null default 'medium',
  brand_id            text not null references brands(id),
  project_id          uuid not null references projects(id),
  department_id       text references departments(id),
  workflow_instance_id uuid references workflow_instances(id),
  workflow_step_id    uuid references workflow_steps(id),
  workflow_step_index integer not null default 0,
  assigned_to         uuid references profiles(id),
  approved_by         uuid references profiles(id),
  due_date            date,
  estimated_time      text,
  approval_required   boolean not null default false,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  created_at          timestamptz default now()
);

create table task_checklist_items (
  id        uuid primary key default uuid_generate_v4(),
  task_id   uuid not null references tasks(id) on delete cascade,
  label     text not null,
  checked   boolean not null default false,
  sort_order integer not null default 0
);

create type attachment_type as enum ('document', 'image', 'video', 'other');

create table task_attachments (
  id           uuid primary key default uuid_generate_v4(),
  task_id      uuid not null references tasks(id) on delete cascade,
  name         text not null,
  type         attachment_type not null default 'other',
  size         text,
  storage_path text,
  uploaded_by  uuid references profiles(id),
  version      integer not null default 1,
  uploaded_at  timestamptz default now()
);

create table task_comments (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references profiles(id),
  text       text not null,
  created_at timestamptz default now()
);

-- ─── Activity Timeline ────────────────────────────────────────────────────────
create type activity_action as enum (
  'workflow_started', 'task_assigned', 'files_uploaded', 'comment_added',
  'submitted', 'withdrawn', 'approved', 'rejected', 'revision_requested', 'redo', 'completed'
);

create table task_activities (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  action      activity_action not null,
  user_id     uuid references profiles(id),
  description text,
  created_at  timestamptz default now()
);

-- ─── Notifications ────────────────────────────────────────────────────────────
create type notification_type as enum (
  'task_assigned', 'task_submitted', 'waiting_review', 'task_approved',
  'task_rejected', 'revision_requested', 'redo_requested', 'submission_withdrawn',
  'task_due_today', 'task_overdue', 'workflow_started', 'workflow_completed',
  'project_updated'
);

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  type       notification_type not null,
  title      text not null,
  message    text not null,
  task_id    uuid references tasks(id) on delete set null,
  user_id    uuid not null references profiles(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index on tasks(assigned_to);
create index on tasks(brand_id);
create index on tasks(project_id);
create index on tasks(status);
create index on tasks(workflow_instance_id);
create index on notifications(user_id, read);
create index on task_activities(task_id);
create index on workflow_steps(template_id, step_order);
