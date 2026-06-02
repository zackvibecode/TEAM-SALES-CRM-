# Database migration (required for new features)

Run the SQL in **Supabase Dashboard → SQL Editor**:

`supabase-migrations/001_campaign_features.sql`

Then run (fixes sales not seeing assigned tasks):

`supabase-migrations/002_fix_sales_assignment.sql`

**Required if sales dashboard shows "infinite recursion" on profiles:**

`supabase-migrations/003_fix_rls_recursion.sql`

**If WhatsApp click does not update status:**

`supabase-migrations/004_sales_update_policies.sql`

**For daily follow-up goal (custom target + congrats popup):**

`supabase-migrations/005_daily_follow_up_goal.sql`

This adds:


- Campaign name, source tag, archive flag on uploads
- Follow-up date on leads
- Monthly KPI targets on sales profiles
- Audit log table

Without migration, upload still works (fallback mode) but campaign/KPI/archive/audit features are limited.
