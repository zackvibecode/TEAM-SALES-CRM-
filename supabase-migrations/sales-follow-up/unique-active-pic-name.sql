-- Merge duplicate active PICs, then add unique index.
-- Run ALL of this in Supabase SQL Editor (one go).

-- 1) Preview duplicates (optional — safe to leave)
SELECT lower(trim(name)) AS name_key, count(*) AS cnt, array_agg(id ORDER BY created_at) AS pic_ids
FROM public.sales_pics
WHERE status = 'active'
GROUP BY lower(trim(name))
HAVING count(*) > 1
ORDER BY cnt DESC;

-- 2) Merge: keeper = has user_id first, else oldest created_at
DO $$
DECLARE
  r RECORD;
  keeper_id UUID;
  dup_id UUID;
BEGIN
  FOR r IN
    SELECT lower(trim(name)) AS name_key
    FROM public.sales_pics
    WHERE status = 'active'
    GROUP BY lower(trim(name))
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keeper_id
    FROM public.sales_pics
    WHERE status = 'active' AND lower(trim(name)) = r.name_key
    ORDER BY
      CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
      created_at ASC
    LIMIT 1;

    FOR dup_id IN
      SELECT id
      FROM public.sales_pics
      WHERE status = 'active'
        AND lower(trim(name)) = r.name_key
        AND id <> keeper_id
    LOOP
      -- Move user_id to keeper if needed
      UPDATE public.sales_pics AS keeper
      SET user_id = dup.user_id
      FROM public.sales_pics AS dup
      WHERE keeper.id = keeper_id
        AND dup.id = dup_id
        AND keeper.user_id IS NULL
        AND dup.user_id IS NOT NULL;

      UPDATE public.sales_pics
      SET user_id = NULL
      WHERE id = dup_id
        AND user_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.sales_pics k
          WHERE k.id = keeper_id AND k.user_id IS NOT NULL
        );

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

-- 3) Verify — must return 0 rows
SELECT lower(trim(name)) AS name_key, count(*) AS cnt
FROM public.sales_pics
WHERE status = 'active'
GROUP BY lower(trim(name))
HAVING count(*) > 1;

-- 4) Unique index (only after step 2 cleared duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS sales_pics_active_name_unique
ON public.sales_pics (lower(trim(name)))
WHERE status = 'active';
