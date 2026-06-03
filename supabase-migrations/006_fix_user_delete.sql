-- Fix: Allow user deletion from Supabase Auth Dashboard
-- Problem: uploaded_files.owner_user_id and uploaded_by_admin_id were NOT NULL
--          with ON DELETE NO ACTION, blocking FK cascade from auth.users → profiles.
-- Solution: Make columns nullable + change FK to ON DELETE SET NULL.
--          Also fix leads.clicked_by FK from NO ACTION to SET NULL.

-- 1. Make uploaded_files FK columns nullable
ALTER TABLE public.uploaded_files ALTER COLUMN owner_user_id DROP NOT NULL;
ALTER TABLE public.uploaded_files ALTER COLUMN uploaded_by_admin_id DROP NOT NULL;

-- 2. Change uploaded_files FKs to ON DELETE SET NULL
ALTER TABLE public.uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_owner_user_id_fkey;
ALTER TABLE public.uploaded_files ADD CONSTRAINT uploaded_files_owner_user_id_fkey
  FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_uploaded_by_admin_id_fkey;
ALTER TABLE public.uploaded_files ADD CONSTRAINT uploaded_files_uploaded_by_admin_id_fkey
  FOREIGN KEY (uploaded_by_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Change leads.clicked_by FK to ON DELETE SET NULL
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_clicked_by_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_clicked_by_fkey
  FOREIGN KEY (clicked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Verification
SELECT 'FK fix applied. User deletion should now work from Supabase Auth Dashboard.' AS status;
