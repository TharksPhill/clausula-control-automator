-- Add license_cost column to plan_addons table
ALTER TABLE public.plan_addons 
ADD COLUMN license_cost NUMERIC DEFAULT 0.00 NOT NULL;