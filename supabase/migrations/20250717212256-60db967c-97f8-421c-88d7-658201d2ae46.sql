-- Create an enum for adjustment types
CREATE TYPE public.contract_adjustment_type AS ENUM ('value', 'percentage');

-- Create table for contract adjustments
CREATE TABLE public.contract_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id),
    user_id UUID NOT NULL,
    adjustment_type contract_adjustment_type NOT NULL,
    adjustment_value NUMERIC NOT NULL,
    renewal_date DATE NOT NULL,
    previous_value NUMERIC NOT NULL,
    new_value NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    effective_date DATE NOT NULL,
    CONSTRAINT positive_adjustment CHECK (adjustment_value > 0)
);

-- Add RLS policies
ALTER TABLE public.contract_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contract adjustments"
ON public.contract_adjustments
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_contract_adjustments_updated_at
    BEFORE UPDATE ON public.contract_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();