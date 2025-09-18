

-- Primeiro, vamos criar uma constraint única composta para evitar duplicatas
ALTER TABLE public.notifications ADD CONSTRAINT unique_user_contract_type UNIQUE (user_id, contract_id, type);

-- Corrigir definitivamente o problema de duplicatas na função de notificações
CREATE OR REPLACE FUNCTION public.generate_contract_notifications()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Usar LOCK para evitar execução concorrente
  PERFORM pg_advisory_lock(12345);
  
  -- Limpar notificações órfãs (que referenciam contratos que não existem mais)
  DELETE FROM public.notifications 
  WHERE contract_id IS NOT NULL 
  AND contract_id NOT IN (SELECT id FROM public.contracts);
  
  -- Limpar notificações duplicadas restantes ANTES de inserir novas
  DELETE FROM public.notifications a
  USING public.notifications b
  WHERE a.id > b.id 
  AND a.contract_id = b.contract_id 
  AND a.type = b.type 
  AND a.user_id = b.user_id
  AND a.contract_id IS NOT NULL;

  -- Gerar notificações de vencimento de contrato
  -- Usar agregação para evitar duplicatas na mesma query
  INSERT INTO public.notifications (user_id, contract_id, type, title, message, expires_at)
  SELECT 
    c.user_id,
    c.id,
    'contract_expiry'::text,
    'Contrato próximo do vencimento'::text,
    'O contrato ' || c.contract_number || ' vence em ' || 
    CASE 
      WHEN c.renewal_date ~ '^\d{4}-\d{2}-\d{2}$' 
      THEN (TO_DATE(c.renewal_date, 'YYYY-MM-DD') - CURRENT_DATE)::text
      WHEN c.renewal_date ~ '^\d{2}/\d{2}/\d{4}$' 
      THEN (TO_DATE(c.renewal_date, 'DD/MM/YYYY') - CURRENT_DATE)::text
      ELSE '0'
    END || ' dias.',
    CASE 
      WHEN c.renewal_date ~ '^\d{4}-\d{2}-\d{2}$' 
      THEN TO_DATE(c.renewal_date, 'YYYY-MM-DD')
      WHEN c.renewal_date ~ '^\d{2}/\d{2}/\d{4}$' 
      THEN TO_DATE(c.renewal_date, 'DD/MM/YYYY')
      ELSE NULL
    END
  FROM (
    SELECT DISTINCT ON (c.user_id, c.id)
      c.user_id,
      c.id,
      c.contract_number,
      c.renewal_date,
      ns.contract_expiry_days
    FROM public.contracts c
    JOIN public.notification_settings ns ON c.user_id = ns.user_id
    WHERE 
      c.status = 'Ativo'
      AND (c.renewal_date ~ '^\d{4}-\d{2}-\d{2}$' OR c.renewal_date ~ '^\d{2}/\d{2}/\d{4}$')
      AND (
        (c.renewal_date ~ '^\d{4}-\d{2}-\d{2}$' AND TO_DATE(c.renewal_date, 'YYYY-MM-DD') > CURRENT_DATE AND (TO_DATE(c.renewal_date, 'YYYY-MM-DD') - CURRENT_DATE) <= ns.contract_expiry_days)
        OR
        (c.renewal_date ~ '^\d{2}/\d{2}/\d{4}$' AND TO_DATE(c.renewal_date, 'DD/MM/YYYY') > CURRENT_DATE AND (TO_DATE(c.renewal_date, 'DD/MM/YYYY') - CURRENT_DATE) <= ns.contract_expiry_days)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.contract_id = c.id 
        AND n.type = 'contract_expiry' 
        AND n.user_id = c.user_id
      )
  ) c;

  -- Gerar notificações de fim do período de teste
  INSERT INTO public.notifications (user_id, contract_id, type, title, message, expires_at)
  SELECT 
    c.user_id,
    c.id,
    'trial_expiry'::text,
    'Período de teste próximo do fim'::text,
    'O período de teste do contrato ' || c.contract_number || ' termina em ' || 
    CASE 
      WHEN (c.start_date ~ '^\d{4}-\d{2}-\d{2}$' OR c.start_date ~ '^\d{2}/\d{2}/\d{4}$') AND c.trial_days ~ '^\d+$'
      THEN CASE
        WHEN c.start_date ~ '^\d{4}-\d{2}-\d{2}$'
        THEN EXTRACT(DAY FROM ((TO_DATE(c.start_date, 'YYYY-MM-DD') + (c.trial_days::integer || ' days')::interval) - CURRENT_DATE))::text
        ELSE EXTRACT(DAY FROM ((TO_DATE(c.start_date, 'DD/MM/YYYY') + (c.trial_days::integer || ' days')::interval) - CURRENT_DATE))::text
      END
      ELSE '0'
    END || ' dias.',
    CASE 
      WHEN (c.start_date ~ '^\d{4}-\d{2}-\d{2}$' OR c.start_date ~ '^\d{2}/\d{2}/\d{4}$') AND c.trial_days ~ '^\d+$'
      THEN CASE
        WHEN c.start_date ~ '^\d{4}-\d{2}-\d{2}$'
        THEN TO_DATE(c.start_date, 'YYYY-MM-DD') + (c.trial_days::integer || ' days')::interval
        ELSE TO_DATE(c.start_date, 'DD/MM/YYYY') + (c.trial_days::integer || ' days')::interval
      END
      ELSE NULL
    END
  FROM (
    SELECT DISTINCT ON (c.user_id, c.id)
      c.user_id,
      c.id,
      c.contract_number,
      c.start_date,
      c.trial_days,
      ns.trial_expiry_days
    FROM public.contracts c
    JOIN public.notification_settings ns ON c.user_id = ns.user_id
    WHERE 
      c.status = 'Ativo'
      AND c.trial_days ~ '^\d+$'
      AND c.trial_days::integer > 0
      AND (c.start_date ~ '^\d{4}-\d{2}-\d{2}$' OR c.start_date ~ '^\d{2}/\d{2}/\d{4}$')
      AND (
        (c.start_date ~ '^\d{4}-\d{2}-\d{2}$' AND (TO_DATE(c.start_date, 'YYYY-MM-DD') + (c.trial_days::integer || ' days')::interval) > CURRENT_DATE AND ((TO_DATE(c.start_date, 'YYYY-MM-DD') + (c.trial_days::integer || ' days')::interval) - CURRENT_DATE) <= (ns.trial_expiry_days || ' days')::interval)
        OR
        (c.start_date ~ '^\d{2}/\d{2}/\d{4}$' AND (TO_DATE(c.start_date, 'DD/MM/YYYY') + (c.trial_days::integer || ' days')::interval) > CURRENT_DATE AND ((TO_DATE(c.start_date, 'DD/MM/YYYY') + (c.trial_days::integer || ' days')::interval) - CURRENT_DATE) <= (ns.trial_expiry_days || ' days')::interval)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.contract_id = c.id 
        AND n.type = 'trial_expiry' 
        AND n.user_id = c.user_id
      )
  ) c;

  -- Gerar notificações de novos contratos
  INSERT INTO public.notifications (user_id, contract_id, type, title, message)
  SELECT 
    c.user_id,
    c.id,
    'new_contract'::text,
    'Novo contrato criado'::text,
    'O contrato ' || c.contract_number || ' foi criado com sucesso.'
  FROM (
    SELECT DISTINCT ON (c.user_id, c.id)
      c.user_id,
      c.id,
      c.contract_number
    FROM public.contracts c
    WHERE 
      c.created_at::date >= CURRENT_DATE - INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.contract_id = c.id 
        AND n.type = 'new_contract' 
        AND n.user_id = c.user_id
      )
  ) c;

  -- Liberar o lock
  PERFORM pg_advisory_unlock(12345);
END;
$function$;

