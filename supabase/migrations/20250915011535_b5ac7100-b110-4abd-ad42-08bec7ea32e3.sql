-- Atualizar o contrato 001 com as datas de encerramento e reativação
UPDATE contracts 
SET 
  termination_date = '2025-03-31',
  reactivation_date = '2025-08-01'
WHERE contract_number = '001';