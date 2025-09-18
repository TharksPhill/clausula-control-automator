-- Create table for prolabore management
CREATE TABLE public.prolabore (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    monthly_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prolabore ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own prolabore records" 
ON public.prolabore 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prolabore records" 
ON public.prolabore 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prolabore records" 
ON public.prolabore 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prolabore records" 
ON public.prolabore 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prolabore_updated_at
BEFORE UPDATE ON public.prolabore
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();