-- Adicionar perfil para o usuário existente
INSERT INTO public.profiles (id, name)
SELECT 
  id,
  COALESCE(
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) as name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;