-- Migration to sync business_slug with business_name for existing providers
-- This fixes cases where business_name was changed but slug wasn't updated

-- Function to generate a slug from business name (matches JavaScript logic)
CREATE OR REPLACE FUNCTION generate_slug_from_name(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase, replace spaces with dashes, remove special chars
  base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name_text, '[^a-zA-Z0-9 ]', '', 'g'), '\s+', '-', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := SUBSTRING(base_slug FROM 1 FOR 50);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'business-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  END IF;
  
  -- Check uniqueness and add counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM providers WHERE business_slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update slugs that don't match their business names
-- Only update if the current slug doesn't match what it should be
UPDATE providers p1
SET business_slug = generate_slug_from_name(p1.business_name)
WHERE p1.business_name IS NOT NULL 
  AND p1.business_name != ''
  AND (
    -- Current slug doesn't match expected slug pattern
    p1.business_slug IS NULL 
    OR p1.business_slug = ''
    OR p1.business_slug != LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p1.business_name, '[^a-zA-Z0-9 ]', '', 'g'), '\s+', '-', 'g'))
  )
  -- Only update if we're not conflicting with another provider's slug
  AND NOT EXISTS (
    SELECT 1 FROM providers p2 
    WHERE p2.id != p1.id 
    AND p2.business_slug = generate_slug_from_name(p1.business_name)
  );

-- Drop the helper function
DROP FUNCTION IF EXISTS generate_slug_from_name(TEXT);


