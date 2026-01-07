-- Add feature toggle columns to providers table
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS inquiry_collection_enabled BOOLEAN DEFAULT true;

-- Update existing providers to have both features enabled by default
UPDATE providers 
SET booking_enabled = true, 
    inquiry_collection_enabled = true 
WHERE booking_enabled IS NULL OR inquiry_collection_enabled IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN providers.booking_enabled IS 'Enable/disable online booking functionality';
COMMENT ON COLUMN providers.inquiry_collection_enabled IS 'Enable/disable AI customer inquiry collection feature';

