-- Departure dates: [{ "name": "Transjava", "date": "2026-08-15T23:59:59+08:00" }, ...]

UPDATE public.promos p
SET departure_dates = COALESCE(
  (
    SELECT jsonb_agg(
      CASE
        WHEN jsonb_typeof(elem) = 'string' THEN
          jsonb_build_object('name', COALESCE(NULLIF(p.title, ''), ''), 'date', elem #>> '{}')
        ELSE elem
      END
      ORDER BY ord
    )
    FROM jsonb_array_elements(COALESCE(p.departure_dates, '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
  ),
  '[]'::jsonb
)
WHERE jsonb_array_length(COALESCE(departure_dates, '[]'::jsonb)) > 0;
