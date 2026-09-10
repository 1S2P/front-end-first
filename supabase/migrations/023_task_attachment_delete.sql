-- ─── 023: Task attachment delete ───────────────────────────────────────────────
-- 1. Add 'file_removed' to the activity_action enum so deleting a file can be
--    tracked in the task timeline.
alter type activity_action add value if not exists 'file_removed';