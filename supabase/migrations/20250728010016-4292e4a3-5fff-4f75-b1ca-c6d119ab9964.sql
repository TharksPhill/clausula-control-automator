-- Corrigir a função de cálculo de rateio de custo fixo baseado na projeção mensal
-- Aplicar fórmula: custo_fixo_unitario = custo_fixo_total_mensal / soma_das_projecoes_mensais

CREATE OR REPLACE FUNCTION public.update_product_profit_analysis_manual(product_data products)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    total_fixed_costs NUMERIC;
    total_monthly_sales_projection INTEGER;
    unit_fixed_cost NUMERIC;
    product_fixed_cost_allocation NUMERIC;
    product_tax_cost NUMERIC;
    product_boleto_cost NUMERIC;
    product_gross_profit NUMERIC;
    product_net_profit NUMERIC;
    product_margin_percentage NUMERIC;
    product_total_cost NUMERIC;
    quantity_multiplier INTEGER;
    total_selling_price NUMERIC;
    total_customer_shipping NUMERIC;
    product_sales_projection INTEGER;
BEGIN
    -- Validar se o produto tem projeção de vendas definida
    product_sales_projection := COALESCE(product_data.sales_projection, 0);
    
    -- Se a projeção estiver vazia ou zero, não processar
    IF product_sales_projection <= 0 THEN
        RAISE WARNING 'Produto % tem projeção de vendas inválida: %', product_data.name, product_sales_projection;
        RETURN;
    END IF;
    
    -- Calcular custo fixo total do usuário
    SELECT COALESCE(SUM(monthly_cost), 0) INTO total_fixed_costs
    FROM company_costs 
    WHERE user_id = product_data.user_id AND is_active = true;
    
    -- Calcular total da projeção de vendas mensal de todos os produtos ativos
    SELECT COALESCE(SUM(sales_projection), 1) INTO total_monthly_sales_projection
    FROM products 
    WHERE user_id = product_data.user_id 
    AND is_active = true 
    AND COALESCE(sales_projection, 0) > 0;
    
    -- Calcular custo fixo por unidade (fórmula solicitada)
    unit_fixed_cost := total_fixed_costs / total_monthly_sales_projection;
    
    -- Obter quantidade do produto (padrão 1 se não especificado)
    quantity_multiplier := COALESCE(product_data.quantity, 1);
    
    -- Calcular rateio de custo fixo para este produto (baseado na quantidade)
    product_fixed_cost_allocation := unit_fixed_cost * quantity_multiplier;
    
    -- Calcular custo total do produto (multiplicado pela quantidade)
    product_total_cost := (product_data.supplier_cost + 
                        CASE WHEN product_data.ipi_type = 'percentage' 
                             THEN product_data.supplier_cost * (product_data.ipi_value / 100)
                             ELSE product_data.ipi_value 
                        END + 
                        product_data.shipping_cost) * quantity_multiplier;
    
    -- Calcular preço de venda total (multiplicado pela quantidade)
    total_selling_price := product_data.selling_price * quantity_multiplier;
    
    -- Calcular imposto de venda total
    product_tax_cost := total_selling_price * (product_data.individual_tax_percentage / 100);
    
    -- Calcular custo do boleto (por transação, não por quantidade)
    product_boleto_cost := CASE 
        WHEN product_data.payment_method = 'boleto' THEN 11.40 
        ELSE 0 
    END;
    
    -- Calcular frete total para o cliente
    total_customer_shipping := product_data.customer_shipping_cost * quantity_multiplier;
    
    -- Calcular lucro bruto
    product_gross_profit := total_selling_price - product_total_cost;
    
    -- Calcular lucro líquido
    product_net_profit := product_gross_profit - 
                        product_fixed_cost_allocation - 
                        product_tax_cost - 
                        total_customer_shipping - 
                        product_boleto_cost;
    
    -- Calcular margem percentual baseada no preço de venda total
    product_margin_percentage := CASE 
        WHEN total_selling_price > 0 THEN (product_net_profit / total_selling_price) * 100
        ELSE 0 
    END;
    
    -- Atualizar ou inserir análise
    INSERT INTO product_profit_analysis (
        product_id,
        user_id,
        selling_price,
        total_cost,
        fixed_cost_allocation,
        tax_cost,
        boleto_cost,
        gross_profit,
        net_profit,
        margin_percentage
    ) VALUES (
        product_data.id,
        product_data.user_id,
        total_selling_price,
        product_total_cost,
        product_fixed_cost_allocation,
        product_tax_cost,
        product_boleto_cost,
        product_gross_profit,
        product_net_profit,
        product_margin_percentage
    ) ON CONFLICT (product_id) 
    DO UPDATE SET
        selling_price = EXCLUDED.selling_price,
        total_cost = EXCLUDED.total_cost,
        fixed_cost_allocation = EXCLUDED.fixed_cost_allocation,
        tax_cost = EXCLUDED.tax_cost,
        boleto_cost = EXCLUDED.boleto_cost,
        gross_profit = EXCLUDED.gross_profit,
        net_profit = EXCLUDED.net_profit,
        margin_percentage = EXCLUDED.margin_percentage,
        updated_at = now();
        
    -- Log do cálculo para debug
    RAISE NOTICE 'Produto: %, Custo fixo total: %, Projeção total: %, Custo fixo unitário: %, Rateio: %', 
        product_data.name, total_fixed_costs, total_monthly_sales_projection, unit_fixed_cost, product_fixed_cost_allocation;
END;
$function$;

-- Executar recálculo para aplicar as mudanças
SELECT recalculate_product_profit_analysis();