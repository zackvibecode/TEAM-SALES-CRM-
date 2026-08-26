-- Payment, Subscription & Invoice module
-- Run in Supabase SQL Editor after 018.

-- Optional phone on profiles (billing contact)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ─── payment_settings (singleton row) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL DEFAULT 'PRO',
  plan_price NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
  subscription_duration_days INTEGER NOT NULL DEFAULT 30,
  bank_name TEXT NOT NULL DEFAULT '',
  bank_account_name TEXT NOT NULL DEFAULT '',
  bank_account_number TEXT NOT NULL DEFAULT '',
  qr_code_url TEXT,
  invoice_issuer_name TEXT NOT NULL DEFAULT 'MUHAMMAD ZARUL ZAQ''WAN BIN NASARUDDIN',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.payment_settings (
  plan_name, plan_price, subscription_duration_days, qr_code_url
)
SELECT 'PRO', 150.00, 30, '/IMG_3906.PNG'
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings LIMIT 1);

-- ─── subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'PRO',
  price NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
  status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('active', 'expiring_soon', 'expired', 'payment_pending', 'unpaid')),
  start_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
  ON public.subscriptions (user_id)
  WHERE status IN ('active', 'expiring_soon', 'payment_pending');

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON public.subscriptions(expiry_date)
  WHERE status IN ('active', 'expiring_soon');

-- ─── payments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'PRO',
  payment_method TEXT NOT NULL DEFAULT 'bank_qr',
  receipt_path TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'rejected')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  subscription_start_date DATE,
  subscription_expiry_date DATE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_number)
  WHERE invoice_number IS NOT NULL;

-- Only one pending payment per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_pending_per_user
  ON public.payments (user_id)
  WHERE payment_status = 'pending';

-- ─── invoices ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  plan_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_start_date DATE,
  subscription_expiry_date DATE,
  payment_method TEXT NOT NULL DEFAULT 'Bank QR Transfer',
  payment_status TEXT NOT NULL DEFAULT 'Paid',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id, created_at DESC);

-- Invoice sequence for INV-YYYY-NNNNN
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  year INTEGER PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y INTEGER := EXTRACT(YEAR FROM now())::INTEGER;
  n INTEGER;
BEGIN
  INSERT INTO public.invoice_counters (year, last_value)
  VALUES (y, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_value = public.invoice_counters.last_value + 1
  RETURNING last_value INTO n;

  RETURN 'INV-' || y::TEXT || '-' || lpad(n::TEXT, 5, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_invoice_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO service_role;

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

-- payment_settings: authenticated can read; only admin writes (via service role in API)
DROP POLICY IF EXISTS "payment_settings_authenticated_select" ON public.payment_settings;
CREATE POLICY "payment_settings_authenticated_select" ON public.payment_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "payment_settings_admin_update" ON public.payment_settings;
CREATE POLICY "payment_settings_admin_update" ON public.payment_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "payment_settings_admin_insert" ON public.payment_settings;
CREATE POLICY "payment_settings_admin_insert" ON public.payment_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_own_select" ON public.subscriptions;
CREATE POLICY "subscriptions_own_select" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "subscriptions_own_insert" ON public.subscriptions;
CREATE POLICY "subscriptions_own_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "subscriptions_admin_update" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_update" ON public.subscriptions
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- payments
DROP POLICY IF EXISTS "payments_own_select" ON public.payments;
CREATE POLICY "payments_own_select" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "payments_own_insert" ON public.payments;
CREATE POLICY "payments_own_insert" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_admin_update" ON public.payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- invoices
DROP POLICY IF EXISTS "invoices_own_select" ON public.invoices;
CREATE POLICY "invoices_own_select" ON public.invoices
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "invoices_admin_insert" ON public.invoices;
CREATE POLICY "invoices_admin_insert" ON public.invoices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- invoice_counters: no direct client access (service role only)
DROP POLICY IF EXISTS "invoice_counters_deny_all" ON public.invoice_counters;
CREATE POLICY "invoice_counters_deny_all" ON public.invoice_counters
  FOR ALL USING (false);

-- ─── Storage ────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-assets', 'payment-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payment_assets_public_read" ON storage.objects;
CREATE POLICY "payment_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-assets');

DROP POLICY IF EXISTS "payment_assets_admin_write" ON storage.objects;
CREATE POLICY "payment_assets_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-assets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "payment_assets_admin_update" ON storage.objects;
CREATE POLICY "payment_assets_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'payment-assets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "payment_assets_admin_delete" ON storage.objects;
CREATE POLICY "payment_assets_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-assets'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "payment_receipts_own_read" ON storage.objects;
CREATE POLICY "payment_receipts_own_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS "payment_receipts_own_upload" ON storage.objects;
CREATE POLICY "payment_receipts_own_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
