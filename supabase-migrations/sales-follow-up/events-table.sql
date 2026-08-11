CREATE TABLE IF NOT EXISTS public.sales_follow_up_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  pic_id UUID,
  user_id UUID,
  user_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sfu_events_lead ON public.sales_follow_up_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_sfu_events_created ON public.sales_follow_up_events(created_at DESC);

GRANT ALL ON TABLE public.sales_follow_up_events TO postgres, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
