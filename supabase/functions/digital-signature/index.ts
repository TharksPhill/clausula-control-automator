import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CertificateInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  isValid: boolean;
}

serve(async (req) => {
  console.log('🔏 [DIGITAL-SIGNATURE] Request recebida:', {
    method: req.method,
    url: req.url
  })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    const { action, data } = requestData
    
    console.log('🎯 [DIGITAL-SIGNATURE] Ação solicitada:', action)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing Supabase environment variables'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authorization header missing'
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User authentication failed'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    switch (action) {
      case 'validate_certificate':
        return await validateCertificate(data)
      case 'sign_pdf':
        return await signPdfWithCertificate(data)
      default:
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Invalid action: ${action}`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error: any) {
    console.error('💥 [DIGITAL-SIGNATURE] Critical Error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function validateCertificate(data: any) {
  console.log('🔍 [DIGITAL-SIGNATURE] Validando certificado...')
  
  try {
    const { certificateBase64, password } = data
    
    if (!certificateBase64 || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado e senha são obrigatórios'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simular validação do certificado P12/PFX
    // Em produção, aqui você usaria uma biblioteca como node-forge para validar o certificado real
    const mockValidation = await simulateCertificateValidation(certificateBase64, password)
    
    if (!mockValidation.isValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado inválido ou senha incorreta'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [DIGITAL-SIGNATURE] Certificado validado com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true,
        certificate: mockValidation,
        message: 'Certificado validado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ [DIGITAL-SIGNATURE] Erro na validação:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno na validação do certificado'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function signPdfWithCertificate(data: any) {
  console.log('📝 [DIGITAL-SIGNATURE] Assinando PDF...')
  
  try {
    const { pdfBase64, certificateBase64, password, contractData } = data
    
    if (!pdfBase64 || !certificateBase64 || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'PDF, certificado e senha são obrigatórios'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar certificado primeiro
    const validation = await simulateCertificateValidation(certificateBase64, password)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Certificado inválido ou senha incorreta'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Simular assinatura digital do PDF
    // Em produção, aqui você usaria bibliotecas como pdf-lib + node-forge para assinar o PDF real
    const signedPdf = await simulatePdfSigning(pdfBase64, validation, contractData)
    
    console.log('✅ [DIGITAL-SIGNATURE] PDF assinado com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true,
        signedPdfBase64: signedPdf.base64,
        signature: {
          algorithm: 'SHA256withRSA',
          certificate: validation,
          timestamp: new Date().toISOString(),
          documentHash: signedPdf.hash
        },
        message: 'PDF assinado digitalmente com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ [DIGITAL-SIGNATURE] Erro na assinatura:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno na assinatura do PDF'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function simulateCertificateValidation(certificateBase64: string, password: string): Promise<CertificateInfo> {
  // Simular processamento do certificado P12/PFX
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simular falha de senha (para demonstração)
  if (password === 'senha_errada') {
    return {
      subject: '',
      issuer: '',
      serialNumber: '',
      validFrom: '',
      validTo: '',
      isValid: false
    }
  }
  
  // Simular certificado válido
  const now = new Date()
  const validTo = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 ano
  
  return {
    subject: "CN=USUARIO CERTIFICADO DIGITAL:12345678901, OU=Certificado Digital, O=AC CERTISIGN RFB G5, C=BR",
    issuer: "AC CERTISIGN RFB G5",
    serialNumber: Math.random().toString(36).substr(2, 9).toUpperCase(),
    validFrom: now.toLocaleDateString('pt-BR'),
    validTo: validTo.toLocaleDateString('pt-BR'),
    isValid: true
  }
}

async function simulatePdfSigning(pdfBase64: string, certificate: CertificateInfo, contractData: any) {
  // Simular processo de assinatura digital
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Gerar hash do documento
  const encoder = new TextEncoder()
  const data = encoder.encode(pdfBase64)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Simular adição de informações de assinatura ao PDF
  // Em produção, aqui você modificaria o PDF real adicionando a assinatura digital
  const signatureInfo = `
  
==== ASSINATURA DIGITAL ====
Documento assinado digitalmente
Certificado: ${certificate.subject}
Emissor: ${certificate.issuer}
Data/Hora: ${new Date().toLocaleString('pt-BR')}
Hash SHA-256: ${hash}
============================`
  
  // Simular PDF assinado (na realidade seria o PDF modificado com a assinatura)
  const signedPdfContent = atob(pdfBase64) + signatureInfo
  const signedBase64 = btoa(signedPdfContent)
  
  return {
    base64: signedBase64,
    hash: hash
  }
}