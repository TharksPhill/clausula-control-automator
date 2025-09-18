
-- Função para criar administrador com hash bcrypt
CREATE OR REPLACE FUNCTION public.create_administrator(
  p_name text,
  p_email text,
  p_password text,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_password_hash text;
  v_admin_id uuid;
BEGIN
  -- Criar hash da senha usando bcrypt
  v_password_hash := crypt(p_password, gen_salt('bf'));
  
  -- Inserir novo administrador
  INSERT INTO public.administrators (name, email, password_hash, created_by)
  VALUES (p_name, p_email, v_password_hash, p_created_by)
  RETURNING administrators.id INTO v_admin_id;
  
  -- Retornar dados do administrador criado
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.email,
    a.created_at
  FROM public.administrators a
  WHERE a.id = v_admin_id;
END;
$$;
