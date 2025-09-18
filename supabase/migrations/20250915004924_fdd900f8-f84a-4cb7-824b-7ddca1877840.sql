-- Atualizar o contrato 001 para ter data de encerramento antes da reativação
UPDATE contracts 
SET termination_date = '2025-03-31'
WHERE id = '165698f9-a371-4690-87a1-97ba2acb12a4' 
AND contract_number = '001';