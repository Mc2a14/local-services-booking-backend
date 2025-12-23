-- Migration: Add error_message field and update status constraint for email_notifications table

ALTER TABLE email_notifications 
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update status constraint to allow 'logged' status
ALTER TABLE email_notifications 
  DROP CONSTRAINT IF EXISTS email_notifications_status_check;

ALTER TABLE email_notifications 
  ADD CONSTRAINT email_notifications_status_check 
  CHECK (status IN ('sent', 'failed', 'pending', 'logged'));

