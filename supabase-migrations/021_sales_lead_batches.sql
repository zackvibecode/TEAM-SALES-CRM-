-- Upload Batch History: one row per Excel upload, leads linked via batch_id.
-- Safe to run repeatedly. Does not modify or delete existing lead data.

CREATE TABLE IF NOT EXISTS public.sales_lead_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_leads INTEGER NOT NULL DEFAULT 0,
  assign_mode TEXT NOT NULL DEFAULT 'single',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.sales_lead_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_leads_batch ON public.sales_leads(batch_id);

-- Backfill: group pre-existing imported leads by their source label so the
-- history table is useful immediately. One batch per distinct Excel source.
INSERT INTO public.sales_lead_batches (batch_name, file_name, total_leads, assign_mode)
SELECT DISTINCT ON (source)
  COALESCE(NULLIF(source, ''), 'Unknown'),
  COALESCE(NULLIF(source, ''), 'Unknown'),
  COUNT(*) OVER (PARTITION BY source),
  'single'
FROM public.sales_leads
WHERE source LIKE 'Excel Upload:%' AND batch_id IS NULL;

UPDATE public.sales_leads sl
SET batch_id = b.id
FROM public.sales_lead_batches b
WHERE sl.batch_id IS NULL
  AND sl.source = b.file_name
  AND b.file_name LIKE 'Excel Upload:%';
