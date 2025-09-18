-- Limpeza das categorias financeiras que não estão associadas a seções personalizadas
-- e que estão causando problemas de visualização

-- Primeiro, vamos remover categorias órfãs (sem section_id ou com section_id inválido)
DELETE FROM financial_categories 
WHERE section_id IS NULL 
OR section_id NOT IN (SELECT id FROM financial_sections WHERE is_active = true);

-- Também vamos remover categorias duplicadas ou inconsistentes
-- que podem estar interferindo na visualização dos dados
DELETE FROM financial_categories 
WHERE id IN (
  -- Buscar categorias com nomes hardcoded que não deveriam existir
  SELECT id FROM financial_categories 
  WHERE name IN ('Água', 'Aluguel', 'Condomínio', 'Contabilidade', 'Internet', 'IPTU', 'Limpeza', 'Luz', 'Máquina Pagamento', 'Publicidade', 'Telefone', 'Sistemas')
  AND section_id IS NULL
);

-- Remover categorias de teste ou vazias
DELETE FROM financial_categories 
WHERE name IN ('Teste', 'COFINS') 
AND section_id IS NULL;