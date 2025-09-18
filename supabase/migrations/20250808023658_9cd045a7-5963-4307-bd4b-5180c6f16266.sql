-- Add revenue_type field to financial_sections table
ALTER TABLE public.financial_sections 
ADD COLUMN revenue_type BOOLEAN DEFAULT false;