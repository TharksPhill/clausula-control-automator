import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutentiqueRequest {
  contractData: {
    id: string;
    contract_number: string;
    company?: {
      name: string;
    };
  };
  contractorData: {
    id: string;
    name: string;
    email: string;
    responsible_name?: string;
  };
  documentUrl?: string;
  documentBase64?: string;
  filename?: string;
}

interface AutentiqueDocument {
  id: string;
  name: string;
  refusable: boolean;
  sortable: boolean;
  created_by: {
    email: string;
    name: string;
  };
  signatures: Array<{
    email: string;
    name: string;
    action: string;
    link: {
      url: string;
    };
  }>;
  public_id: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  console.log('🔏 [AUTENTIQUE] Request recebida:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se é POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Método não permitido. Use POST.'
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const autentiqueToken = Deno.env.get('AUTENTIQUE_API_TOKEN')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [AUTENTIQUE] Variáveis de ambiente do Supabase não configuradas')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuração do servidor incompleta'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!autentiqueToken) {
      console.error('❌ [AUTENTIQUE] Token da API Autentique não configurado')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token da API Autentique não configurado. Configure a variável AUTENTIQUE_API_TOKEN.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validar JWT do Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ [AUTENTIQUE] Header de autorização ausente')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token de autorização necessário'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user?.user) {
      console.error('❌ [AUTENTIQUE] Falha na autenticação do usuário:', userError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token de autorização inválido'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [AUTENTIQUE] Usuário autenticado:', user.user.email)

    // Parse do corpo da requisição
    const requestData: AutentiqueRequest = await req.json()
    console.log('📋 [AUTENTIQUE] Dados da requisição:', {
      contractId: requestData.contractData?.id,
      contractNumber: requestData.contractData?.contract_number,
      contractorEmail: requestData.contractorData?.email,
      hasDocumentUrl: !!requestData.documentUrl,
      hasDocumentBase64: !!requestData.documentBase64
    })

    // Validar dados obrigatórios
    if (!requestData.contractData || !requestData.contractorData) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Dados do contrato e contratante são obrigatórios'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!requestData.contractorData.email) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Email do contratante é obrigatório'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar documento para envio
    let documentFile: string
    let documentName = requestData.filename || `contrato-${requestData.contractData.contract_number}.pdf`

    if (requestData.documentBase64) {
      console.log('📄 [AUTENTIQUE] Usando documento base64 fornecido')
      documentFile = requestData.documentBase64
    } else if (requestData.documentUrl) {
      console.log('📄 [AUTENTIQUE] Baixando documento da URL:', requestData.documentUrl)
      try {
        const response = await fetch(requestData.documentUrl)
        if (!response.ok) {
          throw new Error(`Erro ao baixar documento: ${response.status}`)
        }
        const buffer = await response.arrayBuffer()
        documentFile = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      } catch (error) {
        console.error('❌ [AUTENTIQUE] Erro ao baixar documento:', error)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Erro ao baixar documento da URL fornecida'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'É necessário fornecer documentUrl ou documentBase64'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar payload para Autentique API
    const autentiquePayload = {
      document: {
        name: documentName,
        refusable: false,
        sortable: false
      },
      signatures: [
        {
          name: requestData.contractorData.responsible_name || requestData.contractorData.name,
          email: requestData.contractorData.email,
          action: "sign"
        }
      ],
      file: documentFile
    }

    console.log('🚀 [AUTENTIQUE] Enviando documento para Autentique API:', {
      documentName,
      signerEmail: requestData.contractorData.email,
      signerName: requestData.contractorData.responsible_name || requestData.contractorData.name
    })

    // Chamar API da Autentique
    const autentiqueResponse = await fetch('https://api.autentique.com.br/v2/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${autentiqueToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(autentiquePayload)
    })

    console.log('📡 [AUTENTIQUE] Response status da API:', autentiqueResponse.status)

    if (!autentiqueResponse.ok) {
      const errorText = await autentiqueResponse.text()
      console.error('❌ [AUTENTIQUE] Erro na API da Autentique:', {
        status: autentiqueResponse.status,
        statusText: autentiqueResponse.statusText,
        error: errorText
      })
      
      let errorMessage = 'Erro na API da Autentique'
      if (autentiqueResponse.status === 401) {
        errorMessage = 'Token da API Autentique inválido ou expirado'
      } else if (autentiqueResponse.status === 403) {
        errorMessage = 'Acesso negado pela API da Autentique'
      } else if (autentiqueResponse.status === 429) {
        errorMessage = 'Limite de requisições excedido na API da Autentique'
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage,
          details: errorText
        }),
        { 
          status: autentiqueResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const autentiqueDocument: AutentiqueDocument = await autentiqueResponse.json()
    
    console.log('✅ [AUTENTIQUE] Documento criado com sucesso:', {
      documentId: autentiqueDocument.id,
      publicId: autentiqueDocument.public_id,
      signaturesCount: autentiqueDocument.signatures?.length || 0
    })

    // Salvar informações na base de dados (opcional)
    try {
      const { error: insertError } = await supabaseClient
        .from('autentique_documents')
        .insert({
          document_id: autentiqueDocument.id,
          public_id: autentiqueDocument.public_id,
          contract_id: requestData.contractData.id,
          contractor_id: requestData.contractorData.id,
          signer_email: requestData.contractorData.email,
          signer_name: requestData.contractorData.responsible_name || requestData.contractorData.name,
          document_name: autentiqueDocument.name,
          created_by_user: user.user.id,
          status: 'sent',
          autentique_data: autentiqueDocument
        })

      if (insertError) {
        console.warn('⚠️ [AUTENTIQUE] Erro ao salvar no banco (continuando):', insertError)
      } else {
        console.log('💾 [AUTENTIQUE] Dados salvos no banco de dados')
      }
    } catch (dbError) {
      console.warn('⚠️ [AUTENTIQUE] Erro no banco de dados (continuando):', dbError)
    }

    // Resposta de sucesso
    const response = {
      success: true,
      message: 'Documento enviado para assinatura via Autentique',
      data: {
        documentId: autentiqueDocument.id,
        publicId: autentiqueDocument.public_id,
        documentName: autentiqueDocument.name,
        signingUrl: autentiqueDocument.signatures?.[0]?.link?.url,
        signer: {
          name: autentiqueDocument.signatures?.[0]?.name,
          email: autentiqueDocument.signatures?.[0]?.email
        },
        createdAt: autentiqueDocument.created_at,
        status: 'sent'
      }
    }

    console.log('🎉 [AUTENTIQUE] Processo concluído com sucesso')

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('💥 [AUTENTIQUE] Erro crítico:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})