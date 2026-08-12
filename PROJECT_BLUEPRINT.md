# NTE Workflow Automation & Task Management Platform — Technical Blueprint

> A complete, from-the-ground-up blueprint of the project: what it is, how it works,
> every feature, every tech choice, the database schema, the workflow engine, the
> security model, and how to run/deploy it.

---

## 1. What This Project Is

This is an **internal Workflow Operating System** (not another Asana/Jira clone) for a
tea company group that operates **two brands under one application**:

- **Danfe Tea** (`danfe`)
- **Nepal Tea Exchange** (`nte`)

The core idea: **managers design business processes once, employees simply complete
the work assigned to them, and the system automatically controls workflow progression.**

- Employees never manually assign the next person.
- Employees never drag task cards around a board.
- The workflow automatically creates tasks, assigns them, advances them, and notifies people.
- The **only** drag-and-drop page in the entire app is the **Workflow Builder**.

The product was built with [Lovable](https://lovable.dev) and is connected to GitHub
(see `AGENTS.md` — don't rewrite pushed git history).

### Design inspiration
- **Asana** → task management UI/UX
- **ManyChat** → visual drag-and-drop workflow builder
- Design goal: modern, minimal, clean, "any employee can learn it in 15–30 minutes", max 3 clicks to do anything.

---

## 2. Core Philosophy (Non-Negotiable Rules)

1. Managers define the workflow **once**.
2. Employees only see work **assigned to them**.
3. The workflow automatically **knows what happens next**.
4. Approvals happen **only when required**.
5. Notifications, dashboards, reports all update **automatically**.
6. No memory, no manual follow-ups, no constant supervision — everything is workflow-driven.

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 19 SPA/SSR)                   │
│                                                                      │
│   TanStack Router (file-based)  ·  TanStack Query (server state)     │
│   shadcn/ui components  ·  Tailwind CSS v4  ·  Recharts · Sonner     │
└───────────────┬─────────────────────────────────────┬────────────────┘
                │ REST / RPC calls                    │ createServerFn() (TanStack Start)
                ▼                                     ▼
┌────────────────────────────┐        ┌───────────────────────────────────┐
│   SUPABASE (PostgreSQL)    │        │  TANSTACK START SERVER (Nitro)    │
│  • Auth (email/password)   │◄───────│  runs on Cloudflare Workers       │
│  • Database + RLS          │        │  • CSRF middleware                │
│  • Realtime (realtime pub) │        │  • SSR error wrapper             │
│  • Storage (attachments)   │        │  • admin/server-side functions    │
│  • Workflow engine (triggers)│      │    (invite user, upload files,    │
│  • RPC functions           │        │     signed URLs) via SERVICE ROLE │
└──────────────┬─────────────┘        └───────────────────────────────────┘
               │
               └── workflow engine lives in PostgreSQL (triggers + RPC),
                   NOT in the app server. This is the key design decision.
```

**Key architectural decision:** the *entire workflow engine* runs **inside PostgreSQL**
via database triggers and `SECURITY DEFINER` RPC functions. The frontend and server
functions are just thin clients. This means workflows advance even if no frontend is
open — the database is the source of truth and the orchestrator.

---

## 4. Tech Stack

### Frontend
| Concern | Technology |
|---|---|
| Framework | **TanStack Start** (full-stack, SSR-capable) |
| UI library | **React 19** |
| Language | **TypeScript** (strict) |
| Routing | **TanStack Router** (file-based, auto-generated `routeTree.gen.ts`) |
| Server state | **TanStack Query v5** (`useQuery` / `useMutation` hooks) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` plugin, `tailwind-merge`, `tw-animate-css`) |
| Components | **shadcn/ui** style components built on **Radix UI primitives** (`@radix-ui/react-*`, ~28 packages) |
| Icons | **lucide-react** |
| Charts | **Recharts** |
| Forms/validation | **react-hook-form** + **zod** + `@hookform/resolvers` |
| Toasts | **sonner** |
| Command palette / search | **cmdk** |
| Date handling | **date-fns** |
| Drag & drop | Custom lightweight **HTML5 DnD** (`src/components/dnd.tsx`) — used only in the Workflow Builder |
| Build tool | **Vite 8** |

### Backend / Infrastructure
| Concern | Technology |
|---|---|
| Database | **PostgreSQL 15** (via Supabase) |
| Auth | **Supabase Auth** (email/password, invite flow) |
| Realtime | **Supabase Realtime** (`postgres_changes` on `notifications`, `tasks`) |
| Storage | **Supabase Storage** (`task-attachments` bucket, private, 50 MB limit) |
| Server runtime | **Nitro** (TanStack Start server) |
| Deployment | **Cloudflare Workers** (Wrangler) — see `.wrangler/deploy/config.json` |
| Local DB tooling | **Supabase CLI** (`supabase/config.toml`: API 54321, DB 54322, Studio 54323, Inbucket 54324) |
| Package manager | **Bun** (`bun.lock`) + npm (`package-lock.json`) |

### Config files
- `vite.config.ts` — uses `@lovable.dev/vite-tanstack-config` (bundles TanStack Start plugin, React plugin, Tailwind, path alias `@`, Nitro/Cloudflare target, env injection).
- `components.json` — shadcn/ui config.
- `tsconfig.json` — TypeScript config.
- `eslint.config.js`, `.prettierrc` — linting/formatting.
- `.env.local` / `.env.example` — Supabase URL + anon key.

---

## 5. Project Structure

```
front-end-first/
├── src/
│   ├── routes/                    # File-based routes (TanStack Router)
│   │   ├── __root.tsx             # Root layout (wraps everything)
│   │   ├── _shell.tsx             # Authenticated app shell (sidebar + topbar)
│   │   ├── index.tsx              # Landing/redirect
│   │   ├── login.tsx              # Login page
│   │   ├── workspace.tsx          # Brand workspace switcher
│   │   ├── _shell.dashboard.tsx
│   │   │   ├── _shell.dashboard.index.tsx      # Employee dashboard
│   │   │   ├── _shell.dashboard.team-lead.tsx  # Team Lead dashboard
│   │   │   └── _shell.dashboard.admin.tsx      # Admin dashboard
│   │   ├── _shell.tasks.tsx
│   │   │   ├── _shell.tasks.index.tsx          # Task list/board view
│   │   │   └── _shell.tasks.$id.tsx            # Task detail page
│   │   ├── _shell.projects.tsx     # Projects list
│   │   ├── _shell.workflows.tsx
│   │   │   ├── _shell.workflows.index.tsx      # Workflow template library
│   │   │   └── _shell.workflows.builder.tsx    # Drag-and-drop Workflow Builder
│   │   ├── _shell.notifications.tsx # Notification center
│   │   ├── _shell.reports.tsx       # Reports & analytics
│   │   └── _shell.admin.tsx         # Admin section
│   │       ├── _shell.admin.brands.tsx        # Manage brands
│   │       ├── _shell.admin.departments.tsx   # Manage departments
│   │       ├── _shell.admin.employees.tsx     # Invite/manage users
│   │       └── _shell.admin.roles.tsx         # Roles & permissions
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (button, card, dialog, ...)
│   │   ├── dashboard/             # Dashboard widgets
│   │   ├── app-shell.tsx          # Sidebar, topbar, bottom nav, user menu
│   │   ├── dnd.tsx                # Minimal HTML5 drag-and-drop (Draggable/DropZone)
│   │   └── global-search.tsx      # ⌘K command-palette search
│   ├── lib/
│   │   ├── api/                   # TanStack Query hooks per domain
│   │   │   ├── auth.ts            # useSession, useCurrentProfile, useSignIn, useSignOut
│   │   │   ├── tasks.ts           # task queries + mutations + workflow progress
│   │   │   ├── workflows.ts       # template/instance queries + mutations
│   │   │   ├── notifications.ts   # notifications + realtime subscription
│   │   │   └── admin.ts           # brands, departments, profiles, projects, reports
│   │   ├── app-context.tsx        # AppProvider — current user, brand, role
│   │   ├── supabase.ts            # Supabase client (env config)
│   │   ├── server-functions.ts    # TanStack Start server fns (invite, upload, signed URLs)
│   │   ├── types.ts               # Domain types (Brand, Task, Workflow, ...)
│   │   ├── database.types.ts      # Generated Postgres types
│   │   ├── error-capture.ts       # SSR error capture
│   │   ├── error-page.ts          # friendly 500 page
│   │   └── data-store.ts, utils.ts, lovable-error-reporting.ts
│   ├── server.ts                  # SSR fetch wrapper (catches h3-swallowed errors)
│   ├── start.ts                   # TanStack Start instance + CSRF middleware
│   ├── routeTree.gen.ts           # Auto-generated route tree (do not edit)
│   └── styles.css                 # Global styles
├── supabase/
│   ├── config.toml                # Local Supabase CLI config
│   ├── seed.sql                   # Brands, departments, 6 workflow templates
│   └── migrations/
│       ├── 001_schema.sql         # All tables, enums, indexes
│       ├── 002_rls.sql            # Row Level Security policies
│       ├── 003_functions.sql      # Workflow engine + triggers + RPCs
│       ├── 004_task_fixes.sql     # Activity INSERT policy, comment carryover, reassign
│       ├── 005_workflow_reassign.sql   # Reassignment semantics, finish-all-on-complete
│       ├── 006_workflow_progress.sql   # Workflow participant task visibility
│       ├── 007_fix_task_read_policy.sql # Fixes RLS infinite recursion
│       ├── 008_workflow_attachment_carryover.sql # Carry files+comments to next step
│       └── 009_reviewer_role_and_checklist.sql # Block self-review, admin checklist edit
├── *.mjs / *.cjs                 # Dev/setup/test helper scripts (see §10)
├── setup.bat                     # One-command Supabase setup (Windows)
├── .env.example / .env.local     # Environment variables
├── package.json                  # Dependencies + scripts
└── README.md                     # Original product spec / Lovable readme
```

---

## 6. Data Model (PostgreSQL)

All schema lives in `supabase/migrations/001_schema.sql`. Notable points: **brands and
departments use human-readable `text` primary keys** (e.g. `'danfe'`, `'seo'`); tasks,
workflows, etc. use `uuid` PKs.

### Brands & Departments
| Table | Purpose |
|---|---|
| `brands` | `id text PK`, `name`, `initials`, `color` — Danfe Tea / Nepal Tea Exchange |
| `departments` | `id text PK`, `name`, `team_lead_id` — SEO, Social Media, Graphic Design, Videography (+ unlimited future) |
| `department_brands` | many-to-many: which departments belong to which brands |

### Users & Permissions
| Table / Enum | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. `role` (`admin`/`team_lead`/`team_member`), `department_id`, `initials`, `avatar_color` |
| `profile_brands` | many-to-many: which brands a user works across |
| `system_role` enum | `admin`, `team_lead`, `team_member` |
| `permission_level` enum | `admin`, `editor`, `reviewer`, `viewer` (Google-Drive style, stored for future use) |

### Projects
| Table | Purpose |
|---|---|
| `projects` | Containers for workflows: `name`, `description`, `brand_id`, `status` (`active`/`archived`), `created_by` |

> Projects never contain manually-assigned tasks. Tasks are generated **only** by workflows.

### Workflows
| Table | Purpose |
|---|---|
| `workflow_templates` | Reusable process templates: `name`, `department_id`, `brand_id`, `status` (`active`/`archived`), `usage_count` |
| `workflow_steps` | One node per step: `name`, `description`, `department_id`, `assigned_user_id`, `approval_required`, `estimated_time`, `deadline_offset` (hours), `step_order`, `position_x/y` (canvas coords) |
| `step_checklist_items` | Checklist for a template step (`label`, `sort_order`) |
| `workflow_connections` | Directed edges between steps (`from_step`, `to_step`) |
| `workflow_instances` | A running workflow: `template_id`, `project_id`, `brand_id`, `status` (`running`/`paused`/`completed`/`stopped`), `current_step_index`, `started_by` |

### Tasks (the heart of the app)
| Table / Enum | Purpose |
|---|---|
| `tasks` | One task per workflow step per instance: `title`, `description`, `status`, `priority`, `brand_id`, `project_id`, `department_id`, `workflow_instance_id`, `workflow_step_id`, `workflow_step_index`, `assigned_to`, `approved_by`, `due_date`, `estimated_time`, `approval_required`, `submitted_at`, `reviewed_at` |
| `task_status` enum | `ready → in_progress → waiting_review → approved → completed` with branches `rejected`, `needs_revision` |
| `task_priority` enum | `high`, `medium`, `low` |
| `task_checklist_items` | Per-task checklist (`checked`, `sort_order`) |
| `task_attachments` | `name`, `type` (`document`/`image`/`video`/`other`), `size`, `storage_path`, `uploaded_by`, `version` (supports versioned uploads) |
| `task_comments` | `user_id`, `text` |
| `task_activities` | Immutable activity timeline: `action` enum (`workflow_started`, `task_assigned`, `files_uploaded`, `comment_added`, `submitted`, `withdrawn`, `approved`, `rejected`, `revision_requested`, `redo`, `completed`) |

### Notifications
| Table / Enum | Purpose |
|---|---|
| `notifications` | `type`, `title`, `message`, `task_id` (optional link), `user_id`, `read` |
| `notification_type` enum | `task_assigned`, `task_submitted`, `waiting_review`, `task_approved`, `task_rejected`, `revision_requested`, `redo_requested`, `submission_withdrawn`, `task_due_today`, `task_overdue`, `workflow_started`, `workflow_completed`, `project_updated` |

### Indexes
`tasks(assigned_to)`, `tasks(brand_id)`, `tasks(project_id)`, `tasks(status)`,
`tasks(workflow_instance_id)`, `notifications(user_id, read)`,
`task_activities(task_id)`, `workflow_steps(template_id, step_order)`.

---

## 7. The Workflow Engine (Database-Driven)

The engine is implemented as **PostgreSQL triggers + SECURITY DEFINER functions**
(`003_functions.sql`, refined in `004`–`009`). There is **no** separate workflow server.

### Lifecycle flow

```
Admin calls start_workflow(template, project, brand, started_by)
  │  → creates workflow_instances (running, step 0)
  │  → creates Task #0 from step[0]
  │  → copies step checklist → task_checklist_items
  │  → logs "workflow_started" activity
  │  → notifies assigned employee
  │  → increments template usage_count
  ▼
Employee works → submit_task(task_id)
  │  ├─ approval NOT required → status = completed
  │  │     └─ AFTER UPDATE trigger advance_workflow() fires
  │  └─ approval required → status = waiting_review + submitted_at
  │        └─ notifies approver (admin)
  ▼
Reviewer calls review_task(task_id, action[, assignee_id])
  ├─ approve          → status = completed → advance_workflow() fires
  ├─ reject           → status = rejected  (dead end, requires admin intervention)
  ├─ request_changes  → status = needs_revision; reassigns to chosen/previous/current
  │                     assignee; sibling 'completed' tasks revert to 'approved';
  │                     instance status back to 'running'
  └─ redo (admin)     → status = in_progress, checklist unchecked, task reset
  ▼
advance_workflow() trigger (fires ONLY on status → 'completed', guarded by
pg_trigger_depth() to prevent recursion)
  │  → next_index = current + 1
  │  → if no step exists:
  │        instance → completed; ALL its tasks forced to 'completed';
  │        notify "workflow_completed" to starter
  │  → else:
  │        create next Task from next step (auto-assigned to step's employee)
  │        copy step checklist, carry over comments AND attachments from the
  │        completed task (so reviewers see the produced files)
  │        notify "task_assigned" to next employee
```

### Task status state machine

```
              ready ──► in_progress ──► waiting_review ──► approved ──► completed
                              ▲                                    │
                              │        (final step of instance)    │
                              │                                    ▼
   redo/needs_revision ◄──── rejected ◄── (workflow fully completes)
                              ▲
              needs_revision ─┘  (resubmit → waiting_review again)
```

- Status changes are **automatic only** — there is no drag-and-drop on the board.
- `review_task` **blocks self-review** (a user can never approve their own task) and
  only allows admins or team leads (migration `009`).

### RPC functions exposed to the client
| Function | Purpose |
|---|---|
| `start_workflow(...)` | Start an instance, create first task |
| `submit_task(task_id)` | Submit for review (or complete if no approval needed) |
| `withdraw_submission(task_id)` | Pull back a submission if the reviewer hasn't started (`reviewed_at IS NULL`) |
| `review_task(task_id, action, assignee_id)` | approve / reject / request_changes / redo |
| `get_my_role()` / `is_admin()` | RLS helpers |

---

## 8. Security Model (RLS)

Everything is protected by **Row Level Security** (`002_rls.sql` + fixes in `004`, `006`,
`007`). Two `SECURITY DEFINER` helpers power the policies:

- `get_my_role()` → `profiles.role` for `auth.uid()`
- `is_admin()` → `get_my_role() = 'admin'`

### Read access by role
| Resource | Admin | Team Lead | Team Member |
|---|---|---|---|
| `tasks` | All | Own + own department | Own only (+ workflow participants, migration `006/007`) |
| `workflow_templates` / instances / projects | All | Brand memberships | Brand memberships |
| `profiles`, `brands`, `departments` | All | All (read) | All (read) |
| `notifications` | Own (`user_id = auth.uid()`) | Own | Own |

Write access is heavily restricted: **only admins** can create/update brands,
departments, workflows, projects, and profiles. Task updates are allowed for the
assignee (`assigned_to`), approver (`approved_by`), or admins.

### Notable security fixes in the migrations
- `006` added a workflow-participant read policy → caused **infinite recursion** in
  Postgres RLS.
- `007` fixed it by moving the membership check into a **SECURITY DEFINER** function
  (runs as table owner, bypasses RLS, so no recursion).
- `009` blocks self-review so a designer who is also a team lead can't approve their
  own submission and skip the admin sign-off.

---

## 9. Frontend Deep Dive

### 9.1 State & context
- **`AppProvider`** (`src/lib/app-context.tsx`) loads the logged-in user's profile +
  brand memberships on mount and on auth changes. Exposes:
  - `currentUser` (profile), `currentBrandId` (active workspace), `currentRole`, `setCurrentBrandId`.
  - On first load, it auto-selects the first brand the user belongs to.
- **Brand switching**: the sidebar shows a brand switcher (only when a user belongs to
  multiple brands). Changing the brand re-queries every brand-scoped hook.

### 9.2 Data access pattern
Every API call is a **TanStack Query hook** in `src/lib/api/*`:
- Queries (`useQuery`) for reads → automatic caching + invalidation.
- Mutations (`useMutation`) for writes → call Supabase RPCs/inserts, then
  `invalidateQueries` so the UI refreshes.
- Supabase **Realtime** subscriptions:
  - `notifications` (INSERT filtered by `user_id`) → live unread badge + notification center.
  - `tasks` / `task_activities` are in the realtime publication for live status updates.

### 9.3 Pages (routes)
| Route | Page | Role gate |
|---|---|---|
| `/login` | Email/password login | public |
| `/` (index) | Landing / redirect into app | public |
| `/dashboard` | Role-aware dashboard (employee / team-lead / admin variants) | all |
| `/tasks` | My tasks — **List view** and **Board view** (auto-moving cards, no dragging) | all |
| `/tasks/$id` | Task detail: checklist, attachments, comments, activity timeline, workflow progress, "Submit for Review" | all |
| `/projects` | Brand-scoped project containers; admin can start workflows inside | all |
| `/workflows` | Workflow template library (list, clone, archive, delete) | all (read); admin (write) |
| `/workflows/builder` | **Drag-and-drop Workflow Builder** (ManyChat style) | **admin only** |
| `/notifications` | Notification center + unread badge | all |
| `/reports` | Reports & analytics (completed/pending/overdue, dept/employee performance) | all |
| `/admin/brands` | Create/manage brands | admin |
| `/admin/departments` | Create/manage departments + brand mapping | admin |
| `/admin/employees` | Invite users (email), assign role/dept/brands | admin |
| `/admin/roles` | Roles & permissions UI | admin |

### 9.4 Task detail page features
Shows: title, description, workflow, project, brand, department, assignee, approver,
due date, estimated time, priority, **checklist**, reference files, **attachments**
(signed URLs), **comments**, **activity timeline**, and a **workflow progress stepper**
(`useWorkflowProgress` maps instance steps → done/active/pending states).

Primary actions (one at a time):
- Attach Files (server function upload → storage + DB row + activity log)
- Comment
- Submit For Review (→ `submit_task` RPC)
- Withdraw Submission (only if reviewer hasn't started)
- Reviewer: Approve / Reject / Request Changes / Redo

### 9.5 Workflow Builder (admin-only drag-and-drop)
- Left sidebar: departments + employees (draggable).
- Canvas: step nodes connected by lines (ordered by `step_order`, positions saved to
  `position_x/y`).
- Each node configures: step name, description, department, assignee, approval toggle,
  estimated time, deadline offset, checklist items.
- Templates can be **saved, edited, cloned, archived, deleted**. Saving is implemented
  as: upsert template → delete all steps (cascade) → re-insert steps + checklist +
  connections using `step_order` → saved-id mapping.
- `useWorkflowTemplate(templateId)` loads an existing template into the builder via `?templateId=` search param.

### 9.6 Global search (⌘K)
`GlobalSearch` opens a `cmdk` command palette searching projects, tasks, profiles,
workflow templates, and departments — scoped to the current brand.

### 9.7 UI shell
`AppShell` (from `_shell.tsx`):
- Desktop: fixed 256px sidebar (brand header, brand switcher, main nav, More section,
  Admin section for admins, user menu).
- Top bar: brand mark (mobile), global search (desktop), notification bell with unread
  count, user dropdown.
- Mobile: fixed **bottom navigation** (Home / Tasks / Projects / More sheet).

---

## 10. Server Functions & File Handling

TanStack Start **`createServerFn`** functions in `src/lib/server-functions.ts` run on
the Nitro/Cloudflare server and use the **`SUPABASE_SERVICE_ROLE_KEY`** to bypass RLS
for privileged operations. All of them verify the caller first (re-auth via the user's
access token, then role checks) and are protected by the **CSRF middleware**
(`src/start.ts`).

| Function | What it does |
|---|---|
| `inviteEmployee` | Admin-only. Creates a Supabase auth user (`auth.admin.createUser`), updates their profile (name, role, department, initials), assigns brand memberships. |
| `uploadTaskAttachment` | Verifies caller can access the task (assignee/admin/lead), uploads the base64 file to the `task-attachments` bucket under `tasks/{taskId}/...`, infers type from extension, inserts a `task_attachments` row + `files_uploaded` activity. |
| `getTaskAttachmentSignedUrls` | Same access check, then generates 1-hour signed URLs for each attachment. |

Storage bucket: **`task-attachments`**, **private**, 50 MB file limit
(config in `supabase/config.toml`).

---

## 11. Environment Variables

From `.env.example` / `.env.local`:

| Variable | Where used |
|---|---|
| `VITE_SUPABASE_URL` | Browser + server client (`supabase.ts`) |
| `VITE_SUPABASE_ANON_KEY` | Browser + server client |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — `server-functions.ts` (never expose to the client) |

---

## 12. Scripts & Tooling

### package.json scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (TanStack Start) |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint over the repo |
| `npm run format` | Prettier write |
| `npm run db:push` | `supabase db push --linked` (apply migrations) |
| `npm run db:setup` | `node setup-db.mjs` |
| `npm run db:admin` | `node setup-admin.mjs` |

### Helper scripts (repo root)
| File | Purpose |
|---|---|
| `setup.bat` | Windows one-shot: supabase login → link project (`xxbwbkokvcbwbexyzohg`) → push migrations → seed → print next steps |
| `setup-db.mjs` | Runs migrations 001→003 + seed via the Supabase **Management API** (needs `SUPABASE_ACCESS_TOKEN`) |
| `setup-admin.mjs` / `update-admin.mjs` | Promote a user to admin after creation |
| `migrate.mjs` / `run-migrations.mjs` | Alternative migration runners |
| `seed.sql` | Seed data (see below) |
| `e2e-tasks.cjs`, `verify.mjs`, `verify-task-fixes.cjs`, `diag-*.cjs`, `debug-users.mjs`, `fix-trigger.mjs`, `ping-invite.cjs`, `upload-test*.cjs`, `test-db*.mjs` | Development/diagnostic/e2e testing helpers |
| `apply-storage.cjs`, `apply-task-fixes.cjs` | Apply specific migration files |

### Seed data (`supabase/seed.sql`)
- 2 brands: `danfe`, `nte`
- 4 departments (SEO, Social Media, Graphic Design, Videography) mapped to both brands
- 6 workflow templates with full step/checklist/connection graphs:
  - Instagram Story Posting (danfe, social_media)
  - SEO Blog Publishing (danfe, seo)
  - Facebook Ad Campaign (nte, social_media)
  - Product Photography (danfe, graphic_design)
  - Monthly Report (danfe, seo — archived)
  - Video Editing Pipeline (nte, videography)
- Users are **not** seeded in SQL — they're created through Supabase Auth (the
  `handle_new_user()` trigger auto-creates the profile), then updated by hand or via the
  admin scripts.

---

## 13. Getting Started (Dev Environment)

```sh
git clone <repo>
npm i                    # (or bun install)
# 1. Copy env
cp .env.example .env.local   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
# 2. Apply migrations + seed (pick one)
npm run db:push          # if project is linked, or:
node setup-db.mjs        # Management API path (needs SUPABASE_ACCESS_TOKEN)
# 3. Create users in Supabase Auth, then promote admin:
node setup-admin.mjs <user-uuid>
# 4. Run
npm run dev
```

For local Supabase: `npx supabase start` uses `supabase/config.toml` (Postgres 15,
storage 50 MiB, seed enabled).

---

## 14. Deployment

- **App**: built by Vite/TanStack Start with **Nitro**, deployed to **Cloudflare
  Workers** (`.wrangler/deploy/config.json` points to `.output/server/wrangler.json`).
- **Database/Auth/Storage/Realtime**: hosted Supabase.
- **Server env**: `SUPABASE_SERVICE_ROLE_KEY` must be set as a server-side secret.

---

## 15. Feature Summary

### Implemented end-to-end
- ✅ Multi-brand workspace (Danfe Tea / Nepal Tea Exchange) with sidebar brand switching
- ✅ 3-role system: admin / team_lead / team_member
- ✅ Department management (4 seeded, unlimited creatable)
- ✅ Project containers + auto-generated tasks from workflows
- ✅ Visual, drag-and-drop **Workflow Builder** (admin only)
- ✅ Reusable workflow templates (create / clone / archive / delete, usage counts)
- ✅ Automatic workflow execution engine (PostgreSQL triggers + RPCs)
- ✅ Task lifecycle: Ready → In Progress → Waiting Review → Approved → Completed (with Rejected / Needs Revision / Redo branches)
- ✅ **Submit / Withdraw / Approve / Reject / Request Changes / Redo** review actions
- ✅ Self-review prevention + reviewer role semantics
- ✅ Checklists per step & per task
- ✅ Attachments (private storage, signed URLs, versioning field) **carried forward** between steps
- ✅ Comments **carried forward** between steps
- ✅ Full activity timeline per task (nothing is lost)
- ✅ Real-time in-app notifications (13 types) with unread badge + notification center
- ✅ Role-aware dashboards (employee / team lead / admin)
- ✅ Task List view + auto-moving **Board view** (no user dragging)
- ✅ Reports & analytics (completed, pending, overdue, waiting review, by-department)
- ✅ Global ⌘K search (projects, tasks, people, workflows, departments)
- ✅ Row Level Security end-to-end (per-brand, per-department, per-user)
- ✅ Secure server functions (invite users, file uploads) with CSRF protection
- ✅ Responsive UI (sidebar ↔ bottom nav), modern minimal design, sonner toasts
- ✅ SSR error handling / friendly error pages / Lovable error reporting

### Deliberately NOT implemented (per spec)
- ❌ No manual task assignment inside projects — tasks come only from workflows
- ❌ No drag-and-drop on task boards — cards move automatically
- ❌ No extra system roles beyond the three
- ❌ No cross-brand data mixing — everything is scoped by `brand_id` + RLS

---

## 16. Known Architecture Notes / Gotchas

- The workflow engine's `advance_workflow()` has been rewritten several times
  (migrations 003 → 004 → 005 → 008). Latest version: guarded with
  `pg_trigger_depth() > 1` to avoid recursive trigger firing, carries comments +
  attachments to the next step, and only marks tasks `completed` when the whole
  instance finishes.
- `request_changes` deliberately **reopens** earlier completed sibling steps (reverts
  them to `approved`) and flips the instance back to `running` so a revision re-runs
  the chain — this is the intended "rework the whole workflow" semantic.
- RLS policy recursion was a real production bug (migration `007`) — always use
  `SECURITY DEFINER` helper functions for self-referencing checks.
- The `_shell.*` route prefix pattern in TanStack Router creates nested layouts;
  `routeTree.gen.ts` is auto-generated and must not be edited by hand.
