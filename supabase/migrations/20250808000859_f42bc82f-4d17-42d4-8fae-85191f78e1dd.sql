-- Create table for custom financial sections
CREATE TABLE public.financial_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color_scheme TEXT NOT NULL, -- 'blue', 'green', 'red', 'purple', 'orange', etc.
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.financial_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own financial sections" 
ON public.financial_sections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial sections" 
ON public.financial_sections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial sections" 
ON public.financial_sections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial sections" 
ON public.financial_sections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_financial_sections_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_sections_updated_at
BEFORE UPDATE ON public.financial_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_financial_sections_updated_at_column();