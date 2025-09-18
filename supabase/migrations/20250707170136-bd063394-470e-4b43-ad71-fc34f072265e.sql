-- Remover coluna toll_per_km da tabela vehicle_settings
-- Agora os pedágios serão calculados automaticamente via API de pedágio

ALTER TABLE public.vehicle_settings 
DROP COLUMN IF EXISTS toll_per_km;