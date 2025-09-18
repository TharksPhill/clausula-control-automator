-- Add termination_date as text to keep consistency with existing date fields stored as text
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS termination_date text;

-- No further changes required; RLS already restricts updates to contract owners.