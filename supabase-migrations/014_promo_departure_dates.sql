-- Multiple departure dates per promo (one poster, many dates)

ALTER TABLE public.promos
  ADD COLUMN IF NOT EXISTS departure_dates JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.promos
SET departure_dates = jsonb_build_array(ends_at)
WHERE ends_at IS NOT NULL
  AND (departure_dates IS NULL OR departure_dates = '[]'::jsonb);

CREATE INDEX IF NOT EXISTS idx_promos_departure_dates
  ON public.promos USING gin (departure_dates);
