
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { origin, destination } = await req.json()
    
    console.log('🗺️ Calculando distância:', { origin, destination })

    // Validar se origem e destino foram fornecidos
    if (!origin || !destination) {
      throw new Error('Origem e destino são obrigatórios')
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar API key do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token de autorização não fornecido')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

    console.log('👤 Usuário autenticado:', user.id)

    // Buscar configuração do Google Maps
    const { data: config, error: configError } = await supabase
      .from('google_maps_configurations')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (configError) {
      console.log('⚠️ Erro ao buscar configuração:', configError)
      throw new Error('Configuração do Google Maps não encontrada')
    }

    if (!config) {
      console.log('⚠️ Configuração não encontrada, usando simulação')
      
      // Retornar valores simulados
      const estimatedDistance = Math.floor(Math.random() * 80) + 40
      const estimatedDuration = Math.floor(estimatedDistance / 50 * 60)
      
      return new Response(JSON.stringify({
        distance: `${estimatedDistance} km`,
        distanceValue: estimatedDistance,
        duration: `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}min`,
        durationValue: estimatedDuration,
        isSimulated: true,
        error: 'Configuração não encontrada'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const apiKey = config.api_key
    console.log('🔑 API Key encontrada:', apiKey.substring(0, 20) + '...')

    // Validar API key
    if (!apiKey || apiKey.length < 25 || !apiKey.startsWith('AIza')) {
      console.log('❌ API Key inválida')
      throw new Error('API Key do Google Maps inválida')
    }

    // Limpar e preparar endereços
    const cleanOrigin = origin.trim().replace(/\s+/g, ' ')
    const cleanDestination = destination.trim().replace(/\s+/g, ' ')
    
    console.log('🧹 Endereços limpos:', {
      origin: cleanOrigin,
      destination: cleanDestination
    })

    // Fazer chamada para Google Maps API
    const encodedOrigin = encodeURIComponent(cleanOrigin)
    const encodedDestination = encodeURIComponent(cleanDestination)
    
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&units=metric&language=pt-BR&key=${apiKey}`
    
    console.log('🔗 URL da API:', googleMapsUrl.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const response = await fetch(googleMapsUrl)
    
    if (!response.ok) {
      console.log('❌ Erro HTTP:', response.status, response.statusText)
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const data = await response.json()
    console.log('📊 Resposta completa da API:', JSON.stringify(data, null, 2))

    // Verificar status geral da resposta
    if (data.status === 'REQUEST_DENIED') {
      console.log('❌ REQUEST_DENIED - Problema com a API key')
      throw new Error(`API Key inválida ou sem permissão para Distance Matrix API: ${data.error_message || 'Verifique as configurações da API key'}`)
    }

    if (data.status === 'INVALID_REQUEST') {
      console.log('❌ INVALID_REQUEST - Parâmetros inválidos')
      throw new Error('Parâmetros inválidos na requisição')
    }

    if (data.status !== 'OK') {
      console.log('❌ Status da API:', data.status, data.error_message)
      throw new Error(`Erro da API: ${data.status} - ${data.error_message || 'Erro desconhecido'}`)
    }

    // Verificar se há dados de resposta
    if (!data.rows || data.rows.length === 0) {
      console.log('❌ Nenhuma linha de dados retornada')
      throw new Error('Nenhum resultado encontrado para os endereços fornecidos')
    }

    const row = data.rows[0]
    if (!row.elements || row.elements.length === 0) {
      console.log('❌ Nenhum elemento encontrado na primeira linha')
      throw new Error('Nenhum resultado encontrado para os endereços fornecidos')
    }

    const element = row.elements[0]
    console.log('🔍 Elemento encontrado:', element)
    
    if (element.status === 'NOT_FOUND') {
      console.log('❌ NOT_FOUND - Um ou ambos os endereços não foram encontrados')
      throw new Error(`Endereço não encontrado. Verifique se os endereços estão corretos:
        - Origem: "${cleanOrigin}"
        - Destino: "${cleanDestination}"
        
        Dicas:
        - Inclua cidade, estado ou CEP
        - Use endereços mais específicos
        - Verifique a ortografia`)
    }

    if (element.status === 'ZERO_RESULTS') {
      console.log('❌ ZERO_RESULTS - Nenhuma rota encontrada')
      throw new Error('Nenhuma rota encontrada entre os endereços fornecidos')
    }

    if (element.status !== 'OK') {
      console.log('❌ Status do elemento:', element.status)
      throw new Error(`Erro no cálculo da rota: ${element.status}`)
    }

    // Verificar se distance e duration existem
    if (!element.distance || !element.duration) {
      console.log('❌ Dados de distância ou duração ausentes:', element)
      throw new Error('Dados de distância ou duração não disponíveis')
    }

    const result = {
      distance: element.distance.text,
      distanceValue: Math.round(element.distance.value / 1000), // metros para km
      duration: element.duration.text,
      durationValue: Math.round(element.duration.value / 60), // segundos para minutos
      isSimulated: false
    }

    console.log('✅ Resultado calculado com sucesso:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro na function:', error)
    
    // Em caso de erro, retornar valores simulados com informação do erro
    const estimatedDistance = Math.floor(Math.random() * 80) + 40
    const estimatedDuration = Math.floor(estimatedDistance / 50 * 60)
    
    return new Response(JSON.stringify({
      distance: `${estimatedDistance} km`,
      distanceValue: estimatedDistance,
      duration: `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}min`,
      durationValue: estimatedDuration,
      isSimulated: true,
      error: error.message
    }), {
      status: 200, // Retorna 200 mesmo com erro para não quebrar o frontend
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
