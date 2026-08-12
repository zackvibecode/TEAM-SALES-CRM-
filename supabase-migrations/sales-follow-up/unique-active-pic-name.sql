-- Prevent future active PIC name duplicates (case-insensitive).
-- Run AFTER merging existing duplicates (app auto-merges on getPics, or run dedupe-pics.sql).

CREATE UNIQUE INDEX IF NOT EXISTS sales_pics_active_name_unique
ON public.sales_pics (lower(trim(name)))
WHERE status = 'active';
