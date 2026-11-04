-- Upload History: record who uploaded each batch so admin sees a team report.
-- Safe to run repeatedly.

ALTER TABLE public.sales_lead_batches
  ADD COLUMN IF NOT EXISTS uploaded_by TEXT NOT NULL DEFAULT '';
