-- ===================================================
-- SALES FOLLOW-UP MANAGEMENT MODULE
-- Run this SQL in your Supabase SQL Editor
-- ===================================================

-- 1. SALES PICS TABLE
CREATE TABLE IF NOT EXISTS sales_pics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SALES LEADS TABLE
CREATE TABLE IF NOT EXISTS sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL,
  normalized_phone_number TEXT NOT NULL,
  destination_or_product TEXT DEFAULT '',
  source TEXT DEFAULT '',
  assigned_pic_id UUID REFERENCES sales_pics(id) ON DELETE SET NULL,
  lead_status TEXT NOT NULL DEFAULT 'New' CHECK (lead_status IN (
    'New', 'Follow-Up', 'Interested', 'KIV', 'No Response',
    'Not Interested', 'Booked', 'Closed'
  )),
  latest_response TEXT DEFAULT '',
  next_follow_up_date DATE,
  total_follow_ups INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_normalized_phone UNIQUE (normalized_phone_number)
);

-- 3. LEAD FOLLOW-UPS TABLE
CREATE TABLE IF NOT EXISTS lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  pic_id UUID REFERENCES sales_pics(id) ON DELETE SET NULL,
  follow_up_number INTEGER NOT NULL,
  follow_up_date DATE NOT NULL,
  response TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'No Response' CHECK (status IN (
    'No Response', 'Replied', 'Interested', 'KIV',
    'Not Interested', 'Booked', 'Need Follow-Up', 'Wrong Number'
  )),
  notes TEXT DEFAULT '',
  next_follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================
-- INDEXES
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_sales_pics_status ON sales_pics(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_normalized_phone ON sales_leads(normalized_phone_number);
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_pic ON sales_leads(assigned_pic_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_next_follow_up ON sales_leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_sales_leads_total_follow_ups ON sales_leads(total_follow_ups);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_lead_id ON lead_follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_pic_id ON lead_follow_ups(pic_id);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_date ON lead_follow_ups(follow_up_date);

-- ===================================================
-- SEED DATA (uncomment to insert sample PICS)
-- ===================================================
-- INSERT INTO sales_pics (name, status) VALUES
--   ('Fatin', 'active'),
--   ('Alip', 'active'),
--   ('Fadhlin', 'active'),
--   ('Sheima', 'active'),
--   ('Ain', 'active')
-- ON CONFLICT DO NOTHING;

-- ===================================================
-- HELPER FUNCTIONS
-- ===================================================

-- Function to normalize Malaysian phone numbers
CREATE OR REPLACE FUNCTION normalize_my_phone(phone TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  cleaned := regexp_replace(phone, '[^0-9]', '', 'g');
  
  IF cleaned LIKE '0%' THEN
    cleaned := '60' || substring(cleaned FROM 2);
  END IF;
  
  IF cleaned ~ '^[1-9]' AND length(cleaned) <= 10 THEN
    cleaned := '60' || cleaned;
  END IF;
  
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_sales_follow_up_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  pic_filter UUID DEFAULT NULL,
  status_filter TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_leads INT;
  total_follow_ups INT;
  followed_up_once INT;
  followed_up_three INT;
  no_follow_up INT;
  overdue_count INT;
  today DATE := CURRENT_DATE;
BEGIN
  -- Total Leads
  SELECT COUNT(*) INTO total_leads FROM sales_leads
  WHERE (start_date IS NULL OR created_at::date >= start_date)
    AND (end_date IS NULL OR created_at::date <= end_date)
    AND (pic_filter IS NULL OR assigned_pic_id = pic_filter)
    AND (status_filter IS NULL OR lead_status = status_filter);

  -- Total Follow-Up Activities
  SELECT COUNT(*) INTO total_follow_ups FROM lead_follow_ups f
  JOIN sales_leads l ON f.lead_id = l.id
  WHERE (start_date IS NULL OR f.follow_up_date >= start_date)
    AND (end_date IS NULL OR f.follow_up_date <= end_date)
    AND (pic_filter IS NULL OR l.assigned_pic_id = pic_filter)
    AND (status_filter IS NULL OR l.lead_status = status_filter);

  -- Followed Up At Least Once
  SELECT COUNT(DISTINCT l.id) INTO followed_up_once FROM sales_leads l
  WHERE l.total_follow_ups >= 1
    AND (start_date IS NULL OR l.created_at::date >= start_date)
    AND (end_date IS NULL OR l.created_at::date <= end_date)
    AND (pic_filter IS NULL OR l.assigned_pic_id = pic_filter)
    AND (status_filter IS NULL OR l.lead_status = status_filter);

  -- Followed Up At Least 3 Times
  SELECT COUNT(DISTINCT l.id) INTO followed_up_three FROM sales_leads l
  WHERE l.total_follow_ups >= 3
    AND (start_date IS NULL OR l.created_at::date >= start_date)
    AND (end_date IS NULL OR l.created_at::date <= end_date)
    AND (pic_filter IS NULL OR l.assigned_pic_id = pic_filter)
    AND (status_filter IS NULL OR l.lead_status = status_filter);

  -- No Follow-Up
  SELECT COUNT(*) INTO no_follow_up FROM sales_leads
  WHERE total_follow_ups = 0
    AND (start_date IS NULL OR created_at::date >= start_date)
    AND (end_date IS NULL OR created_at::date <= end_date)
    AND (pic_filter IS NULL OR assigned_pic_id = pic_filter)
    AND (status_filter IS NULL OR lead_status = status_filter);

  -- Overdue Follow-Up
  SELECT COUNT(*) INTO overdue_count FROM sales_leads
  WHERE next_follow_up_date IS NOT NULL
    AND next_follow_up_date < today
    AND lead_status NOT IN ('Booked', 'Closed')
    AND (start_date IS NULL OR created_at::date >= start_date)
    AND (end_date IS NULL OR created_at::date <= end_date)
    AND (pic_filter IS NULL OR assigned_pic_id = pic_filter)
    AND (status_filter IS NULL OR lead_status = status_filter);

  result := jsonb_build_object(
    'total_leads', total_leads,
    'total_follow_ups', total_follow_ups,
    'followed_up_once', followed_up_once,
    'followed_up_three', followed_up_three,
    'no_follow_up', no_follow_up,
    'overdue', overdue_count
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_pics_updated_at ON sales_pics;
CREATE TRIGGER trg_sales_pics_updated_at
  BEFORE UPDATE ON sales_pics
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sales_leads_updated_at ON sales_leads;
CREATE TRIGGER trg_sales_leads_updated_at
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_lead_follow_ups_updated_at ON lead_follow_ups;
CREATE TRIGGER trg_lead_follow_ups_updated_at
  BEFORE UPDATE ON lead_follow_ups
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Reload PostgREST schema cache (fixes "table not found in schema cache")
NOTIFY pgrst, 'reload schema';
