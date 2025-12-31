-- Migration: Fix business_image_url column type to TEXT (was VARCHAR(500))
-- Base64-encoded images can be very large, so we need TEXT instead of VARCHAR(500)

ALTER TABLE providers 
  ALTER COLUMN business_image_url TYPE TEXT;

-- Update comment
COMMENT ON COLUMN providers.business_image_url IS 'URL to business logo or main business image (can be URL or base64 data URI)';



