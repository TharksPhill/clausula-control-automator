-- Adicionar campos de projeção de vendas e frete para cliente na tabela products
ALTER TABLE public.products 
ADD COLUMN sales_projection INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN customer_shipping_cost NUMERIC DEFAULT 0.00 NOT NULL;

-- Atualizar a função de cálculo do rateio de custos fixos para considerar projeção de vendas
CREATE OR REPLACE FUNCTION public.calculate_product_fixed_cost_allocation(p_user_id uuid, p_sales_projection integer DEFAULT 1)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_company_costs NUMERIC := 0;
  v_total_sales_projection INTEGER := 0;
  v_allocation_per_unit NUMERIC := 0;
BEGIN
  -- Get total monthly company costs for the user
  SELECT COALESCE(SUM(monthly_cost), 0)
  INTO v_total_company_costs
  FROM public.company_costs
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Get total sales projection for all active products
  SELECT COALESCE(SUM(sales_projection), 1)
  INTO v_total_sales_projection
  FROM public.products
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Calculate allocation per unit based on sales projection
  IF v_total_sales_projection > 0 THEN
    v_allocation_per_unit := (v_total_company_costs / v_total_sales_projection) * p_sales_projection;
  END IF;
  
  RETURN v_allocation_per_unit;
END;
$function$;

-- Atualizar a trigger function para usar os novos campos
CREATE OR REPLACE FUNCTION public.update_product_profit_analysis()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
  
  -- Calculate total cost (including customer shipping cost)
  v_total_cost := NEW.supplier_cost + v_ipi_cost + NEW.shipping_cost + NEW.customer_shipping_cost + v_boleto_cost;
  
  -- Calculate tax cost
  v_tax_cost := NEW.selling_price * (NEW.individual_tax_percentage / 100);
  
  -- Calculate fixed cost allocation using sales projection
  v_fixed_cost_allocation := public.calculate_product_fixed_cost_allocation(NEW.user_id, NEW.sales_projection);
  
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
$function$;