-- Per-user WhatsApp opening message (wa.me ?text= prefill)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_pretext TEXT;

COMMENT ON COLUMN public.profiles.whatsapp_pretext IS
  'User-custom WhatsApp prefill message; NULL uses BRAND_WHATSAPP_INTRO default. Supports {name} placeholder.';
