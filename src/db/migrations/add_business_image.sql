-- Migration: Add business image/logo field to providers table

ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS business_image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN providers.business_image_url IS 'URL to business logo or main business image (can be URL or base64 data URI)';

