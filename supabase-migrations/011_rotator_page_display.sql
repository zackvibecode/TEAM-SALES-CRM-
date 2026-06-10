-- Rotator landing page display customization

ALTER TABLE public.rotator_pages
  ADD COLUMN IF NOT EXISTS loading_text TEXT NOT NULL DEFAULT 'Sedang sambungkan anda ke team kami...',
  ADD COLUMN IF NOT EXISTS image_size TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE public.rotator_pages DROP CONSTRAINT IF EXISTS rotator_pages_image_size_check;
ALTER TABLE public.rotator_pages ADD CONSTRAINT rotator_pages_image_size_check
  CHECK (image_size IN ('small', 'medium', 'large'));
