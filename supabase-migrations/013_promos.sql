-- Promo module: poster + text + optional end date countdown

CREATE TABLE IF NOT EXISTS public.promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  promo_text TEXT NOT NULL DEFAULT '',
  poster_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  ends_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id UUID REFERENCES public.promos(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promos_active ON public.promos(is_active, sort_order DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promos_created_by ON public.promos(created_by);
CREATE INDEX IF NOT EXISTS idx_promos_ends_at ON public.promos(ends_at) WHERE ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_activity_logs_promo ON public.promo_activity_logs(promo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_activity_logs_actor ON public.promo_activity_logs(actor_id, created_at DESC);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_activity_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read promos
CREATE POLICY "promos_authenticated_select" ON public.promos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert: must set created_by to self
CREATE POLICY "promos_authenticated_insert" ON public.promos
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Update: owner or admin
CREATE POLICY "promos_owner_or_admin_update" ON public.promos
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Delete: owner or admin
CREATE POLICY "promos_owner_or_admin_delete" ON public.promos
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Activity logs: authenticated read; insert via service role in API
CREATE POLICY "promo_activity_logs_authenticated_select" ON public.promo_activity_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "promo_activity_logs_authenticated_insert" ON public.promo_activity_logs
  FOR INSERT WITH CHECK (actor_id = auth.uid());

-- Storage bucket for promo posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('promo-images', 'promo-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "promo_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'promo-images');

CREATE POLICY "promo_images_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'promo-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "promo_images_owner_or_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'promo-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "promo_images_owner_or_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'promo-images'
    AND auth.uid() IS NOT NULL
  );
