-- Per-user Sales Follow-Up WhatsApp templates (FU1 / FU2 / FU3)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sfu_wa_templates JSONB;

COMMENT ON COLUMN public.profiles.sfu_wa_templates IS
  'Sales Follow-Up WhatsApp prefill by round: {"1":"...","2":"...","3":"..."}. Missing keys use app defaults. Supports {name}.';

NOTIFY pgrst, 'reload schema';
