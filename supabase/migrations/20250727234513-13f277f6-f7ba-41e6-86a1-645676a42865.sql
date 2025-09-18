-- Corrigir a função de cálculo com rateio proporcional correto
CREATE OR REPLACE FUNCTION public.update_product_profit_analysis_manual(product_data products)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    total_fixed_costs NUMERIC;
    total_sales_projection NUMERIC;
    product_fixed_cost_allocation NUMERIC;
    product_tax_cost NUMERIC;
    product_boleto_cost NUMERIC;
    product_gross_profit NUMERIC;
    product_net_profit NUMERIC;
    product_margin_percentage NUMERIC;
    product_total_cost NUMERIC;
BEGIN
    -- Calcular custo fixo total do usuário
    SELECT COALESCE(SUM(monthly_cost), 0) INTO total_fixed_costs
    FROM company_costs 
    WHERE user_id = product_data.user_id AND is_active = true;
    
    -- Calcular projeção total de vendas de todos os produtos ativos do usuário
    SELECT COALESCE(SUM(sales_projection), 0) INTO total_sales_projection
    FROM products 
    WHERE user_id = product_data.user_id AND is_active = true;
    
    -- Evitar divisão por zero
    IF total_sales_projection = 0 THEN
        total_sales_projection = 1;
    END IF;
    
    -- CORREÇÃO: Rateio proporcional baseado na projeção de vendas
    -- Se o produto tem projeção de 10 vendas e o total é 10 vendas, ele recebe 100% do custo fixo
    -- Se o produto tem projeção de 5 vendas e o total é 10 vendas, ele recebe 50% do custo fixo
    product_fixed_cost_allocation = (total_fixed_costs * product_data.sales_projection) / total_sales_projection;
    
    -- Calcular custo total do produto
    product_total_cost = product_data.supplier_cost + 
                        CASE WHEN product_data.ipi_type = 'percentage' 
                             THEN product_data.supplier_cost * (product_data.ipi_value / 100)
                             ELSE product_data.ipi_value 
                        END + 
                        product_data.shipping_cost;
    
    -- Calcular imposto de venda
    product_tax_cost = product_data.selling_price * (product_data.individual_tax_percentage / 100);
    
    -- Calcular custo do boleto
    product_boleto_cost = CASE 
        WHEN product_data.payment_method = 'boleto' THEN 11.40 
        ELSE 0 
    END;
    
    -- Calcular lucro bruto
    product_gross_profit = product_data.selling_price - product_total_cost;
    
    -- Calcular lucro líquido
    product_net_profit = product_gross_profit - 
                        product_fixed_cost_allocation - 
                        product_tax_cost - 
                        product_data.customer_shipping_cost - 
                        product_boleto_cost;
    
    -- Calcular margem percentual
    product_margin_percentage = CASE 
        WHEN product_data.selling_price > 0 THEN (product_net_profit / product_data.selling_price) * 100
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
        product_data.selling_price,
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
END;
$function$;

-- Executar o recálculo novamente
SELECT recalculate_product_profit_analysis();