-- Migration: Add business image/logo field to providers table

ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS business_image_url VARCHAR(500);

-- Add comment for clarity
COMMENT ON COLUMN providers.business_image_url IS 'URL to business logo or main business image';

