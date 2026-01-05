-- Migration: Add email configuration fields to providers table
-- This allows each business owner to configure their own email settings

ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS email_smtp_host VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_smtp_port INTEGER DEFAULT 587,
  ADD COLUMN IF NOT EXISTS email_smtp_secure BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_smtp_user VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_smtp_password_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS email_from_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_from_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_service_type VARCHAR(50) DEFAULT 'smtp'; -- 'smtp', 'gmail', 'sendgrid'

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_email_config ON providers(user_id) WHERE email_smtp_user IS NOT NULL;





