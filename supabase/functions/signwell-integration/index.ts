
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔥 [SIGNWELL] Request recebida:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    console.log('🔄 [SIGNWELL] Respondendo a OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestText = await req.text()
    console.log('📥 [SIGNWELL] Request body recebido:', requestText)
    
    let requestData
    try {
      requestData = JSON.parse(requestText)
    } catch (parseError) {
      console.error('❌ [SIGNWELL] Erro ao fazer parse do JSON:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { action, data } = requestData
    console.log('🎯 [SIGNWELL] Ação solicitada:', action)
    console.log('📦 [SIGNWELL] Dados recebidos:', data)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔧 [SIGNWELL] Env vars check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      serviceKeyLength: supabaseServiceKey?.length || 0
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing Supabase environment variables',
          details: 'Server configuration error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ [SIGNWELL] Supabase client criado')

    const authHeader = req.headers.get('Authorization')
    console.log('🔑 [SIGNWELL] Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authorization header missing',
          details: 'Please login again'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 [SIGNWELL] Token length:', token.length)
    
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token)
    
    console.log('👤 [SIGNWELL] User auth result:', {
      hasUser: !!user?.user,
      userId: user?.user?.id,
      userError: userError?.message
    })
    
    if (userError || !user?.user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `User authentication failed: ${userError?.message || 'No user found'}`,
          details: 'Please login again'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 [SIGNWELL] Buscando configuração para usuário:', user.user.id)
    
    const { data: config, error: configError } = await supabaseClient
      .from('signwell_configurations')
      .select('api_key')
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .single()

    console.log('⚙️ [SIGNWELL] Config result:', {
      hasConfig: !!config,
      configError: configError?.message,
      hasApiKey: !!config?.api_key
    })

    if (configError || !config) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `SignWell not configured: ${configError?.message || 'No config found'}`,
          details: 'Please configure your SignWell API key first'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const apiKey = config.api_key
    console.log('🗝️ [SIGNWELL] API Key info:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 8) || 'N/A'
    })

    if (!apiKey || apiKey.length < 20) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid API Key format',
          details: 'API Key is too short or invalid'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎬 [SIGNWELL] Executando ação:', action)
    
    switch (action) {
      case 'test_api_key':
        return await testApiKey(apiKey)
      case 'create_envelope':
        return await createEnvelope(data, apiKey)
      case 'get_envelope_status':
        return await getEnvelopeStatus(data, apiKey)
      case 'send_pdf_for_signature':
        return await sendPdfForSignature(data, apiKey)
      default:
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Invalid action: ${action}`,
            details: 'Supported actions: test_api_key, create_envelope, get_envelope_status, send_pdf_for_signature'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('💥 [SIGNWELL] Critical Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function testApiKey(apiKey: string) {
  console.log('🧪 [SIGNWELL] Iniciando teste da API Key...')
  
  const maxRetries = 2
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [SIGNWELL] Tentativa ${attempt}/${maxRetries} para SignWell API...`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      
      // CORREÇÃO: Usando o endpoint correto conforme documentação oficial SignWell
      const response = await fetch('https://www.signwell.com/api/v1/me', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📊 [SIGNWELL] Response recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [SIGNWELL] API Key válida, dados do usuário:', result)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'API Key válida! Conectado com sucesso ao SignWell',
            userInfo: {
              name: result.name || 'N/A',
              email: result.email || 'N/A',
              company: result.company || 'N/A'
            },
            data: result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('❌ [SIGNWELL] API Key inválida:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        })
        
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'API Key inválida ou revogada',
              details: 'Verifique se a API Key está correta e ativa no painel do SignWell',
              status: response.status
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        lastError = new Error(`HTTP ${response.status}: ${errorText}`)
        if (attempt < maxRetries) {
          console.log(`⏳ [SIGNWELL] Aguardando ${attempt * 3} segundos antes da próxima tentativa...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 3000))
          continue
        }
      }
      
    } catch (error: any) {
      console.error(`💥 [SIGNWELL] Erro na tentativa ${attempt}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      })

      lastError = error
      
      if (error.name === 'AbortError') {
        console.error('⏰ [SIGNWELL] Timeout na requisição')
        if (attempt < maxRetries) {
          console.log(`⏳ [SIGNWELL] Aguardando ${attempt * 5} segundos após timeout...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 5000))
          continue
        }
      } else if (attempt < maxRetries) {
        console.log(`⏳ [SIGNWELL] Aguardando ${attempt * 3} segundos antes da próxima tentativa...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 3000))
        continue
      }
    }
  }

  let errorMessage = 'Erro de rede na conexão com SignWell'
  if (lastError?.name === 'AbortError') {
    errorMessage = 'Timeout na conexão - verifique sua internet'
  } else if (lastError?.message) {
    errorMessage = lastError.message
  }

  return new Response(
    JSON.stringify({ 
      success: false, 
      error: errorMessage,
      errorType: lastError?.name || 'NetworkError',
      timestamp: new Date().toISOString(),
      attempts: maxRetries
    }),
    { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function createEnvelope(data: any, apiKey: string) {
  console.log('📄 [SIGNWELL] Criando envelope...', data)
  
  try {
    const { contractData, contractorData, companyData } = data
    
    // Normalizar contractorData
    const contractor = Array.isArray(contractorData) ? contractorData[0] : contractorData
    
    // Criar documento HTML do contrato
    const contractHtml = generateContractHTML(contractData, contractor, companyData)
    
    // CORREÇÃO: Estrutura correta conforme documentação oficial SignWell
    const envelopeData = {
      name: `Contrato ${contractData.contract_number} - ${contractor.name}`,
      files: [
        {
          file_base64: btoa(contractHtml),
          filename: `contrato-${contractData.contract_number}.html`
        }
      ],
      recipients: [
        {
          name: contractor.responsible_name || contractor.name,
          email: contractor.email || 'test@example.com',
          role: 'signer'
        }
      ],
      test_mode: true
    }

    console.log('📤 [SIGNWELL] Enviando envelope para SignWell API...')
    console.log('📋 [SIGNWELL] Dados do envelope:', JSON.stringify(envelopeData, null, 2))
    
    // CORREÇÃO: Endpoint e headers corretos conforme documentação oficial SignWell
    const response = await fetch('https://www.signwell.com/api/v1/documents/', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelopeData)
    })

    console.log('📊 [SIGNWELL] Response status:', response.status)
    console.log('📊 [SIGNWELL] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [SIGNWELL] Erro ao criar envelope:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      })
      
      // Tratamento específico para diferentes códigos de erro
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Dados inválidos para criação do envelope',
            details: errorText,
            status: response.status
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'API Key inválida ou sem permissão',
            details: 'Verifique se a API Key está correta e ativa',
            status: response.status
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Endpoint não encontrado - possível erro na URL da API',
            details: 'Verificando se estamos usando o endpoint correto do SignWell',
            status: response.status
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao criar envelope (${response.status}): ${errorText}`,
          status: response.status
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const envelope = await response.json()
    console.log('✅ [SIGNWELL] Envelope criado com sucesso:', envelope)

    return new Response(
      JSON.stringify({ 
        success: true, 
        envelope: {
          id: envelope.id,
          name: envelope.name,
          status: envelope.status || 'sent',
          signingUrl: envelope.signing_url || envelope.url,
          created: envelope.created_at || new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 [SIGNWELL] Erro ao criar envelope:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno ao criar envelope',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getEnvelopeStatus(data: any, apiKey: string) {
  console.log('🔍 [SIGNWELL] Verificando status do envelope:', data)
  
  try {
    const { envelopeId } = data
    
    const response = await fetch(`https://www.signwell.com/api/v1/documents/${envelopeId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [SIGNWELL] Erro ao verificar status:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      })
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao verificar status (${response.status}): ${errorText}`,
          status: response.status
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const envelope = await response.json()
    console.log('✅ [SIGNWELL] Status verificado:', envelope)

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: {
          id: envelope.id,
          status: envelope.status,
          completed: envelope.completed_at,
          recipients: envelope.recipients || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 [SIGNWELL] Erro ao verificar status:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno ao verificar status',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

function generateContractHTML(contractData: any, contractorData: any, companyData: any): string {
  const contractor = Array.isArray(contractorData) ? contractorData[0] : contractorData
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Contrato ${contractData.contract_number}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .signature-area { margin-top: 50px; padding: 20px; border: 1px solid #ccc; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td, th { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
        <h2>Contrato Nº ${contractData.contract_number}</h2>
    </div>

    <div class="section">
        <h3>CONTRATANTE:</h3>
        <table>
            <tr><td><strong>Empresa:</strong></td><td>${contractor.name}</td></tr>
            <tr><td><strong>CNPJ:</strong></td><td>${contractor.cnpj}</td></tr>
            <tr><td><strong>Responsável:</strong></td><td>${contractor.responsible_name}</td></tr>
            <tr><td><strong>E-mail:</strong></td><td>${contractor.email}</td></tr>
            <tr><td><strong>Endereço:</strong></td><td>${contractor.address}, ${contractor.city}/${contractor.state}</td></tr>
        </table>
    </div>

    <div class="section">
        <h3>CONTRATADA:</h3>
        <table>
            <tr><td><strong>Empresa:</strong></td><td>${companyData.name}</td></tr>
            <tr><td><strong>CNPJ:</strong></td><td>${companyData.cnpj}</td></tr>
            <tr><td><strong>Responsável:</strong></td><td>${companyData.responsible_name}</td></tr>
            <tr><td><strong>E-mail:</strong></td><td>${companyData.email}</td></tr>
            <tr><td><strong>Endereço:</strong></td><td>${companyData.address}, ${companyData.city}/${companyData.state}</td></tr>
        </table>
    </div>

    <div class="section">
        <h3>DETALHES DO CONTRATO:</h3>
        <table>
            <tr><td><strong>Valor Mensal:</strong></td><td>R$ ${contractData.monthly_value}</td></tr>
            <tr><td><strong>Tipo de Plano:</strong></td><td>${contractData.plan_type}</td></tr>
            <tr><td><strong>Funcionários:</strong></td><td>${contractData.employee_count}</td></tr>
            <tr><td><strong>CNPJs:</strong></td><td>${contractData.cnpj_count}</td></tr>
            <tr><td><strong>Data de Início:</strong></td><td>${new Date(contractData.start_date).toLocaleDateString('pt-BR')}</td></tr>
            <tr><td><strong>Data de Renovação:</strong></td><td>${new Date(contractData.renewal_date).toLocaleDateString('pt-BR')}</td></tr>
        </table>
    </div>

    <div class="section">
        <h3>CLÁUSULAS:</h3>
        <p><strong>1. OBJETO:</strong> A CONTRATADA prestará serviços de [descrição dos serviços] conforme especificado neste contrato.</p>
        
        <p><strong>2. PRAZO:</strong> Este contrato terá vigência a partir de ${new Date(contractData.start_date).toLocaleDateString('pt-BR')} até ${new Date(contractData.renewal_date).toLocaleDateString('pt-BR')}.</p>
        
        <p><strong>3. VALOR:</strong> O valor mensal dos serviços é de R$ ${contractData.monthly_value}, a ser pago todo dia ${contractData.payment_day} de cada mês.</p>
        
        <p><strong>4. ASSINATURA DIGITAL:</strong> Este documento foi assinado digitalmente através da plataforma SignWell, tendo plena validade jurídica.</p>
    </div>

    <div class="signature-area">
        <h3>ASSINATURA DIGITAL</h3>
        <p>Ao assinar digitalmente este documento, o CONTRATANTE declara estar de acordo com todos os termos e condições estabelecidos neste contrato.</p>
        
        <div style="margin-top: 30px;">
            <p><strong>Contratante:</strong> ${contractor.responsible_name}</p>
            <p><strong>E-mail:</strong> ${contractor.email}</p>
            <p><strong>Data da Assinatura:</strong> _________________________</p>
        </div>
    </div>

    <footer style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        <p>Documento gerado automaticamente pelo sistema de contratos.</p>
        <p>Assinatura digital realizada através da plataforma SignWell.</p>
    </footer>
</body>
</html>
  `.trim()
}

async function sendPdfForSignature(data: any, apiKey: string) {
  console.log('📄 [SIGNWELL] Enviando PDF para assinatura...', {
    hasPdfBase64: !!data.pdfBase64,
    pdfBase64Length: data.pdfBase64?.length || 0,
    contractNumber: data.contractNumber
  })
  
  try {
    const { pdfBase64, contractNumber } = data
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PDF base64 é obrigatório',
          details: 'O campo pdfBase64 deve conter o PDF codificado em base64'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar se é um base64 válido
    if (!pdfBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PDF base64 inválido',
          details: 'O campo pdfBase64 deve conter dados base64 válidos'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Estrutura correta conforme documentação oficial SignWell
    const envelopeData = {
      name: `Contrato ${contractNumber || 'TESTE'} para Assinatura`,
      files: [
        {
          file_base64: pdfBase64,
          filename: `contrato-${contractNumber || 'teste'}.pdf`
        }
      ],
      recipients: [
        {
          name: "Teste Usuário",
          email: "teste@exemplo.com", 
          role: "signer"
        }
      ],
      test_mode: true
    }

    console.log('📤 [SIGNWELL] Enviando documento PDF para SignWell API...')
    console.log('📋 [SIGNWELL] Dados do envelope:', {
      name: envelopeData.name,
      filesCount: envelopeData.files.length,
      recipients: envelopeData.recipients,
      test_mode: envelopeData.test_mode
    })
    
    // Timeout para a requisição
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos para PDFs grandes
    
    try {
      const response = await fetch('https://www.signwell.com/api/v1/documents/', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📊 [SIGNWELL] Response status:', response.status)
      console.log('📊 [SIGNWELL] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [SIGNWELL] Erro detalhado ao enviar PDF:', {
          status: response.status,
          statusText: response.statusText,
          url: 'https://api.signwell.com/v1/envelopes',
          method: 'POST',
          headers: {
            'Authorization': 'Token [HIDDEN]',
            'Content-Type': 'application/json'
          },
          errorBody: errorText,
          timestamp: new Date().toISOString()
        })
        
        // Log específico para erro 404
        if (response.status === 404) {
          console.error('🚨 [SIGNWELL] ERRO 404 - Endpoint não encontrado!')
          console.error('🔍 [SIGNWELL] Verificando se API base está correta: https://www.signwell.com/api/v1/')
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao enviar PDF para SignWell (${response.status})`,
            details: errorText,
            status: response.status,
            response_body: errorText,
            endpoint_used: 'https://www.signwell.com/api/v1/documents/',
            method: 'POST'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const envelope = await response.json()
      console.log('✅ [SIGNWELL] PDF enviado com sucesso:', envelope)

      return new Response(
        JSON.stringify({ 
          success: true, 
          document_id: envelope.id,
          status: envelope.status || 'sent',
          message: 'PDF enviado com sucesso para assinatura',
          envelope_details: {
            id: envelope.id,
            name: envelope.name,
            status: envelope.status,
            signing_url: envelope.signing_url || envelope.url,
            created_at: envelope.created_at || new Date().toISOString(),
            test_mode: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('⏰ [SIGNWELL] Timeout na requisição de PDF')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Timeout na requisição - PDF muito grande ou conexão lenta',
            details: 'A requisição demorou mais de 60 segundos para ser processada'
          }),
          { 
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      throw fetchError
    }

  } catch (error: any) {
    console.error('💥 [SIGNWELL] Erro ao enviar PDF:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno ao enviar PDF',
        details: error.toString(),
        response_code: 500
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}
