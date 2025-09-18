
-- Create plan_addons table to store additional features/services that can be added to plans
CREATE TABLE IF NOT EXISTS public.plan_addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL,
    price_per_unit numeric(10,2) NOT NULL DEFAULT 0.00,
    unit_type text NOT NULL DEFAULT 'employee',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS plan_addons_user_id_idx ON public.plan_addons(user_id);
CREATE INDEX IF NOT EXISTS plan_addons_is_active_idx ON public.plan_addons(is_active);

-- Add Row Level Security (RLS)
ALTER TABLE public.plan_addons ENABLE ROW LEVEL SECURITY;

-- Create policies to control access
CREATE POLICY "Users can view their own plan addons"
    ON public.plan_addons
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan addons"
    ON public.plan_addons
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan addons"
    ON public.plan_addons
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan addons"
    ON public.plan_addons
    FOR DELETE
    USING (auth.uid() = user_id);
