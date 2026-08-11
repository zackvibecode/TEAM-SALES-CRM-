-- Manual cleanup: merge duplicate sales_pics that share the same name (case-insensitive).
-- Run in Supabase SQL Editor AFTER reviewing the preview queries.
-- Does NOT auto-run from the app.

-- 1) Preview duplicate names
SELECT lower(name) AS name_key, count(*) AS cnt, array_agg(id ORDER BY created_at) AS pic_ids
FROM public.sales_pics
WHERE status = 'active'
GROUP BY lower(name)
HAVING count(*) > 1
ORDER BY cnt DESC;

-- 2) Preview which row would be the "keeper" per name
-- Keeper = has user_id first, else oldest created_at
WITH ranked AS (
  SELECT
    id,
    name,
    user_id,
    created_at,
    lower(name) AS name_key,
    row_number() OVER (
      PARTITION BY lower(name)
      ORDER BY
        CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
        created_at ASC
    ) AS rn
  FROM public.sales_pics
  WHERE status = 'active'
)
SELECT *
FROM ranked
WHERE name_key IN (
  SELECT lower(name)
  FROM public.sales_pics
  WHERE status = 'active'
  GROUP BY lower(name)
  HAVING count(*) > 1
)
ORDER BY name_key, rn;

-- 3) Merge duplicates into keeper (reassign leads + follow-ups, deactivate extras)
DO $$
DECLARE
  r RECORD;
  keeper_id UUID;
  dup_id UUID;
BEGIN
  FOR r IN
    SELECT lower(name) AS name_key
    FROM public.sales_pics
    WHERE status = 'active'
    GROUP BY lower(name)
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keeper_id
    FROM public.sales_pics
    WHERE status = 'active' AND lower(name) = r.name_key
    ORDER BY
      CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
      created_at ASC
    LIMIT 1;

    FOR dup_id IN
      SELECT id
      FROM public.sales_pics
      WHERE status = 'active'
        AND lower(name) = r.name_key
        AND id <> keeper_id
    LOOP
      UPDATE public.sales_leads
      SET assigned_pic_id = keeper_id
      WHERE assigned_pic_id = dup_id;

      UPDATE public.lead_follow_ups
      SET pic_id = keeper_id
      WHERE pic_id = dup_id;

      UPDATE public.sales_pics
      SET status = 'inactive', updated_at = now()
      WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- 4) Verify no active duplicates remain
SELECT lower(name) AS name_key, count(*) AS cnt
FROM public.sales_pics
WHERE status = 'active'
GROUP BY lower(name)
HAVING count(*) > 1;
