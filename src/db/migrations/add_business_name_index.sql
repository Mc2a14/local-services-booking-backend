-- Add index for business_name to improve search performance
CREATE INDEX IF NOT EXISTS idx_providers_business_name_lower ON providers(LOWER(business_name));

-- Add index for service_id in reviews table for faster rating aggregation
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);

-- Add index for provider_id in reviews for faster testimonials query
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);

