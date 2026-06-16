-- Lead Sources: admin-defined categories for tracking where leads come from
-- Synced across all users automatically via shared table

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_lead_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_sources_updated_at ON public.lead_sources;
CREATE TRIGGER trg_lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_sources_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_sources_active ON public.lead_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_sources_name ON public.lead_sources(name);

-- Enable RLS
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "lead_sources_admin_full" ON public.lead_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- All authenticated users (sales + admin): can read active sources
CREATE POLICY "lead_sources_select_all" ON public.lead_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Seed default lead sources
INSERT INTO public.lead_sources (name, is_active) VALUES
  ('Facebook Ads', true),
  ('Walk-in', true),
  ('Link / Blaster Link', true),
  ('Post Follow-up', true)
ON CONFLICT (name) DO NOTHING;
