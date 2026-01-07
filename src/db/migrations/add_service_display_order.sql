-- Add display_order column to services table for custom ordering
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial display_order based on creation date (newer services first, then we'll allow reordering)
UPDATE services SET display_order = id WHERE display_order = 0 OR display_order IS NULL;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(provider_id, display_order);



