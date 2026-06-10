-- Expand rotator landing image sizes to 5 options (xs → xlarge)

ALTER TABLE public.rotator_pages DROP CONSTRAINT IF EXISTS rotator_pages_image_size_check;
ALTER TABLE public.rotator_pages ADD CONSTRAINT rotator_pages_image_size_check
  CHECK (image_size IN ('xs', 'small', 'medium', 'large', 'xlarge'));

ALTER TABLE public.rotator_pages ALTER COLUMN image_size SET DEFAULT 'large';
