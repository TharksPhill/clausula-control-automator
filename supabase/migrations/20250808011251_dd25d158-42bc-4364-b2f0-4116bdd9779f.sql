-- Adicionar coluna section_id para relacionar categorias com seções
ALTER TABLE financial_categories 
ADD COLUMN section_id UUID REFERENCES financial_sections(id);

-- Criar índice para melhorar performance
CREATE INDEX idx_financial_categories_section_id ON financial_categories(section_id);

-- Atualizar categorias existentes para não ter section_id (categorias globais)
-- As categorias de renda, impostos e despesas continuam sendo globais (section_id = null)
-- Somente as novas categorias de seções personalizadas terão section_id