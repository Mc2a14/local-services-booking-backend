-- Migration: Add support for guest bookings (no account required)

-- Make customer_id nullable for guest bookings
ALTER TABLE bookings 
  ALTER COLUMN customer_id DROP NOT NULL;

-- Add guest customer information fields
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Create index for looking up bookings by email (for guest bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

