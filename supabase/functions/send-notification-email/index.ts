
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  user_email: string
  type: 'contract_expiry' | 'trial_expiry' | 'new_contract'
  title: string
  message: string
  contract_number?: string
  company_name?: string
  custom_subject?: string
}

const getEmailTemplate = (data: NotificationData) => {
  const { type, title, message, contract_number, company_name, custom_subject } = data

  const getSubject = () => {
    // Use custom subject if provided, otherwise fall back to default
    if (custom_subject) {
      return custom_subject
    }

    switch (type) {
      case 'contract_expiry':
        return `⚠️ Contrato ${contract_number} próximo do vencimento`
      case 'trial_expiry':
        return `⏰ Período de teste terminando - Contrato ${contract_number}`
      case 'new_contract':
        return `✅ Novo contrato criado - ${contract_number}`
      default:
        return title
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'contract_expiry':
        return '⚠️'
      case 'trial_expiry':
        return '⏰'
      case 'new_contract':
        return '✅'
      default:
        return '📧'
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
            <h1 style="margin: 0; color: #333; font-size: 24px;">
              ${getIcon()} ${company_name || 'Sistema de Contratos'}
            </h1>
          </div>
          
          <div style="padding: 30px 0;">
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">
              ${title}
            </h2>
            
            <p style="color: #666; line-height: 1.6; margin: 15px 0; font-size: 16px;">
              ${message}
            </p>
            
            ${contract_number ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #333; font-weight: bold;">
                  Contrato: ${contract_number}
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Acessar Sistema
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 14px;">
            <p style="margin: 0;">
              Esta é uma notificação automática do seu sistema de contratos.
            </p>
            <p style="margin: 5px 0 0 0;">
              Se você não deseja mais receber estes emails, acesse as configurações no sistema.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  return {
    subject: getSubject(),
    html
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_email, type, title, message, contract_number, company_name, custom_subject } = await req.json() as NotificationData

    console.log('Enviando email de notificação:', { user_email, type, title, custom_subject })

    if (!user_email || !type || !title || !message) {
      throw new Error('Campos obrigatórios faltando')
    }

    const template = getEmailTemplate({
      user_email,
      type,
      title,
      message,
      contract_number,
      company_name,
      custom_subject
    })

    const { data, error } = await resend.emails.send({
      from: 'Sistema de Contratos <onboarding@resend.dev>',
      to: [user_email],
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      throw error
    }

    console.log('Email enviado com sucesso:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na função de email:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
