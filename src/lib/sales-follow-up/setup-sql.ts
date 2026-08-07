/** SQL sekali jalan untuk aktifkan Sales Follow-Up di Supabase. */
export const SALES_FOLLOW_UP_SETUP_SQL = `-- Sales Follow-Up setup (jalankan SEMUA sekali)
CREATE TABLE IF NOT EXISTS public.sales_pics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL,
  normalized_phone_number TEXT NOT NULL,
  destination_or_product TEXT DEFAULT '',
  source TEXT DEFAULT '',
  assigned_pic_id UUID REFERENCES public.sales_pics(id) ON DELETE SET NULL,
  lead_status TEXT NOT NULL DEFAULT 'New' CHECK (lead_status IN (
    'New', 'Follow-Up', 'Interested', 'KIV', 'No Response',
    'Not Interested', 'Booked', 'Closed'
  )),
  latest_response TEXT DEFAULT '',
  next_follow_up_date DATE,
  total_follow_ups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_normalized_phone UNIQUE (normalized_phone_number)
);

CREATE TABLE IF NOT EXISTS public.lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  pic_id UUID REFERENCES public.sales_pics(id) ON DELETE SET NULL,
  follow_up_number INTEGER NOT NULL,
  follow_up_date DATE NOT NULL,
  response TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'No Response' CHECK (status IN (
    'No Response', 'Replied', 'Interested', 'KIV',
    'Not Interested', 'Booked', 'Need Follow-Up', 'Wrong Number'
  )),
  notes TEXT DEFAULT '',
  next_follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_pics
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

GRANT ALL ON TABLE public.sales_pics TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.sales_leads TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.lead_follow_ups TO postgres, anon, authenticated, service_role;

INSERT INTO public.sales_pics (name, status)
SELECT v.name, 'active'
FROM (VALUES ('Fatin'), ('Alip'), ('Fadhlin'), ('Sheima'), ('Ain')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.sales_pics LIMIT 1);

UPDATE public.sales_pics sp
SET user_id = p.id
FROM public.profiles p
WHERE sp.user_id IS NULL
  AND p.full_name IS NOT NULL
  AND lower(trim(sp.name)) = lower(trim(p.full_name));

NOTIFY pgrst, 'reload schema';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sales_pics', 'sales_leads', 'lead_follow_ups')
ORDER BY table_name;
`;
