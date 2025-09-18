-- Add license_cost column to plans table
ALTER TABLE plans ADD COLUMN license_cost numeric DEFAULT 0.00;