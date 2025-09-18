
-- Criar tabela de módulos/funcionalidades do sistema
CREATE TABLE public.system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  module_key text UNIQUE NOT NULL,
  parent_module_id uuid REFERENCES public.system_modules(id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar enum para tipos de permissão
CREATE TYPE public.permission_level AS ENUM ('none', 'read', 'write');

-- Criar tabela de permissões por administrador
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.administrators(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.system_modules(id) ON DELETE CASCADE,
  permission_level permission_level NOT NULL DEFAULT 'none',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(admin_id, module_id)
);

-- Inserir módulos principais do sistema
INSERT INTO public.system_modules (name, description, module_key) VALUES
('Dashboard', 'Painel principal com estatísticas', 'dashboard'),
('Contratos', 'Gerenciamento de contratos', 'contracts'),
('Assinaturas', 'Visualização e gerenciamento de assinaturas', 'signatures'),
('Administradores', 'Gerenciamento de administradores', 'admin_management'),
('Configurações do Sistema', 'Configurações gerais do sistema', 'system_settings'),
('Notificações', 'Gerenciamento de notificações', 'notifications'),
('Cotações', 'Gerenciamento de cotações', 'quotes'),
('Planos', 'Gerenciamento de planos e addons', 'plans'),
('Relatórios', 'Visualização de relatórios e estatísticas', 'reports');

-- Inserir submódulos
INSERT INTO public.system_modules (name, description, module_key, parent_module_id) VALUES
('Criar Contrato', 'Criar novos contratos', 'contracts_create', (SELECT id FROM public.system_modules WHERE module_key = 'contracts')),
('Editar Contrato', 'Editar contratos existentes', 'contracts_edit', (SELECT id FROM public.system_modules WHERE module_key = 'contracts')),
('Deletar Contrato', 'Excluir contratos', 'contracts_delete', (SELECT id FROM public.system_modules WHERE module_key = 'contracts')),
('Configurar DocuSign', 'Configurar integração DocuSign', 'docusign_config', (SELECT id FROM public.system_modules WHERE module_key = 'system_settings')),
('Configurar SignWell', 'Configurar integração SignWell', 'signwell_config', (SELECT id FROM public.system_modules WHERE module_key = 'system_settings'));

-- Função para verificar permissões de um administrador
CREATE OR REPLACE FUNCTION public.check_admin_permission(
  p_admin_id uuid,
  p_module_key text,
  p_required_level permission_level DEFAULT 'read'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission permission_level;
BEGIN
  -- Buscar a permissão do administrador para o módulo
  SELECT ap.permission_level
  INTO v_permission
  FROM public.admin_permissions ap
  JOIN public.system_modules sm ON ap.module_id = sm.id
  WHERE ap.admin_id = p_admin_id 
    AND sm.module_key = p_module_key;
  
  -- Se não encontrou permissão, assumir 'none'
  IF v_permission IS NULL THEN
    v_permission := 'none';
  END IF;
  
  -- Verificar se a permissão é suficiente
  CASE p_required_level
    WHEN 'none' THEN
      RETURN true;
    WHEN 'read' THEN
      RETURN v_permission IN ('read', 'write');
    WHEN 'write' THEN
      RETURN v_permission = 'write';
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Função para listar módulos com permissões de um administrador
CREATE OR REPLACE FUNCTION public.get_admin_modules_permissions(p_admin_id uuid)
RETURNS TABLE(
  module_id uuid,
  module_name text,
  module_key text,
  parent_module_id uuid,
  permission_level permission_level
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.name,
    sm.module_key,
    sm.parent_module_id,
    COALESCE(ap.permission_level, 'none'::permission_level) as permission_level
  FROM public.system_modules sm
  LEFT JOIN public.admin_permissions ap ON sm.id = ap.module_id AND ap.admin_id = p_admin_id
  WHERE sm.is_active = true
  ORDER BY sm.parent_module_id NULLS FIRST, sm.name;
END;
$$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso total para administradores autenticados por enquanto)
CREATE POLICY "Admins can manage system modules" ON public.system_modules FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage permissions" ON public.admin_permissions FOR ALL TO authenticated USING (true);
