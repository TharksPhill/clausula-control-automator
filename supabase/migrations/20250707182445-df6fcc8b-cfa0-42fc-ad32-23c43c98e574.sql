
-- Create function to get Google Maps configuration for a user
CREATE OR REPLACE FUNCTION public.get_google_maps_config()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  api_key text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gmc.id,
    gmc.user_id,
    gmc.api_key,
    gmc.is_active,
    gmc.created_at,
    gmc.updated_at
  FROM public.google_maps_configurations gmc
  WHERE gmc.user_id = auth.uid() AND gmc.is_active = true
  ORDER BY gmc.created_at DESC
  LIMIT 1;
END;
$$;

-- Create function to save Google Maps configuration
CREATE OR REPLACE FUNCTION public.save_google_maps_config(
  p_api_key text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate existing configurations for this user
  UPDATE public.google_maps_configurations
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Insert new configuration
  INSERT INTO public.google_maps_configurations (user_id, api_key, is_active)
  VALUES (p_user_id, p_api_key, true);
END;
$$;
