-- Migration: Add destination, seats_left, image_url fields to promos table
-- Run this in the Supabase SQL Editor

-- Add destination column
ALTER TABLE promos 
ADD COLUMN IF NOT EXISTS destination text;

-- Add seats_left column  
ALTER TABLE promos 
ADD COLUMN IF NOT EXISTS seats_left integer DEFAULT 0;

-- Add image_url column (separate from poster_url for square destination images)
ALTER TABLE promos 
ADD COLUMN IF NOT EXISTS image_url text;

-- Update comment on promos table
COMMENT ON TABLE promos IS 'Travel packages / promos with destination info and seat tracking';
