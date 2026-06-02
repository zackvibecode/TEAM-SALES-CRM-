-- FIX: infinite recursion on profiles (run in Supabase SQL Editor)
-- Cause: Admin RLS policies query profiles inside profiles policies.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

-- PROFILES: remove recursive admin checks
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- UPLOADED_FILES
DROP POLICY IF EXISTS "Admin full access to uploaded_files" ON public.uploaded_files;
CREATE POLICY "Admin full access to uploaded_files" ON public.uploaded_files
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sales users can read own files" ON public.uploaded_files;
CREATE POLICY "Sales users can read own files" ON public.uploaded_files
  FOR SELECT USING (owner_user_id = auth.uid());

-- LEADS
DROP POLICY IF EXISTS "Admin full access to leads" ON public.leads;
CREATE POLICY "Admin full access to leads" ON public.leads
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sales users can select own leads" ON public.leads;
CREATE POLICY "Sales users can select own leads" ON public.leads
  FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales users can update own leads" ON public.leads;
CREATE POLICY "Sales users can update own leads" ON public.leads
  FOR UPDATE USING (owner_user_id = auth.uid());

-- LEAD_ACTIVITIES
DROP POLICY IF EXISTS "Admin full access to lead_activities" ON public.lead_activities;
CREATE POLICY "Admin full access to lead_activities" ON public.lead_activities
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sales users can read own activities" ON public.lead_activities;
CREATE POLICY "Sales users can read own activities" ON public.lead_activities
  FOR SELECT USING (sales_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales users can insert own activities" ON public.lead_activities;
CREATE POLICY "Sales users can insert own activities" ON public.lead_activities
  FOR INSERT WITH CHECK (sales_user_id = auth.uid());

-- AUDIT_LOGS (if table exists)
DROP POLICY IF EXISTS "Admin read audit_logs" ON public.audit_logs;
CREATE POLICY "Admin read audit_logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- Fix sales users with empty/wrong role (adjust email if needed)
UPDATE public.profiles
SET role = 'sales'
WHERE role IS NULL OR role = ''
   OR email ILIKE 'alef@nusatravel.com'
   OR email ILIKE 'alief@%';
