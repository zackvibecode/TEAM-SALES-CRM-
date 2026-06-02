-- Fix role lookup + reliable sales lead access (run in Supabase SQL Editor)

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;

-- Ensure sales can read own profile (needed for session / role)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Re-assert sales lead policies
DROP POLICY IF EXISTS "Sales users can select own leads" ON public.leads;
CREATE POLICY "Sales users can select own leads" ON public.leads
  FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales users can update own leads" ON public.leads;
CREATE POLICY "Sales users can update own leads" ON public.leads
  FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales users can read own files" ON public.uploaded_files;
CREATE POLICY "Sales users can read own files" ON public.uploaded_files
  FOR SELECT USING (owner_user_id = auth.uid());
