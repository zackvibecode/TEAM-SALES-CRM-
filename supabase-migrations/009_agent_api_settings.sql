-- Admin-managed CRM agent API key (read-only AI access)

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access app_settings" ON public.app_settings;
CREATE POLICY "Admin full access app_settings" ON public.app_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
