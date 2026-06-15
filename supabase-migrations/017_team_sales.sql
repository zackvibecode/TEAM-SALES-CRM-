-- Team Sales Report: track closed deals by sales users

CREATE TABLE IF NOT EXISTS public.team_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  lead_source TEXT DEFAULT '',
  sale_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_sales_user ON public.team_sales(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_team_sales_package ON public.team_sales(package_name);
CREATE INDEX IF NOT EXISTS idx_team_sales_created ON public.team_sales(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_team_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_sales_updated_at ON public.team_sales;
CREATE TRIGGER trg_team_sales_updated_at
  BEFORE UPDATE ON public.team_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_team_sales_updated_at();

-- Enable RLS
ALTER TABLE public.team_sales ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "team_sales_admin_full" ON public.team_sales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales: can view all team sales (transparent team report)
CREATE POLICY "team_sales_select_team" ON public.team_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'sales')
    )
  );

-- Sales: can insert their own entries
CREATE POLICY "team_sales_insert_own" ON public.team_sales
  FOR INSERT WITH CHECK (sales_user_id = auth.uid());

-- Sales: can update their own entries
CREATE POLICY "team_sales_update_own" ON public.team_sales
  FOR UPDATE USING (sales_user_id = auth.uid());

-- Sales: can delete their own entries
CREATE POLICY "team_sales_delete_own" ON public.team_sales
  FOR DELETE USING (sales_user_id = auth.uid());
