-- Rotator Team module (WhatsApp landing page rotation)

-- Landing pages
CREATE TABLE IF NOT EXISTS public.rotator_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  default_message TEXT NOT NULL DEFAULT 'Hi Nusa Travel, saya berminat nak dapatkan maklumat lanjut tentang pakej.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales team members (rotator-specific, not CRM sales users)
CREATE TABLE IF NOT EXISTS public.rotator_sales_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotation_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assign sales members to rotator pages
CREATE TABLE IF NOT EXISTS public.rotator_page_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rotator_page_id UUID NOT NULL REFERENCES public.rotator_pages(id) ON DELETE CASCADE,
  sales_member_id UUID NOT NULL REFERENCES public.rotator_sales_members(id) ON DELETE CASCADE,
  rotation_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rotator_page_id, sales_member_id)
);

-- Per-page rotation cursor (fair round-robin)
CREATE TABLE IF NOT EXISTS public.rotator_rotation_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rotator_page_id UUID NOT NULL UNIQUE REFERENCES public.rotator_pages(id) ON DELETE CASCADE,
  last_index INTEGER NOT NULL DEFAULT -1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Click tracking
CREATE TABLE IF NOT EXISTS public.rotator_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rotator_page_id UUID NOT NULL REFERENCES public.rotator_pages(id) ON DELETE CASCADE,
  sales_member_id UUID REFERENCES public.rotator_sales_members(id) ON DELETE SET NULL,
  sales_name TEXT,
  sales_phone TEXT,
  whatsapp_message TEXT,
  visitor_id TEXT,
  source TEXT NOT NULL DEFAULT 'direct',
  campaign TEXT NOT NULL DEFAULT 'none',
  referrer TEXT,
  user_agent TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rotator_pages_slug ON public.rotator_pages(slug);
CREATE INDEX IF NOT EXISTS idx_rotator_page_sales_page ON public.rotator_page_sales(rotator_page_id);
CREATE INDEX IF NOT EXISTS idx_rotator_clicks_page ON public.rotator_clicks(rotator_page_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rotator_clicks_visitor ON public.rotator_clicks(rotator_page_id, visitor_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rotator_clicks_sales ON public.rotator_clicks(sales_member_id);

-- Fair rotation + click logging (atomic, avoids race conditions)
CREATE OR REPLACE FUNCTION public.assign_next_rotator_sales(
  p_rotator_page_id UUID,
  p_visitor_id TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'direct',
  p_campaign TEXT DEFAULT 'none',
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page RECORD;
  v_members UUID[];
  v_member_count INTEGER;
  v_state RECORD;
  v_next_index INTEGER;
  v_member_id UUID;
  v_member RECORD;
  v_is_duplicate BOOLEAN := false;
  v_message TEXT;
BEGIN
  SELECT id, default_message, is_active INTO v_page
  FROM rotator_pages WHERE id = p_rotator_page_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'page_not_found');
  END IF;

  IF NOT v_page.is_active THEN
    RETURN json_build_object('success', false, 'error', 'page_inactive');
  END IF;

  -- Active members assigned to this page, ordered by page-specific rotation_order
  SELECT ARRAY_AGG(rps.sales_member_id ORDER BY rps.rotation_order, rsm.rotation_order)
  INTO v_members
  FROM rotator_page_sales rps
  JOIN rotator_sales_members rsm ON rsm.id = rps.sales_member_id
  WHERE rps.rotator_page_id = p_rotator_page_id
    AND rps.is_active = true
    AND rsm.is_active = true;

  v_member_count := COALESCE(array_length(v_members, 1), 0);

  IF v_member_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'no_active_sales');
  END IF;

  -- Lock rotation state row
  SELECT * INTO v_state
  FROM rotator_rotation_state
  WHERE rotator_page_id = p_rotator_page_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rotator_rotation_state (rotator_page_id, last_index)
    VALUES (p_rotator_page_id, -1)
    RETURNING * INTO v_state;
  END IF;

  v_next_index := (v_state.last_index + 1) % v_member_count;
  v_member_id := v_members[v_next_index + 1]; -- Postgres arrays are 1-based

  UPDATE rotator_rotation_state
  SET last_index = v_next_index, updated_at = now()
  WHERE rotator_page_id = p_rotator_page_id;

  SELECT * INTO v_member FROM rotator_sales_members WHERE id = v_member_id;
  v_message := v_page.default_message;

  -- Duplicate detection: same visitor on same page within 30 minutes
  IF p_visitor_id IS NOT NULL AND p_visitor_id <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM rotator_clicks
      WHERE rotator_page_id = p_rotator_page_id
        AND visitor_id = p_visitor_id
        AND clicked_at > now() - interval '30 minutes'
    ) INTO v_is_duplicate;
  END IF;

  INSERT INTO rotator_clicks (
    rotator_page_id, sales_member_id, sales_name, sales_phone,
    whatsapp_message, visitor_id, source, campaign, referrer, user_agent, is_duplicate
  ) VALUES (
    p_rotator_page_id, v_member.id, v_member.name, v_member.phone,
    v_message, p_visitor_id, p_source, p_campaign, p_referrer, p_user_agent, v_is_duplicate
  );

  RETURN json_build_object(
    'success', true,
    'sales_member_id', v_member.id,
    'sales_name', v_member.name,
    'sales_phone', v_member.phone,
    'whatsapp_message', v_message,
    'is_duplicate', v_is_duplicate
  );
END;
$$;

-- RLS
ALTER TABLE public.rotator_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotator_sales_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotator_page_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotator_rotation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotator_clicks ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role bypasses RLS; authenticated admin via profiles)
CREATE POLICY "rotator_pages_admin_all" ON public.rotator_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rotator_sales_members_admin_all" ON public.rotator_sales_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rotator_page_sales_admin_all" ON public.rotator_page_sales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rotator_rotation_state_admin_all" ON public.rotator_rotation_state
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rotator_clicks_admin_select" ON public.rotator_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Public read active pages by slug (for server-side page render)
CREATE POLICY "rotator_pages_public_read_active" ON public.rotator_pages
  FOR SELECT USING (is_active = true);

-- Storage bucket for rotator images
INSERT INTO storage.buckets (id, name, public)
VALUES ('rotator-images', 'rotator-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "rotator_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'rotator-images');

CREATE POLICY "rotator_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rotator-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rotator_images_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'rotator-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rotator_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'rotator-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default sales team (only if table is empty)
INSERT INTO public.rotator_sales_members (name, phone, rotation_order)
SELECT * FROM (VALUES
  ('USTAZ FAIZ', '60162879202', 1),
  ('CIK SHIEMA', '601116339202', 2),
  ('CIK AIN', '60143259202', 3),
  ('CIK FADLIN', '601125612847', 4),
  ('ENCIK ALIF', '60109149202', 5),
  ('CIK FATIN', '60149379202', 6)
) AS v(name, phone, rotation_order)
WHERE NOT EXISTS (SELECT 1 FROM public.rotator_sales_members LIMIT 1);

GRANT EXECUTE ON FUNCTION public.assign_next_rotator_sales TO anon, authenticated, service_role;
