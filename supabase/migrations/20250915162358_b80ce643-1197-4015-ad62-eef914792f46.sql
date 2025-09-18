-- Criar tabela de perfis de empresa
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view their own company profile" 
ON public.company_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company profile" 
ON public.company_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile" 
ON public.company_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_profiles (
    user_id,
    name,
    trade_name,
    cnpj,
    phone,
    website
  ) VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'trade_name',
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'website'
  );
  
  -- Também atualizar a tabela companies se existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    UPDATE public.companies 
    SET 
      name = new.raw_user_meta_data->>'trade_name',
      cnpj = new.raw_user_meta_data->>'cnpj',
      phone = new.raw_user_meta_data->>'phone',
      website = new.raw_user_meta_data->>'website',
      admin_name = new.raw_user_meta_data->>'name'
    WHERE user_id = new.id;
    
    -- Se não existir registro na companies, criar
    IF NOT FOUND THEN
      INSERT INTO public.companies (
        user_id,
        name,
        cnpj,
        phone,
        website,
        admin_name,
        address,
        email
      ) VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'trade_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'cnpj',
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'website',
        new.raw_user_meta_data->>'name',
        '',
        new.email
      );
    END IF;
  END IF;
  
  RETURN new;
END;
$$;

-- Criar trigger para executar após criação de usuário
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_company_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_company_profile_updated_at();