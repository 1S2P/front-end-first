# NTE Workflow OS — Design Audit

> Phase 1 output. Purpose: document the current state of the application, catalog
> reusable infrastructure, identify UX inconsistencies, and define the implementation
> order for the redesign. `PROJECT_BLUEPRINT.md` remains the source of truth for
> architecture. This audit does NOT propose backend changes.

---

## 1. What already exists (foundation we keep)

The app is functionally complete. Every feature in the blueprint is implemented
end-to-end: multi-brand workspace, 3 roles, workflow builder, database-driven
workflow engine, approvals, checklists, attachments, comments, activity timeline,
realtime notifications, reports, global search, RLS, responsive shell.

The threat is not missing functionality — it's **presentation, information
hierarchy, and polish**. This is a visual + UX redesign, not a feature build.

The app already ships a solid design-token foundation:

- `src/styles.css` defines semantic tokens in oklch: `background`, `surface`
  (via `card`/`muted`/`accent`), `foreground`, `primary`, `success`/`warning`/
  `destructive`/`info`, `border`, `ring`, `chart-1..5`, and a complete set of
  `sidebar-*` tokens.
- Dark mode tokens exist (`.dark` block) but **dark mode is not exposed** in the UI.
- Inter is the font, with OpenType feature settings (`cv02`, `cv03`, `cv04`,
  `cv11`), tabular-nums available, `prefers-reduced-motion` handling, thin
  scrollbars, and a clean `:focus-visible` outline.
- Radius is restrained (`0.625rem`), shadows are subtle and layered.
- The `@theme` block maps Tailwind color utilities to these tokens, so
  `bg-surface`, `text-muted-foreground`, `text-success`, etc. already work.

**Conclusion:** Phase 2 does NOT need a token overhaul. It needs a *token
discipline pass* — consolidate hardcoded color classes (there are many
hardcoded `bg-blue-50`/`text-purple-600` style classes in routes) into the
semantic set, and add a few missing semantic tokens (`--surface`,
`--surface-subtle`, `--surface-elevated`, on-time/trend tokens if needed).

---

## 2. Route inventory (all 23 routes)

| Route | File | Status for redesign |
|---|---|---|
| `/` | `index.tsx` | Public landing / redirect. Leave. |
| `/login` | `login.tsx` | Public. Leave (minor polish). |
| `/reset-password` | `reset-password.tsx` | Public. Leave. |
| `/workspace` | `workspace.tsx` | Brand selector pre-shell. Leave. |
| `/_shell` | `_shell.tsx` | Auth gate. Leave. |
| `/_shell/dashboard` | `_shell.dashboard.tsx` | Layout-only Outlet. Leave. |
| `/_shell/dashboard/` | `_shell.dashboard.index.tsx` | **Role router** (admin / team-lead w/ permission flags / employee). Handles all 3 dashboards in one file. **Primary redesign target.** |
| `/_shell/dashboard/team-lead` | `_shell.dashboard.team-lead.tsx` | Legacy dedicated TL route rendering same comp. Keep as alias. |
| `/_shell/dashboard/admin` | `_shell.dashboard.admin.tsx` | Legacy dedicated admin route. Keep as alias. |
| `/_shell/tasks` | `_shell.tasks.tsx` | Layout Outlet. Leave. |
| `/_shell/tasks/` | `_shell.tasks.index.tsx` | My Tasks. **7 tabs, list+board views, 4 hardcoded color maps duplicated.** Major redesign. |
| `/_shell/tasks/$id` | `_shell.tasks.$id.tsx` | Task detail, **855 lines**. Workspace layout (main + sidebar) partially exists. Major redesign. |
| `/_shell/projects` | `_shell.projects.tsx` | Project grid. Needs data enrichment + card polish. Medium. |
| `/_shell/workflows` | `_shell.workflows.tsx` | Layout Outlet. Leave. |
| `/_shell/workflows/` | `_shell.workflows.index.tsx` | Workflow library, 563 lines. **All actions visible at once** — violates hierarchy principle. Major redesign. |
| `/_shell/workflows/builder` | `_shell.workflows.builder.tsx` | Drag-and-drop builder, 716 lines. Logic solid; visual polish + layout. Medium-high. |
| `/_shell/workflows/status` | `_shell.workflows.status.tsx` | "Where's it at?" status board (uses `get_workflow_status_board` RPC + realtime). Good data; presentation polish. Medium. |
| `/_shell/notifications` | `_shell.notifications.tsx` | Notification center. Needs grouping (Today/Yesterday/Earlier) + icon system reuse. Medium. |
| `/_shell/reports` | `_shell.reports.tsx` | Reports. Currently 3 KPIs + 3 panels, no charts despite Recharts being installed. Major redesign. |
| `/_shell/admin` | `_shell.admin.tsx` | Admin layout/permission gate. Leave. |
| `/_shell/admin/brands` | `_shell.admin.brands.tsx` | CRUD. Leave (minor polish). |
| `/_shell/admin/departments` | `_shell.admin.departments.tsx` | CRUD. Leave. |
| `/_shell/admin/employees` | `_shell.admin.employees.tsx` | CRUD + invite. Leave (polish). |
| `/_shell/admin/roles` | `_shell.admin.roles.tsx` | Permission matrix. Leave (polish). |

---

## 3. Component inventory

### Reusable today (do not recreate — reuse/extend)
- `src/components/ui/*` — **46 shadcn/Radix components** (button, card, badge,
  tabs, table, dialog, dropdown-menu, sheet, popover, command, select, tooltip,
  skeleton, progress, avatar, separator, alert-dialog, switch, calendar, chart
  [Recharts wrapper], input, textarea, label, radio-group, etc.). The full shadcn
  catalog is present — the redesign should lean on `chart.tsx`, `calendar.tsx`,
  `sheet.tsx` (for right-slide notification panel), `command.tsx`, `popover.tsx`.
- `src/components/app-shell.tsx` — `AppShell`, `PageHeader`, `SidebarContent`,
  `TopBar`, `BottomNav`, `UserMenu`, `NavList`, `ChangePasswordDialog` (569 lines).
  Single file holding the whole shell. **Primary redesign target — should be split.**
- `src/components/dashboard/stat-card.tsx` — `StatCard` + `StatTone` system.
  Good bones; needs compact variant + trend indicator.
- `src/components/dashboard/task-row.tsx` — `TaskRow` dense row. Good bones.
  Its hardcoded status styles should be replaced by the shared `StatusBadge`.
- `src/components/dashboard/dashboard-ui.tsx` — `SectionHeader`, `EmptyState`.
  Extend `EmptyState` to support actions/compact variants.
- `src/components/dashboard/notification-row.tsx` — `NotificationRow`.
- `src/components/dashboard/admin-dashboard.tsx` — `AdminDashboard` (167 lines).
  Currently 4 stat cards + 3 nav shortcut cards + 2 panels. **Nowhere near the
  operations-command-center brief.**
- `src/components/dashboard/team-lead-dashboard.tsx` — `TeamLeadDashboard`
  (133 lines). Same "stat cards + 2 panels" shape.
- `src/components/global-search.tsx` — `GlobalSearch` (⌘K command palette).
  Needs Quick Actions section + keyboard polish.
- `src/components/dnd.tsx` — minimal HTML5 DnD used only by the builder. Keep.
- `src/components/ui/sidebar.tsx` — the shadcn Sidebar primitive ships but is
  **NOT imported anywhere** (grep confirmed). App-shell uses a custom `<aside>`.
  Either adopt `SidebarProvider`/`Sidebar`/`SidebarInset` for robust collapse +
  sheet behavior, or keep custom. Recommendation: adopt shadcn sidebar — it already
  supports desktop collapse, mobile sheet, tooltips, and is battle-tested.

### Components to create (per brief, only where they earn their keep)
- `StatusBadge` + `TaskStatus` dot/badge system (single source of truth for the 7
  statuses + overdue). Currently status styles are hardcoded in **4 places**
  (`task-row.tsx`, `tasks.index.tsx`, `tasks.$id.tsx`, plus a 4th in
  `admin-dashboard.tsx`).
- `PageHeader` upgrade (breadcrumbs, sticky controls, time-aware greeting helper).
- `KpiCard` / compact stat with `<TrendIndicator/>`.
- `AttentionItem` (exceptions list row) used by admin + team-lead dashboards.
- `WorkflowProgress` stepper (extract from task-detail's inline stepper logic +
  reuse `useWorkflowProgress`).
- `EmployeeAvatar` (avatar + initials + optional presence dot).
- `WorkloadIndicator` (capacity bar derived from active tasks — see §7).
- `ActivityFeed` (compact, realtime-driven).
- `EmptyState` enhancements; `PageSkeleton` components matching layouts.
- `FilterBar` + `DateRangePicker` for reports/tasks.
- `CommandPalette` upgrade (extend existing `GlobalSearch`).
- `NotificationPanel` (right slide-in sheet for top-bar, reusing the
  notifications page internals).

---

## 4. API/hooks inventory (already excellent, reuse everything)

- `src/lib/api/auth.ts` — session, profile, sign in/out, change password.
- `src/lib/api/tasks.ts` — 20+ hooks. Key ones for dashboards:
  `useMyTasks`, `useDepartmentTasks`, `useAllBrandTasks`, `usePendingReviews`,
  `useReassignedTasks`, `useMyActionableTaskCount`, `useTaskBadgeCount`,
  `useTask`, `useWorkflowProgress`, `useTaskAttachmentSignedUrls`, plus
  mutations for submit/withdraw/review/checklist/comment/upload/start.
- `src/lib/api/workflows.ts` — templates, instances, schedules, start/stop/save/
  duplicate/archive/delete, **`useWorkflowStatusBoard` (RPC + realtime)**.
- `src/lib/api/notifications.ts` — `useNotifications` (realtime), `useUnreadCount`,
  mark read/all read.
- `src/lib/api/admin.ts` — brands, departments, profiles, projects, report stats,
  permissions catalog + assignment, invite/update/delete user.
- `src/lib/app-context.tsx` — `AppProvider` gives `currentUser`, `currentBrandId`,
  `currentRole`, `hasPermission`. Realtime-auth-aware.
- `src/lib/database.types.ts` — generated Postgres types.

### Analytics data gap (the honest part)
There is NO backend aggregation for trends, avg completion time, workflow
completion rate, or per-employee load. Existing data sources:
- `useAllBrandTasks` (admin) + `useMyTasks`/`useDepartmentTasks` — full task rows
  with `created_at`, `due_date`, `submitted_at`, `reviewed_at`, `completed` timestamps
  → **completion time derivable** from `submitted_at`/`reviewed_at` + status.
- `useReportStats` — aggregates status/due counts by department.
- `useWorkflowStatusBoard` RPC — per-instance step, hold time, overdue, assignee.
- `workflow_templates.usage_count` — run counts.
- `workflow_instances` — per-instance status/timeline.

**Per the brief:** trends = compare last-N-days vs previous-N-days computed
client-side from task rows (safe, RLS-scoped). Avg completion time = `reviewed_at -
submitted_at` (or `completed_at - created_at` for no-approval tasks). Completion rate
= completed / total per template. Capacity = active task count per profile (label it
"active load", NOT a fake 0–100% capacity score). If a KPI cannot be derived from
existing data, it is omitted. No fabricated numbers.

---

## 5. Key UX inconsistencies found

1. **Status visual language is duplicated/divergent.** 3+ copies of status→color
   maps, and they disagree (one uses `bg-blue-50`, another `bg-secondary`; board
   uses `purple` for review, `task-row` uses `warning`). One `StatusBadge` should
   own this.
2. **Info hierarchy on dashboards is flat.** Admin dashboard = 4 stat cards + 3
   nav cards + 2 lists. Nothing says "here's what needs attention". The nav
   shortcut cards are nothing but links the sidebar already has.
3. **Workflow library dumps every action on every card** — Execute + Edit +
   Duplicate + Archive + Delete all visible simultaneously (the brief explicitly
   forbids this).
4. **Layout strains on wide screens.** `AppShell` clamps content to `max-w-6xl`;
   dashboard itself clamps to `max-w-5xl`. On 1440p+ there are large unused
   margins. Width model needs to be per-surface (dashboards comfortable, builder/
   reports/tables wider).
5. **Task detail is a single 855-line file** mixing list items, dialogs, review
   controls, stepper, comments, attachments. Split into sections/components during
   redesign (pages stay, code organization improves).
6. **`My Tasks` defaults to Board view with 5 columns** including an empty
   "Rejected" column and no completed column; brief wants List primary, tabs
   Today/Upcoming/Waiting/Completed, dense rows.
7. **Loading = text spinners everywhere** ("Loading tasks…"). Brief wants skeleton
   layouts and no empty-state flash.
8. **Empty states are generic** ("No tasks found.") and inconsistent per page.
9. **Inconsistent status wording:** board says "In Review" while everywhere else
   says "Waiting Review". Workflow library uses "Execute" while brief wants "Run".
10. **No unified filter bar on tasks/reports** (brand/project/workflow/status/date).
11. **Reports have zero charts** even though `chart.tsx` + Recharts are installed.
12. **Notification center doesn't group by time** and top-bar notification badge +
   page are the only surfaces (no slide-in panel).
13. **Collapsed sidebar is not supported** although the shadcn `sidebar.tsx`
   primitive exists unused.
14. **Hardcoded colors** leak into routes (`text-purple-600 bg-purple-50`,
   `text-blue-700 border-blue-200`, etc.) bypassing the token system.

---

## 6. Backend dependencies we must preserve (do not touch)

- Workflow engine: PostgreSQL triggers + `SECURITY DEFINER` RPCs
  (`start_workflow`, `submit_task`, `withdraw_submission`, `review_task`) — the
  frontend calls them, never reimplements.
- RPC `get_workflow_status_board(p_brand_id)` — powers the status board.
- RLS everywhere — all reads must stay server-filtered; client-side filtering is
  only ever an additional layer, never a permit.
- Realtime: `notifications` INSERT channel + `tasks` brand channel. Feed
  dashboards from these; do not open dozens of new subscriptions.
- Server functions (`src/lib/server-functions.ts`): invite, signed upload URLs,
  attachment CRUD, permissions — service-role, CSRF-guarded. Reuse as-is.
- Storage bucket `task-attachments` (private, signed URLs).
- Supabase Auth + `handle_new_user()` profile trigger.

---

## 7. Recommended implementation order (adjusted from brief to de-risk)

1. **P0 — Token discipline + shared primitives (Phase 2)**
   - Add missing surface tokens; keep oklch.
   - Build `StatusBadge` (+ all 7 states + overdue/due-soon), `PageHeader` v2,
     `KpiCard` + `TrendIndicator`, `EmptyState` v2, layout skeletons,
     `EmployeeAvatar`, `SectionHeading` (from `SectionHeader`).
   - Replace the 4 hardcoded status maps with `StatusBadge`.
2. **P0 — AppShell** (adopt shadcn Sidebar for collapse + sheet, or upgrade custom
   shell): grouped nav (WORK/INSIGHTS/MANAGE), brand switcher, ⌘K search in top
   bar, quick-create menu for admins, notification dropdown/panel, collapsed-mode
   tooltips, remember collapse pref (`localStorage`).
   - Unblock: every other page inherits the new chrome.
3. **P1 — Admin dashboard** — the brand-defining surface. Attention-required list,
   KPI strip with trends, throughput chart (Recharts, lazily loaded), team
   workload, department health, workflow performance, activity feed, active
   workflow runs.
4. **P1 — Employee dashboard** — Focus Next task hero + Today + Waiting on others +
   Upcoming + My week + Recent completions.
5. **P1 — Team Lead dashboard** — My work + department overview + needs-review +
   team workload + department activity.
6. **P2 — My Tasks** — tabs Today/Upcoming/Waiting/Completed, list-primary, board
   secondary (auto-columns only), filter bar, dense `TaskRow`.
7. **P2 — Task detail** — two-column workspace (main 65–70% / right 30–35%),
   extract `WorkflowProgress` component, contextual review buttons, confirmation
   on destructive actions.
8. **P2 — Workflow library** — card redesign (Run + ⋯ overflow), Archived filter,
   search, filters; rename Execute → Run.
9. **P3 — Builder polish** — canvas chrome (zoom/fit), node design refresh,
   properties panel; no logic changes.
10. **P3 — Projects / Reports / Notifications / Status board** — charts in
    reports, grouped notification panel, project progress/health.
11. **P3 — Login + marketing-ish/index polish, dark mode bedding-in** (tokens
    already exist).
12. **P4 — QA pass** — responsive, reduced-motion, keyboard nav, contrast,
    realtime flush, empty/error states, per-role permission smoke test.

Rationale for deviation from brief order: AppShell before dashboards means every
dashboard redesign lands inside the final chrome (no double work). Tasks/task-detail
before library/builder because task flows are touched by all three dashboards.

---

## 8. Non-goals (explicit for whoever implements)

- No new roles, no manual task assignment, no draggable boards.
- No backend/migration changes for the redesign.
- No fabricated metrics, no AI insight placeholders.
- No new runtime dependencies (Recharts, cmdk, date-fns, Radix already installed).
- Never filter per-RLS client-side as the sole gate.
- Never break `routeTree.gen.ts`; never edit it by hand.
- Keep Cloudflare Workers / Nitro compatibility (no Node-only libs in client).

---

## 9. Definition of done (from brief acceptance test)

- **Admin:** in ~10s knows active work, overdue, what needs review, blocked
  workflows, overloaded departments, throughput trend, and their next action.
- **Employee:** in ~5s knows next task, today's tasks, overdue, what's waiting on
  others, recent completions.
- **Team Lead:** in ~10s knows own next task, team work, needs-my-review,
  overloaded teammates, department overdue.
- Product looks and feels like a commercial SaaS, not a generated admin template.