
-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    employee_range text NOT NULL,
    monthly_price decimal(10,2) NOT NULL DEFAULT 0.00,
    semestral_price decimal(10,2) NOT NULL DEFAULT 0.00,
    annual_price decimal(10,2) NOT NULL DEFAULT 0.00,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS plans_user_id_idx ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS plans_is_active_idx ON public.plans(is_active);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios planos
CREATE POLICY "Users can view their own plans" ON public.plans
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários criem seus próprios planos
CREATE POLICY "Users can create their own plans" ON public.plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios planos
CREATE POLICY "Users can update their own plans" ON public.plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem seus próprios planos (soft delete)
CREATE POLICY "Users can delete their own plans" ON public.plans
    FOR DELETE USING (auth.uid() = user_id);

-- Inserir alguns planos padrão (opcional - você pode remover se não quiser dados iniciais)
INSERT INTO public.plans (user_id, name, employee_range, monthly_price, semestral_price, annual_price) VALUES
    -- Nota: estes valores são apenas exemplos, você pode ajustar conforme necessário
    (auth.uid(), '1-5 Funcionários', '1-5', 299.90, 1499.50, 2699.10),
    (auth.uid(), '6-10 Funcionários', '6-10', 499.90, 2499.50, 4499.10),
    (auth.uid(), '11-20 Funcionários', '11-20', 799.90, 3999.50, 7199.10),
    (auth.uid(), '21-30 Funcionários', '21-30', 1099.90, 5499.50, 9899.10),
    (auth.uid(), '31-50 Funcionários', '31-50', 1399.90, 6999.50, 12599.10),
    (auth.uid(), '51-100 Funcionários', '51-100', 1999.90, 9999.50, 17999.10)
ON CONFLICT DO NOTHING;
