-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  uploaded_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_file_id UUID REFERENCES public.uploaded_files(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  package_interest TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Clicked', 'Follow Up', 'Interested', 'Not Interested', 'No Response', 'Converted')),
  clicked_at TIMESTAMPTZ,
  clicked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  sales_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('whatsapp_clicked', 'status_updated', 'note_updated')),
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES --
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can insert profiles
CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow the trigger to insert the profile when a user signs up
    auth.uid() = id
  );

-- Admin can update profiles
CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPLOADED_FILES POLICIES --
-- Admin can do all operations on uploaded_files
CREATE POLICY "Admin full access to uploaded_files" ON public.uploaded_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales users can read their own uploaded files
CREATE POLICY "Sales users can read own files" ON public.uploaded_files
  FOR SELECT USING (owner_user_id = auth.uid());

-- LEADS POLICIES --
-- Admin can do all operations on leads
CREATE POLICY "Admin full access to leads" ON public.leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales users can read only their own leads
CREATE POLICY "Sales users can select own leads" ON public.leads
  FOR SELECT USING (owner_user_id = auth.uid());

-- Sales users can update only their own leads
CREATE POLICY "Sales users can update own leads" ON public.leads
  FOR UPDATE USING (owner_user_id = auth.uid());

-- Sales users can insert leads (for file uploads via admin)
-- This is controlled at the application level

-- LEAD_ACTIVITIES POLICIES --
-- Admin can read all lead activities
CREATE POLICY "Admin full access to lead_activities" ON public.lead_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales users can read their own lead activities
CREATE POLICY "Sales users can read own activities" ON public.lead_activities
  FOR SELECT USING (sales_user_id = auth.uid());

-- Sales users can insert their own lead activities
CREATE POLICY "Sales users can insert own activities" ON public.lead_activities
  FOR INSERT WITH CHECK (sales_user_id = auth.uid());

-- Trigger: Auto-create profile when user signs up (default role = sales)
-- Admin must manually change role via SQL or admin panel
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'sales'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_clicked_at ON public.leads(clicked_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user ON public.lead_activities(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner ON public.uploaded_files(owner_user_id);