-- Limpar duplicações no histórico de status dos contratos
-- Remove reativações duplicadas consecutivas (mantém apenas a primeira)
WITH duplicates AS (
  SELECT 
    id,
    contract_id,
    status_type,
    status_date,
    LAG(status_type) OVER (PARTITION BY contract_id ORDER BY status_date, created_at) as prev_status_type,
    ROW_NUMBER() OVER (PARTITION BY contract_id, status_type, status_date::date ORDER BY created_at) as rn
  FROM contract_status_history
)
DELETE FROM contract_status_history
WHERE id IN (
  SELECT id FROM duplicates 
  WHERE status_type = prev_status_type -- Remove entradas com mesmo tipo consecutivo
     OR rn > 1 -- Remove duplicatas do mesmo tipo no mesmo dia
);

-- Criar função para validar inserções no histórico
CREATE OR REPLACE FUNCTION validate_contract_status_history()
RETURNS TRIGGER AS $$
DECLARE
  last_status_type text;
BEGIN
  -- Buscar o último tipo de status para este contrato
  SELECT status_type INTO last_status_type
  FROM contract_status_history
  WHERE contract_id = NEW.contract_id
  ORDER BY status_date DESC, created_at DESC
  LIMIT 1;
  
  -- Se existe um último status e é do mesmo tipo que o novo, bloquear
  IF last_status_type IS NOT NULL AND last_status_type = NEW.status_type THEN
    RAISE EXCEPTION 'Não é permitido inserir status_type consecutivo duplicado. Último: %, Novo: %', 
                    last_status_type, NEW.status_type;
  END IF;
  
  -- Validar que alternância está correta
  IF last_status_type = 'termination' AND NEW.status_type != 'reactivation' THEN
    RAISE EXCEPTION 'Após termination, apenas reactivation é permitido';
  END IF;
  
  IF last_status_type = 'reactivation' AND NEW.status_type != 'termination' THEN
    RAISE EXCEPTION 'Após reactivation, apenas termination é permitido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar inserções
DROP TRIGGER IF EXISTS validate_status_history_trigger ON contract_status_history;
CREATE TRIGGER validate_status_history_trigger
BEFORE INSERT ON contract_status_history
FOR EACH ROW
EXECUTE FUNCTION validate_contract_status_history();