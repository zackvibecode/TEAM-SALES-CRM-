-- Excel row order (No. column) for stable Old→New sort when created_at is identical
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS list_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_leads_owner_list_order
  ON public.leads (owner_user_id, list_order);
