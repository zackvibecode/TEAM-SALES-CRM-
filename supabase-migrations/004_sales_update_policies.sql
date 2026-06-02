-- Ensure sales can UPDATE own leads + log activities (run after 003)

DROP POLICY IF EXISTS "Sales users can update own leads" ON public.leads;
CREATE POLICY "Sales users can update own leads" ON public.leads
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales users can insert own activities" ON public.lead_activities;
CREATE POLICY "Sales users can insert own activities" ON public.lead_activities
  FOR INSERT
  WITH CHECK (sales_user_id = auth.uid());

DROP POLICY IF EXISTS "Sales users can read own activities" ON public.lead_activities;
CREATE POLICY "Sales users can read own activities" ON public.lead_activities
  FOR SELECT USING (sales_user_id = auth.uid());
