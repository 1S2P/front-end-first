-- ─── Seed: Brands ────────────────────────────────────────────────────────────
insert into brands (id, name, initials, color) values
  ('danfe', 'Danfe Tea',          'DT', 'bg-accent text-accent-foreground'),
  ('nte',   'Nepal Tea Exchange', 'NT', 'bg-primary/15 text-primary');

-- ─── Seed: Departments ───────────────────────────────────────────────────────
insert into departments (id, name) values
  ('seo',           'SEO'),
  ('social_media',  'Social Media'),
  ('graphic_design','Graphic Design'),
  ('videography',   'Videography / Video Editing');

insert into department_brands (department_id, brand_id) values
  ('seo',           'danfe'), ('seo',           'nte'),
  ('social_media',  'danfe'), ('social_media',  'nte'),
  ('graphic_design','danfe'), ('graphic_design','nte'),
  ('videography',   'danfe'), ('videography',   'nte');

-- ─── NOTE ─────────────────────────────────────────────────────────────────────
-- Profiles are created automatically via the handle_new_user() trigger when
-- users sign up through Supabase Auth. To seed demo users, create them via
-- the Supabase Dashboard → Authentication → Users, then update their profiles:
--
--   update profiles set
--     name = 'Pratik R.', initials = 'PR', role = 'admin',
--     department_id = 'seo', avatar_color = 'bg-primary/15 text-primary'
--   where email = 'pratik@danfetea.com';
--
-- Then add brand memberships:
--   insert into profile_brands (profile_id, brand_id)
--   select id, 'danfe' from profiles where email = 'pratik@danfetea.com';
--   insert into profile_brands (profile_id, brand_id)
--   select id, 'nte' from profiles where email = 'pratik@danfetea.com';
--
-- ─── Seed: Workflow Templates ─────────────────────────────────────────────────
-- Run after creating users so assigned_user_id can reference real profile IDs.
-- Templates with null assigned_user_id are valid — admin assigns on workflow start.

insert into workflow_templates (id, name, description, department_id, brand_id, status, usage_count) values
  ('11111111-0000-0000-0000-000000000001', 'Instagram Story Posting',
   'End-to-end workflow for creating and posting Instagram stories',
   'social_media', 'danfe', 'active', 24),
  ('11111111-0000-0000-0000-000000000002', 'SEO Blog Publishing',
   'Research, write, optimize, and publish SEO blog posts',
   'seo', 'danfe', 'active', 18),
  ('11111111-0000-0000-0000-000000000003', 'Facebook Ad Campaign',
   'Create and launch Facebook ad campaigns',
   'social_media', 'nte', 'active', 12),
  ('11111111-0000-0000-0000-000000000004', 'Product Photography',
   'Product photography shoot and editing workflow',
   'graphic_design', 'danfe', 'active', 8),
  ('11111111-0000-0000-0000-000000000005', 'Monthly Report',
   'Generate monthly performance report across departments',
   'seo', 'danfe', 'archived', 6),
  ('11111111-0000-0000-0000-000000000006', 'Video Editing Pipeline',
   'Edit, review, and publish video content',
   'videography', 'nte', 'active', 10);

-- ─── Instagram Story Posting steps ───────────────────────────────────────────
insert into workflow_steps (id, template_id, name, description, department_id, approval_required, estimated_time, deadline_offset, step_order, position_x, position_y) values
  ('22222222-0001-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Design Story', 'Create the visual design for the story',
   'graphic_design', false, '4h', '24', 0, 100, 100),
  ('22222222-0001-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'Review Design', 'Team lead reviews the design',
   'social_media', true, '2h', '12', 1, 100, 250),
  ('22222222-0001-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'Upload Story', 'Upload and schedule the story on Instagram',
   'social_media', false, '1h', '12', 2, 100, 400),
  ('22222222-0001-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'Quality Check', 'Verify the story is live and correct',
   'social_media', true, '0.5h', '12', 3, 100, 550);

insert into step_checklist_items (step_id, label, sort_order) values
  ('22222222-0001-0000-0000-000000000001', 'Follow brand guidelines', 0),
  ('22222222-0001-0000-0000-000000000001', 'Use correct dimensions (1080x1920)', 1),
  ('22222222-0001-0000-0000-000000000002', 'Check brand consistency', 0),
  ('22222222-0001-0000-0000-000000000003', 'Add captions', 0),
  ('22222222-0001-0000-0000-000000000003', 'Add hashtags', 1),
  ('22222222-0001-0000-0000-000000000004', 'Verify link works', 0);

insert into workflow_connections (template_id, from_step, to_step) values
  ('11111111-0000-0000-0000-000000000001', '22222222-0001-0000-0000-000000000001', '22222222-0001-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0001-0000-0000-000000000002', '22222222-0001-0000-0000-000000000003'),
  ('11111111-0000-0000-0000-000000000001', '22222222-0001-0000-0000-000000000003', '22222222-0001-0000-0000-000000000004');

-- ─── SEO Blog Publishing steps ───────────────────────────────────────────────
insert into workflow_steps (id, template_id, name, description, department_id, approval_required, estimated_time, deadline_offset, step_order, position_x, position_y) values
  ('22222222-0002-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002',
   'Keyword Research', 'Research target keywords and search intent',
   'seo', false, '3h', '24', 0, 100, 100),
  ('22222222-0002-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002',
   'Write Content', 'Write the blog post content',
   'seo', false, '8h', '72', 1, 100, 250),
  ('22222222-0002-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002',
   'Content Review', 'Review content for quality and SEO',
   'seo', true, '2h', '12', 2, 100, 400),
  ('22222222-0002-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002',
   'Publish', 'Publish the blog post on the website',
   'seo', false, '1h', '12', 3, 100, 550);

insert into step_checklist_items (step_id, label, sort_order) values
  ('22222222-0002-0000-0000-000000000001', 'Identify primary keyword', 0),
  ('22222222-0002-0000-0000-000000000001', 'Find LSI keywords', 1),
  ('22222222-0002-0000-0000-000000000002', 'Follow content brief', 0),
  ('22222222-0002-0000-0000-000000000002', 'Include target keywords', 1),
  ('22222222-0002-0000-0000-000000000003', 'Check readability', 0),
  ('22222222-0002-0000-0000-000000000004', 'Add meta tags', 0),
  ('22222222-0002-0000-0000-000000000004', 'Set featured image', 1);

insert into workflow_connections (template_id, from_step, to_step) values
  ('11111111-0000-0000-0000-000000000002', '22222222-0002-0000-0000-000000000001', '22222222-0002-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000002', '22222222-0002-0000-0000-000000000002', '22222222-0002-0000-0000-000000000003'),
  ('11111111-0000-0000-0000-000000000002', '22222222-0002-0000-0000-000000000003', '22222222-0002-0000-0000-000000000004');

-- ─── Facebook Ad Campaign steps ───────────────────────────────────────────────
insert into workflow_steps (id, template_id, name, description, department_id, approval_required, estimated_time, deadline_offset, step_order, position_x, position_y) values
  ('22222222-0003-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003',
   'Ad Brief', 'Create advertising brief and objectives',
   'social_media', false, '2h', '24', 0, 100, 100),
  ('22222222-0003-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003',
   'Design Ad Creatives', 'Design images and copy for the ad',
   'graphic_design', false, '6h', '48', 1, 100, 250),
  ('22222222-0003-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003',
   'Review & Approve', 'Review ad creatives and copy',
   'social_media', true, '2h', '12', 2, 100, 400),
  ('22222222-0003-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003',
   'Launch Campaign', 'Set up and launch the campaign on Facebook',
   'social_media', false, '1h', '12', 3, 100, 550);

insert into step_checklist_items (step_id, label, sort_order) values
  ('22222222-0003-0000-0000-000000000001', 'Define audience', 0),
  ('22222222-0003-0000-0000-000000000001', 'Set budget', 1),
  ('22222222-0003-0000-0000-000000000002', 'Create 3 variations', 0),
  ('22222222-0003-0000-0000-000000000003', 'Check compliance', 0),
  ('22222222-0003-0000-0000-000000000004', 'Set targeting', 0),
  ('22222222-0003-0000-0000-000000000004', 'Schedule posts', 1);

insert into workflow_connections (template_id, from_step, to_step) values
  ('11111111-0000-0000-0000-000000000003', '22222222-0003-0000-0000-000000000001', '22222222-0003-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000003', '22222222-0003-0000-0000-000000000002', '22222222-0003-0000-0000-000000000003'),
  ('11111111-0000-0000-0000-000000000003', '22222222-0003-0000-0000-000000000003', '22222222-0003-0000-0000-000000000004');

-- ─── Product Photography steps ────────────────────────────────────────────────
insert into workflow_steps (id, template_id, name, description, department_id, approval_required, estimated_time, deadline_offset, step_order, position_x, position_y) values
  ('22222222-0004-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004',
   'Shot List', 'Prepare shot list and references',
   'graphic_design', false, '2h', '24', 0, 100, 100),
  ('22222222-0004-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004',
   'Photo Shoot', 'Conduct the product photography session',
   'graphic_design', false, '8h', '48', 1, 100, 250),
  ('22222222-0004-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004',
   'Edit Photos', 'Post-process and retouch photos',
   'graphic_design', false, '6h', '48', 2, 100, 400),
  ('22222222-0004-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004',
   'Final Approval', 'Review final images',
   'graphic_design', true, '1h', '12', 3, 100, 550);

insert into step_checklist_items (step_id, label, sort_order) values
  ('22222222-0004-0000-0000-000000000001', 'List all products', 0),
  ('22222222-0004-0000-0000-000000000002', 'Set up lighting', 0),
  ('22222222-0004-0000-0000-000000000002', 'Capture all angles', 1),
  ('22222222-0004-0000-0000-000000000003', 'Color correct', 0),
  ('22222222-0004-0000-0000-000000000003', 'Remove background', 1),
  ('22222222-0004-0000-0000-000000000004', 'Check resolution', 0);

insert into workflow_connections (template_id, from_step, to_step) values
  ('11111111-0000-0000-0000-000000000004', '22222222-0004-0000-0000-000000000001', '22222222-0004-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000004', '22222222-0004-0000-0000-000000000002', '22222222-0004-0000-0000-000000000003'),
  ('11111111-0000-0000-0000-000000000004', '22222222-0004-0000-0000-000000000003', '22222222-0004-0000-0000-000000000004');

-- ─── Monthly Report steps ─────────────────────────────────────────────────────
insert into workflow_steps (id, template_id, name, description, department_id, approval_required, estimated_time, deadline_offset, step_order, position_x, position_y) values
  ('22222222-0005-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005',
   'Collect Data', 'Gather metrics from all channels',
   'seo', false, '4h', '48', 0, 100, 100),
  ('22222222-0005-0000-0000-000000000002', '11111111-0000-0000-0000-000000000005',
   'Create Report', 'Compile data into report format',
   'seo', false, '4h', '24', 1, 100, 250),
  ('22222222-0005-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005',
   'Review Report', 'Manager reviews the report',
   'seo', true, '2h', '12', 2, 100, 400);

insert into step_checklist_items (step_id, label, sort_order) values
  ('22222222-0005-0000-0000-000000000001', 'SEO metrics', 0),
  ('22222222-0005-0000-0000-000000000001', 'Social metrics', 1),
  ('22222222-0005-0000-0000-000000000002', 'Use template', 0),
  ('22222222-0005-0000-0000-000000000003', 'Check accuracy', 0);

insert into workflow_connections (template_id, from_step, to_step) values
  ('11111111-0000-0000-0000-000000000005', '22222222-0005-0000-0000-000000000001', '22222222-0005-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000005', '22222222-0005-0000-0000-000000000002', '22222222-0005-0000-0000-000000000003');

-- ─── Video Editing Pipeline steps ────────────────────────────────────────────
insert into workflow_steps (id, template_id, name, description, department_id, approval_required, estimated_time, deadline_offset, step_order, position_x, position_y) values
  ('22222222-0006-0000-0000-000000000001', '11111111-0000-0000-0000-000000000006',
   'Raw Footage Review', 'Review and select best footage',
   'videography', false, '3h', '24', 0, 100, 100),
  ('22222222-0006-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006',
   'Edit Video', 'Cut, arrange, and add effects',
   'videography', false, '12h', '72', 1, 100, 250),
  ('22222222-0006-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006',
   'Review Edit', 'Review the edited video',
   'videography', true, '2h', '12', 2, 100, 400),
  ('22222222-0006-0000-0000-000000000004', '11111111-0000-0000-0000-000000000006',
   'Export & Publish', 'Export final video and publish',
   'videography', false, '2h', '12', 3, 100, 550);

insert into step_checklist_items (step_id, label, sort_order) values
  ('22222222-0006-0000-0000-000000000001', 'Select best clips', 0),
  ('22222222-0006-0000-0000-000000000002', 'Add transitions', 0),
  ('22222222-0006-0000-0000-000000000002', 'Color grade', 1),
  ('22222222-0006-0000-0000-000000000003', 'Check audio sync', 0),
  ('22222222-0006-0000-0000-000000000004', 'Export in correct format', 0),
  ('22222222-0006-0000-0000-000000000004', 'Upload to platform', 1);

insert into workflow_connections (template_id, from_step, to_step) values
  ('11111111-0000-0000-0000-000000000006', '22222222-0006-0000-0000-000000000001', '22222222-0006-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000006', '22222222-0006-0000-0000-000000000002', '22222222-0006-0000-0000-000000000003'),
  ('11111111-0000-0000-0000-000000000006', '22222222-0006-0000-0000-000000000003', '22222222-0006-0000-0000-000000000004');
