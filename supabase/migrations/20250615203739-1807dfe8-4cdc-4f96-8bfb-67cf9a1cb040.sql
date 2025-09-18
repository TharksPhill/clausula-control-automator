
-- Add missing columns to the companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS admin_name TEXT,
ADD COLUMN IF NOT EXISTS responsible_name TEXT;
