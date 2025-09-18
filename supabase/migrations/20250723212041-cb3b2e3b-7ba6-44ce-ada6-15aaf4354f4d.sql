-- Create products table for product cost management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  supplier_cost NUMERIC NOT NULL DEFAULT 0.00,
  ipi_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  ipi_value NUMERIC NOT NULL DEFAULT 0.00,
  shipping_cost NUMERIC NOT NULL DEFAULT 0.00,
  selling_price NUMERIC NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'money', -- 'money', 'boleto'
  individual_tax_percentage NUMERIC NOT NULL DEFAULT 0.00,
  installments INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product profit analysis table
CREATE TABLE public.product_profit_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0.00,
  selling_price NUMERIC NOT NULL DEFAULT 0.00,
  gross_profit NUMERIC NOT NULL DEFAULT 0.00,
  tax_cost NUMERIC NOT NULL DEFAULT 0.00,
  boleto_cost NUMERIC NOT NULL DEFAULT 0.00,
  fixed_cost_allocation NUMERIC NOT NULL DEFAULT 0.00,
  net_profit NUMERIC NOT NULL DEFAULT 0.00,
  margin_percentage NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_profit_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Users can manage their own products" 
ON public.products 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for product profit analysis
CREATE POLICY "Users can manage their own product profit analysis" 
ON public.product_profit_analysis 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create foreign key constraint
ALTER TABLE public.product_profit_analysis 
ADD CONSTRAINT fk_product_profit_analysis_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_profit_analysis_updated_at
BEFORE UPDATE ON public.product_profit_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate fixed cost allocation for products
CREATE OR REPLACE FUNCTION public.calculate_product_fixed_cost_allocation(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_company_costs NUMERIC := 0;
  v_total_products INTEGER := 0;
  v_allocation_per_product NUMERIC := 0;
BEGIN
  -- Get total monthly company costs for the user
  SELECT COALESCE(SUM(monthly_cost), 0)
  INTO v_total_company_costs
  FROM public.company_costs
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Get total active products for the user
  SELECT COUNT(*)
  INTO v_total_products
  FROM public.products
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Calculate allocation per product
  IF v_total_products > 0 THEN
    v_allocation_per_product := v_total_company_costs / v_total_products;
  END IF;
  
  RETURN v_allocation_per_product;
END;
$$ LANGUAGE plpgsql;

-- Function to update product profit analysis
CREATE OR REPLACE FUNCTION public.update_product_profit_analysis()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost NUMERIC := 0;
  v_ipi_cost NUMERIC := 0;
  v_boleto_cost NUMERIC := 0;
  v_tax_cost NUMERIC := 0;
  v_fixed_cost_allocation NUMERIC := 0;
  v_gross_profit NUMERIC := 0;
  v_net_profit NUMERIC := 0;
  v_margin_percentage NUMERIC := 0;
  v_bank_slip_config RECORD;
BEGIN
  -- Calculate IPI cost
  IF NEW.ipi_type = 'percentage' THEN
    v_ipi_cost := NEW.supplier_cost * (NEW.ipi_value / 100);
  ELSE
    v_ipi_cost := NEW.ipi_value;
  END IF;
  
  -- Calculate boleto cost if payment method is boleto
  v_boleto_cost := 0;
  IF NEW.payment_method = 'boleto' THEN
    -- Get the bank slip configuration for the user
    SELECT slip_value INTO v_boleto_cost
    FROM public.bank_slip_configurations
    WHERE user_id = NEW.user_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Multiply by installments if applicable
    IF NEW.installments > 1 THEN
      v_boleto_cost := COALESCE(v_boleto_cost, 0) * NEW.installments;
    ELSE
      v_boleto_cost := COALESCE(v_boleto_cost, 0);
    END IF;
  END IF;
  
  -- Calculate total cost
  v_total_cost := NEW.supplier_cost + v_ipi_cost + NEW.shipping_cost + v_boleto_cost;
  
  -- Calculate tax cost
  v_tax_cost := NEW.selling_price * (NEW.individual_tax_percentage / 100);
  
  -- Calculate fixed cost allocation
  v_fixed_cost_allocation := public.calculate_product_fixed_cost_allocation(NEW.user_id);
  
  -- Calculate gross profit
  v_gross_profit := NEW.selling_price - v_total_cost;
  
  -- Calculate net profit
  v_net_profit := v_gross_profit - v_tax_cost - v_fixed_cost_allocation;
  
  -- Calculate margin percentage
  IF NEW.selling_price > 0 THEN
    v_margin_percentage := (v_net_profit / NEW.selling_price) * 100;
  END IF;
  
  -- Insert or update profit analysis
  INSERT INTO public.product_profit_analysis (
    product_id,
    user_id,
    total_cost,
    selling_price,
    gross_profit,
    tax_cost,
    boleto_cost,
    fixed_cost_allocation,
    net_profit,
    margin_percentage
  ) VALUES (
    NEW.id,
    NEW.user_id,
    v_total_cost,
    NEW.selling_price,
    v_gross_profit,
    v_tax_cost,
    v_boleto_cost,
    v_fixed_cost_allocation,
    v_net_profit,
    v_margin_percentage
  )
  ON CONFLICT (product_id) 
  DO UPDATE SET
    total_cost = v_total_cost,
    selling_price = NEW.selling_price,
    gross_profit = v_gross_profit,
    tax_cost = v_tax_cost,
    boleto_cost = v_boleto_cost,
    fixed_cost_allocation = v_fixed_cost_allocation,
    net_profit = v_net_profit,
    margin_percentage = v_margin_percentage,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update profit analysis when product changes
CREATE TRIGGER trigger_update_product_profit_analysis
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_product_profit_analysis();

-- Add unique constraint to ensure one analysis per product
ALTER TABLE public.product_profit_analysis 
ADD CONSTRAINT unique_product_analysis UNIQUE (product_id);