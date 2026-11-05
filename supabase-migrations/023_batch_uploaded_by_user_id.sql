-- Upload History CRUD: record the auth user id of the uploader
-- so batch owners (not just admins) can rename/delete their own batches.
-- Safe to run repeatedly.

ALTER TABLE public.sales_lead_batches
  ADD COLUMN IF NOT EXISTS uploaded_by_user_id UUID;
