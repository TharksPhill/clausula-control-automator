-- Remover os planos padrão que foram criados automaticamente
-- Identificamos planos padrão pelos nomes e valores específicos
DELETE FROM plans 
WHERE name IN (
  '1-5 Funcionários',
  '6-10 Funcionários', 
  '11-20 Funcionários',
  '21-50 Funcionários',
  '51-100 Funcionários',
  '101-200 Funcionários'
)
AND monthly_price IN (299.90, 499.90, 799.90, 1299.90, 2499.90, 4999.90);