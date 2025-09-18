import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutentiqueWebhookPayload {
  event: string;
  data: {
    id: string;
    public_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    signatures: Array<{
      name: string;
      email: string;
      action: string;
      signed_at?: string;
      status: string;
    }>;
    status: string;
  };
}

serve(async (req) => {
  console.log('🎯 [AUTENTIQUE-WEBHOOK] Request recebida:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 [AUTENTIQUE-WEBHOOK] Método:', req.method)
    console.log('🔍 [AUTENTIQUE-WEBHOOK] URL:', req.url)
    
    // Aceitar GET para validação do Autentique
    if (req.method === 'GET') {
      console.log('🔍 [AUTENTIQUE-WEBHOOK] Validação GET recebida')
      
      // Verificar se tem query parameters que o Autentique pode enviar
      const url = new URL(req.url)
      const challenge = url.searchParams.get('challenge')
      
      if (challenge) {
        console.log('🔍 [AUTENTIQUE-WEBHOOK] Challenge recebido:', challenge)
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        })
      }
      
      return new Response('OK', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Verificar se é POST
    if (req.method !== 'POST') {
      console.log('❌ [AUTENTIQUE-WEBHOOK] Método não permitido:', req.method)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Método não permitido. Use POST ou GET.'
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [AUTENTIQUE-WEBHOOK] Variáveis de ambiente do Supabase não configuradas')
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

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse do corpo da requisição
    const webhookPayload: AutentiqueWebhookPayload = await req.json()
    console.log('📋 [AUTENTIQUE-WEBHOOK] Payload recebido:', {
      event: webhookPayload.event,
      documentId: webhookPayload.data?.id,
      publicId: webhookPayload.data?.public_id,
      documentName: webhookPayload.data?.name,
      status: webhookPayload.data?.status,
      signaturesCount: webhookPayload.data?.signatures?.length || 0
    })

    // Verificar se é um evento de documento
    if (!webhookPayload.event?.startsWith('document.')) {
      console.log('ℹ️ [AUTENTIQUE-WEBHOOK] Evento ignorado (não é de documento):', webhookPayload.event)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Evento ignorado - não é de documento'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar documento existente na base de dados
    const { data: existingDoc, error: searchError } = await supabaseClient
      .from('autentique_documents')
      .select('*')
      .eq('document_id', webhookPayload.data.id)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('❌ [AUTENTIQUE-WEBHOOK] Erro ao buscar documento:', searchError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao buscar documento na base de dados'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!existingDoc) {
      console.log('⚠️ [AUTENTIQUE-WEBHOOK] Documento não encontrado na base de dados:', webhookPayload.data.id)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Documento não encontrado na base de dados - webhook ignorado'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [AUTENTIQUE-WEBHOOK] Documento encontrado:', {
      id: existingDoc.id,
      contractId: existingDoc.contract_id,
      contractorId: existingDoc.contractor_id,
      currentStatus: existingDoc.status
    })

    // Verificar se alguma assinatura foi completada
    const completedSignature = webhookPayload.data.signatures?.find(sig => 
      sig.status === 'signed' && sig.signed_at
    )

    let updateData: any = {
      status: webhookPayload.data.status,
      autentique_data: webhookPayload.data,
      updated_at: new Date().toISOString()
    }

    // Se documento foi assinado, atualizar com dados da assinatura
    if (completedSignature && webhookPayload.data.status === 'signed') {
      updateData.signed_at = completedSignature.signed_at
      console.log('✍️ [AUTENTIQUE-WEBHOOK] Documento assinado detectado:', {
        signerName: completedSignature.name,
        signerEmail: completedSignature.email,
        signedAt: completedSignature.signed_at
      })
    }

    // Atualizar documento na tabela autentique_documents
    const { error: updateError } = await supabaseClient
      .from('autentique_documents')
      .update(updateData)
      .eq('document_id', webhookPayload.data.id)

    if (updateError) {
      console.error('❌ [AUTENTIQUE-WEBHOOK] Erro ao atualizar documento:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao atualizar documento'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('💾 [AUTENTIQUE-WEBHOOK] Documento atualizado na tabela autentique_documents')

    // Se documento foi assinado, criar registro na tabela signed_contracts
    if (completedSignature && webhookPayload.data.status === 'signed') {
      console.log('📝 [AUTENTIQUE-WEBHOOK] Criando registro de contrato assinado...')
      
      // Verificar se já existe registro na signed_contracts
      const { data: existingSigned, error: signedSearchError } = await supabaseClient
        .from('signed_contracts')
        .select('id')
        .eq('contract_id', existingDoc.contract_id)
        .eq('contractor_id', existingDoc.contractor_id)
        .eq('signature_data', `autentique_${webhookPayload.data.id}`)
        .single()

      if (signedSearchError && signedSearchError.code !== 'PGRST116') {
        console.error('❌ [AUTENTIQUE-WEBHOOK] Erro ao verificar assinatura existente:', signedSearchError)
      }

      if (!existingSigned) {
        // Buscar dados do contrato para criar o HTML de assinatura
        const { data: contractData, error: contractError } = await supabaseClient
          .from('contracts')
          .select(`
            *,
            company:companies(*),
            contractors(*)
          `)
          .eq('id', existingDoc.contract_id)
          .single()

        if (contractError) {
          console.error('❌ [AUTENTIQUE-WEBHOOK] Erro ao buscar dados do contrato:', contractError)
        }

        const signedHtmlContent = `
          <div>
            <h3>Contrato Assinado via Autentique</h3>
            <p><strong>Contrato:</strong> ${contractData?.contract_number || 'N/A'}</p>
            <p><strong>Assinante:</strong> ${completedSignature.name}</p>
            <p><strong>Email:</strong> ${completedSignature.email}</p>
            <p><strong>Data da Assinatura:</strong> ${new Date(completedSignature.signed_at).toLocaleString('pt-BR')}</p>
            <p><strong>Documento Autentique ID:</strong> ${webhookPayload.data.id}</p>
            <p><strong>Documento Público ID:</strong> ${webhookPayload.data.public_id}</p>
          </div>
        `

        const { error: insertSignedError } = await supabaseClient
          .from('signed_contracts')
          .insert({
            contract_id: existingDoc.contract_id,
            contractor_id: existingDoc.contractor_id,
            signature_data: `autentique_${webhookPayload.data.id}`,
            signed_html_content: signedHtmlContent,
            signed_at: completedSignature.signed_at,
            ip_address: 'autentique_webhook',
            user_agent: 'Autentique Webhook'
          })

        if (insertSignedError) {
          console.error('❌ [AUTENTIQUE-WEBHOOK] Erro ao criar registro signed_contracts:', insertSignedError)
        } else {
          console.log('✅ [AUTENTIQUE-WEBHOOK] Registro criado na tabela signed_contracts')
        }
      } else {
        console.log('ℹ️ [AUTENTIQUE-WEBHOOK] Registro já existe na tabela signed_contracts')
      }
    }

    const response = {
      success: true,
      message: 'Webhook processado com sucesso',
      data: {
        event: webhookPayload.event,
        documentId: webhookPayload.data.id,
        status: webhookPayload.data.status,
        wasSigned: completedSignature ? true : false,
        updatedAt: new Date().toISOString()
      }
    }

    console.log('🎉 [AUTENTIQUE-WEBHOOK] Webhook processado com sucesso:', response.data)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('💥 [AUTENTIQUE-WEBHOOK] Erro crítico:', error)
    
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