
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteRequest {
  origin: {
    address: string;
  };
  destination: {
    address: string;
  };
  travelMode: "DRIVE";
  routingPreference: "TRAFFIC_AWARE";
  computeAlternativeRoutes: boolean;
  routeModifiers: {
    avoidTolls: boolean;
    avoidHighways: boolean;
    avoidFerries: boolean;
  };
  languageCode: string;
  units: "METRIC";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { origin, destination } = await req.json()
    
    console.log('🛣️ Calculando pedágios via Google Routes:', { origin, destination })

    // Validar se origem e destino foram fornecidos
    if (!origin || !destination) {
      throw new Error('Origem e destino são obrigatórios')
    }

    // Formatar endereços para melhor reconhecimento
    const formattedOrigin = `${origin}, Brasil`
    const formattedDestination = `${destination}, Brasil`
    
    console.log('📍 Endereços formatados:', { formattedOrigin, formattedDestination })

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar API key do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('⚠️ Token de autorização não fornecido, usando simulação')
      return getSimulatedResponse(origin, destination)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('⚠️ Usuário não autenticado, usando simulação')
      return getSimulatedResponse(origin, destination)
    }

    console.log('👤 Usuário autenticado:', user.id)

    // Buscar configuração da Google Routes API
    const { data: config, error: configError } = await supabase
      .from('google_routes_configurations')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (configError || !config) {
      console.log('⚠️ Configuração não encontrada, usando simulação')
      return getSimulatedResponse(origin, destination)
    }

    const apiKey = config.api_key
    console.log('🔑 API Key encontrada:', apiKey.substring(0, 20) + '...')

    // Validar API key
    if (!apiKey || apiKey.length < 25) {
      console.log('❌ API Key inválida')
      return getSimulatedResponse(origin, destination, 'API Key da Google Routes API inválida')
    }

    // Tentar ambas as abordagens: com e sem tolls evitados
    const tollResult = await calculateTollsWithMultipleApproaches(formattedOrigin, formattedDestination, apiKey)
    
    console.log('✅ Resultado final calculado:', tollResult)

    return new Response(JSON.stringify(tollResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro na function:', error)
    return getSimulatedResponse('origem', 'destino', error.message)
  }
})

async function calculateTollsWithMultipleApproaches(origin: string, destination: string, apiKey: string) {
  console.log('🔄 Tentando múltiplas abordagens para calcular pedágios...')

  // Abordagem 1: Rota com pedágios permitidos
  const tollRoute = await callGoogleRoutesAPI(origin, destination, apiKey, false)
  
  // Abordagem 2: Rota evitando pedágios para comparação
  const noTollRoute = await callGoogleRoutesAPI(origin, destination, apiKey, true)
  
  console.log('📊 Comparando rotas:', {
    withTolls: tollRoute ? {
      distance: tollRoute.distanceMeters,
      duration: tollRoute.duration,
      tollInfo: tollRoute.travelAdvisory?.tollInfo
    } : null,
    withoutTolls: noTollRoute ? {
      distance: noTollRoute.distanceMeters,
      duration: noTollRoute.duration
    } : null
  })

  // Verificar se há diferença significativa que indique pedágios
  let totalTollCost = 0
  let tollStations: Array<{name: string, cost: number, location: string}> = []
  let isSimulated = false

  if (tollRoute && noTollRoute) {
    const distanceDifference = Math.abs(tollRoute.distanceMeters - noTollRoute.distanceMeters)
    const durationDifference = Math.abs(
      parseInt(tollRoute.duration.replace('s', '')) - 
      parseInt(noTollRoute.duration.replace('s', ''))
    )
    
    console.log('📏 Diferenças detectadas:', { distanceDifference, durationDifference })

    // Se há diferença significativa, provavelmente há pedágios
    if (distanceDifference > 1000 || durationDifference > 300) { // 1km ou 5min de diferença
      console.log('🎯 Diferença significativa detectada - provavelmente há pedágios')
      
      // Estimar custo baseado na rota e região
      totalTollCost = estimateTollCostByRoute(tollRoute, origin, destination)
      
      if (totalTollCost > 0) {
        tollStations.push({
          name: `Pedágio estimado na rota ${origin.split(',')[0]} - ${destination.split(',')[0]}`,
          cost: totalTollCost,
          location: "Estimado baseado na diferença de rotas"
        })
        isSimulated = true
      }
    }
  }

  // Verificar informações diretas de pedágio na resposta
  if (tollRoute?.travelAdvisory?.tollInfo) {
    const directTollInfo = processTollInfo(tollRoute.travelAdvisory.tollInfo)
    if (directTollInfo.cost > 0) {
      console.log('💰 Informação direta de pedágio encontrada:', directTollInfo)
      totalTollCost = directTollInfo.cost
      tollStations = directTollInfo.stations
      isSimulated = false
    }
  }

  // Se ainda não encontrou pedágios, usar valores conhecidos para rotas específicas
  if (totalTollCost === 0) {
    const knownTollCost = getKnownTollCost(origin, destination)
    if (knownTollCost > 0) {
      console.log('🗺️ Usando valor conhecido para esta rota:', knownTollCost)
      totalTollCost = knownTollCost
      tollStations.push({
        name: "Pedágio conhecido na rota",
        cost: knownTollCost,
        location: "Baseado em dados conhecidos da rota"
      })
      isSimulated = true
    }
  }

  return {
    totalCost: totalTollCost,
    tollStations: tollStations,
    route: tollRoute ? `${Math.round(tollRoute.distanceMeters / 1000)}km via Google Routes API` : "Rota não encontrada",
    isSimulated: isSimulated || totalTollCost === 0,
    debug: {
      routeWithTolls: tollRoute?.travelAdvisory,
      routeWithoutTolls: noTollRoute?.travelAdvisory,
      apiWorking: !!(tollRoute || noTollRoute)
    }
  }
}

async function callGoogleRoutesAPI(origin: string, destination: string, apiKey: string, avoidTolls: boolean) {
  try {
    const routeRequest: RouteRequest = {
      origin: { address: origin },
      destination: { address: destination },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: avoidTolls,
        avoidHighways: false,
        avoidFerries: true
      },
      languageCode: "pt-BR",
      units: "METRIC"
    }

    console.log(`📋 Chamando Google Routes API (avoidTolls: ${avoidTolls}):`, JSON.stringify(routeRequest, null, 2))

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory,routes.polyline,routes.legs'
      },
      body: JSON.stringify(routeRequest)
    })
    
    if (!response.ok) {
      console.log(`❌ Erro HTTP (avoidTolls: ${avoidTolls}):`, response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log(`📊 Resposta da API (avoidTolls: ${avoidTolls}):`, JSON.stringify(data, null, 2))

    return data.routes && data.routes.length > 0 ? data.routes[0] : null
  } catch (error) {
    console.error(`❌ Erro na chamada da API (avoidTolls: ${avoidTolls}):`, error)
    return null
  }
}

function processTollInfo(tollInfo: any) {
  let totalCost = 0
  const stations: Array<{name: string, cost: number, location: string}> = []

  if (tollInfo?.estimatedPrice && Array.isArray(tollInfo.estimatedPrice)) {
    tollInfo.estimatedPrice.forEach((price: any, index: number) => {
      const units = parseInt(price.units || '0')
      const nanos = parseInt(price.nanos || '0')
      const cost = units + (nanos / 1000000000)
      
      totalCost += cost
      
      if (cost > 0) {
        stations.push({
          name: `Pedágio ${index + 1}`,
          cost: cost,
          location: "Via Google Routes API"
        })
      }
    })
  }

  return { cost: totalCost, stations }
}

function estimateTollCostByRoute(route: any, origin: string, destination: string): number {
  const distance = route.distanceMeters / 1000 // em km
  
  // Estimativas baseadas em distância e região
  if (distance > 50 && distance < 150) {
    // Rotas regionais no interior de SP geralmente têm 1-2 pedágios
    if (origin.includes('SP') || destination.includes('SP')) {
      return 12.80 // Valor típico de pedágio em SP
    }
  }
  
  if (distance > 150) {
    // Rotas longas podem ter múltiplos pedágios
    const estimatedTolls = Math.floor(distance / 100) // Aproximadamente 1 pedágio a cada 100km
    return estimatedTolls * 10 // Valor médio por pedágio
  }
  
  return 0
}

function getKnownTollCost(origin: string, destination: string): number {
  // Rotas conhecidas com pedágios
  const knownRoutes = [
    { from: 'araraquara', to: 'ribeirão', cost: 12.80 },
    { from: 'são paulo', to: 'campinas', cost: 15.20 },
    { from: 'campinas', to: 'ribeirão preto', cost: 25.60 }
  ]
  
  const originLower = origin.toLowerCase()
  const destinationLower = destination.toLowerCase()
  
  for (const route of knownRoutes) {
    if ((originLower.includes(route.from) && destinationLower.includes(route.to)) ||
        (originLower.includes(route.to) && destinationLower.includes(route.from))) {
      return route.cost
    }
  }
  
  return 0
}

function getSimulatedResponse(origin: string, destination: string, error?: string) {
  const simulatedTollCost = 25.60
  
  return new Response(JSON.stringify({
    totalCost: simulatedTollCost,
    tollStations: [
      {
        name: "Pedágio Simulado",
        cost: simulatedTollCost,
        location: "Valores simulados - Configure API key válida"
      }
    ],
    route: "Rota simulada",
    isSimulated: true,
    error: error || 'Configuração da Google Routes API não encontrada'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
