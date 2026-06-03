-- Follow Up Queue system (additive — keeps existing leads / lead_activities)

-- Extend leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_sales_user_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_click_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follow_up_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_followed_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_follow_up_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_follow_up_status_check
  CHECK (follow_up_status IN ('none', 'pending', 'completed', 'overdue'));

-- follow_ups queue
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sales_user_name TEXT,
  follow_up_number INTEGER NOT NULL DEFAULT 1,
  follow_up_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  completed_at TIMESTAMPTZ,
  overdue_logged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT follow_ups_status_check CHECK (status IN ('pending', 'completed', 'overdue'))
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date_status ON public.follow_ups(follow_up_date, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_sales ON public.follow_ups(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON public.leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_status ON public.leads(follow_up_status);

-- Rich activity log (alongside legacy lead_activities)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sales_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sales_user_name TEXT,
  action_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_lead ON public.activity_logs(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- RLS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access follow_ups" ON public.follow_ups;
CREATE POLICY "Admin full access follow_ups" ON public.follow_ups
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sales read own follow_ups" ON public.follow_ups;
CREATE POLICY "Sales read own follow_ups" ON public.follow_ups
  FOR SELECT USING (
    sales_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sales insert own follow_ups" ON public.follow_ups;
CREATE POLICY "Sales insert own follow_ups" ON public.follow_ups
  FOR INSERT WITH CHECK (
    sales_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sales update own follow_ups" ON public.follow_ups;
CREATE POLICY "Sales update own follow_ups" ON public.follow_ups
  FOR UPDATE USING (
    sales_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin full access activity_logs" ON public.activity_logs;
CREATE POLICY "Admin full access activity_logs" ON public.activity_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sales read own activity_logs" ON public.activity_logs;
CREATE POLICY "Sales read own activity_logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sales insert own activity_logs" ON public.activity_logs;
CREATE POLICY "Sales insert own activity_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.owner_user_id = auth.uid())
  );

-- Backfill denormalized fields from existing data
UPDATE public.leads
SET
  whatsapp_click_count = CASE
    WHEN status IN ('Clicked', 'Follow Up', 'Interested', 'Converted') AND clicked_at IS NOT NULL
    THEN GREATEST(whatsapp_click_count, 1)
    ELSE whatsapp_click_count
  END,
  last_contacted_at = COALESCE(last_contacted_at, clicked_at);

UPDATE public.leads l
SET campaign_name = uf.campaign_name
FROM public.uploaded_files uf
WHERE uf.id = l.source_file_id AND l.campaign_name IS NULL;

UPDATE public.leads l
SET assigned_sales_user_name = p.full_name
FROM public.profiles p
WHERE p.id = l.owner_user_id AND l.assigned_sales_user_name IS NULL;

UPDATE public.leads
SET
  follow_up_status = 'pending',
  next_follow_up_date = (CURRENT_DATE + INTERVAL '1 day')::date
WHERE follow_up_status = 'none'
  AND whatsapp_click_count > 0
  AND next_follow_up_date IS NULL;
