-- Migration: Add business slug for unique public URLs

ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS business_slug VARCHAR(255) UNIQUE;

-- Create index for fast lookups by slug
CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers(business_slug);

-- Generate slugs for existing providers (if any)
-- Format: lowercase business name, spaces to dashes, remove special chars
UPDATE providers 
SET business_slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9 ]', '', 'g'), ' ', '-', 'g'))
WHERE business_slug IS NULL;

-- Add constraint to ensure slug is not empty for new providers
ALTER TABLE providers 
  ADD CONSTRAINT providers_slug_not_empty CHECK (business_slug IS NULL OR LENGTH(TRIM(business_slug)) > 0);

