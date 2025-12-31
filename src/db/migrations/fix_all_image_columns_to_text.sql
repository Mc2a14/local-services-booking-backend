-- Migration: Fix all image_url columns to TEXT type to support base64 images
-- Base64-encoded images can be very large (100k+ characters), so we need TEXT instead of VARCHAR

-- Fix services.image_url if it exists as VARCHAR
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' 
    AND column_name = 'image_url' 
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE services ALTER COLUMN image_url TYPE TEXT;
    RAISE NOTICE 'Changed services.image_url to TEXT';
  END IF;
END $$;

-- Fix providers.business_image_url if it exists as VARCHAR
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' 
    AND column_name = 'business_image_url' 
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE providers ALTER COLUMN business_image_url TYPE TEXT;
    RAISE NOTICE 'Changed providers.business_image_url to TEXT';
  END IF;
END $$;



