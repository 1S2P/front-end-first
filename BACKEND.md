# Backend — Supabase Setup Guide

## Stack
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (email/password + invite flow)
- **Realtime**: Supabase Realtime (notifications, task updates)
- **Storage**: Supabase Storage (task attachments)
- **Edge Functions**: Deno (user invitation)

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Save your database password

---

## 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```sh
cp .env.example .env.local
```

Fill in your values from **Supabase Dashboard → Settings → API**:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 3. Run Migrations

In the **Supabase Dashboard → SQL Editor**, run each file in order:

1. `supabase/migrations/001_schema.sql` — Creates all tables, types, indexes
2. `supabase/migrations/002_rls.sql` — Row Level Security policies
3. `supabase/migrations/003_functions.sql` — Workflow engine, triggers, RPC functions

Or using the Supabase CLI:

```sh
npx supabase db push
```

---

## 4. Run Seed Data

In **SQL Editor**, run `supabase/seed.sql`.

This seeds:
- 2 brands (Danfe Tea, Nepal Tea Exchange)
- 4 departments (SEO, Social Media, Graphic Design, Videography)
- 6 workflow templates with steps, checklist items, and connections

---

## 5. Create Demo Users

Go to **Supabase Dashboard → Authentication → Users → Invite User** for each:

| Email | Name | Role |
|-------|------|------|
| pratik@danfetea.com | Pratik R. | admin |
| sita@danfetea.com | Sita R. | team_lead |
| meera@danfetea.com | Meera K. | team_lead |
| aakash@danfetea.com | Aakash S. | team_lead |
| sneha@danfetea.com | Sneha P. | team_lead |
| ravi@danfetea.com | Ravi T. | team_member |
| anita@danfetea.com | Anita M. | team_member |

After creating each user, update their profile in **SQL Editor**:

```sql
-- Example for admin user (replace UUID with actual user ID from auth.users)
UPDATE profiles SET
  name = 'Pratik R.',
  initials = 'PR',
  role = 'admin',
  department_id = 'seo',
  avatar_color = 'bg-primary/15 text-primary'
WHERE email = 'pratik@danfetea.com';

-- Add brand memberships
INSERT INTO profile_brands (profile_id, brand_id)
SELECT id, 'danfe' FROM profiles WHERE email = 'pratik@danfetea.com';
INSERT INTO profile_brands (profile_id, brand_id)
SELECT id, 'nte' FROM profiles WHERE email = 'pratik@danfetea.com';
```

---

## 6. Create Storage Bucket

In **Supabase Dashboard → Storage → New Bucket**:

- Name: `task-attachments`
- Public: No (private)
- File size limit: 50 MB

Add storage policy (SQL Editor):

```sql
-- Allow authenticated users to upload to their task folders
CREATE POLICY "task_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-attachments');

-- Allow authenticated users to read attachments for tasks they can access
CREATE POLICY "task_attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'task-attachments');
```

---

## 7. Deploy Edge Function (User Invitations)

```sh
npx supabase functions deploy invite-user
```

Set the service role secret:

```sh
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Architecture Overview

### Workflow Engine (Database Triggers)

The workflow engine runs entirely in PostgreSQL via triggers:

```
Admin calls start_workflow() RPC
  → Creates WorkflowInstance
  → Creates first Task from step[0]
  → Notifies assigned user

Employee submits task via submit_task() RPC
  → If approval_required: status → waiting_review
  → If not: status → completed → triggers advance_workflow()

Reviewer calls review_task() RPC
  → approve: status → completed → triggers advance_workflow()
  → reject: status → rejected
  → request_changes: status → needs_revision

advance_workflow() trigger fires on status = 'completed'
  → Finds next step by step_order
  → Creates next Task automatically
  → Notifies next assigned user
  → If no more steps: marks instance completed
```

### RLS Permission Model

| Role | Tasks | Workflows | Users | Admin |
|------|-------|-----------|-------|-------|
| admin | All | All | All | Yes |
| team_lead | Own + Department | Read | Read | No |
| team_member | Own only | Read | Read | No |

### Realtime Subscriptions

The frontend subscribes to:
- `notifications` table — filtered by `user_id`
- `tasks` table — for live status updates

---

## API Reference (Frontend Hooks)

### Auth
- `useSession()` — current auth session
- `useCurrentProfile()` — current user profile with brands
- `useSignIn()` — email/password login
- `useSignOut()` — logout

### Tasks
- `useMyTasks(brandId?)` — tasks assigned to current user
- `useDepartmentTasks(deptId, brandId?)` — team lead view
- `useTask(id)` — single task with all relations
- `useSubmitTask()` — submit for review or complete
- `useWithdrawSubmission()` — pull back from review
- `useReviewTask()` — approve / reject / request changes
- `useUpdateChecklist()` — toggle checklist item
- `useAddComment()` — add comment + activity log
- `useUploadAttachment()` — upload file to storage

### Workflows
- `useWorkflowTemplates(brandId?)` — list templates
- `useWorkflowTemplate(id)` — single template with steps
- `useWorkflowInstances(brandId?)` — running instances
- `useStartWorkflow()` — start a workflow on a project
- `useStopWorkflow()` — stop a running instance
- `useSaveWorkflowTemplate()` — create/update template with steps
- `useArchiveWorkflowTemplate()` — archive/unarchive
- `useDeleteWorkflowTemplate()` — delete template

### Notifications
- `useNotifications()` — all notifications (realtime)
- `useUnreadCount()` — badge count
- `useMarkNotificationRead()` — mark one read
- `useMarkAllRead()` — mark all read

### Admin
- `useBrands()` / `useCreateBrand()`
- `useDepartments(brandId?)` / `useCreateDepartment()`
- `useProfiles(brandId?)` / `useUpdateProfile()`
- `useInviteUser()` — sends invite email via edge function
- `useProjects(brandId?)` / `useCreateProject()` / `useUpdateProject()`
- `useReportStats(brandId?)` — aggregated task statistics
