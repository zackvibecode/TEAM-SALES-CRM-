-- Sales Follow-Up: preserve imported Notes and the persistent round-robin cursor.
-- Safe to run repeatedly. Does not modify or delete any lead data.

ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS import_notes TEXT NOT NULL DEFAULT '';

-- app_settings is created by 009_agent_api_settings.sql. Keep this migration
-- self-contained for installations that apply the sales follow-up module alone.
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.app_settings (key, value)
VALUES ('sales_leads_round_robin_last_pic_id', '')
ON CONFLICT (key) DO NOTHING;
