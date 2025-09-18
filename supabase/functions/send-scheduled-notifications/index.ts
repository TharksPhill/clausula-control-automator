
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

const shouldSendEmailNow = (settings: any) => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[now.getDay()]
  
  console.log(`📅 Verificando envio de email para usuário:`)
  console.log(`- Data/Hora atual: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`)
  console.log(`- Dia da semana: ${todayName}`)
  
  // Verificar se hoje é um dia configurado para envio
  if (settings.email_days_of_week && settings.email_days_of_week.length > 0) {
    if (!settings.email_days_of_week.includes(todayName)) {
      console.log(`❌ Hoje (${todayName}) não está nos dias configurados: ${settings.email_days_of_week.join(', ')}`)
      return false
    }
    console.log(`✅ Hoje (${todayName}) está nos dias configurados`)
  } else {
    console.log(`✅ Nenhum dia específico configurado, enviando todos os dias`)
  }
  
  // NOVA LÓGICA SIMPLIFICADA: Se não há horário configurado, enviar sempre
  if (!settings.email_send_time) {
    console.log(`✅ Nenhum horário específico configurado, enviando a qualquer hora`)
    return true
  }

  // LÓGICA AINDA MAIS PERMISSIVA: Se tem horário configurado, verificar se estamos em um período razoável
  const [configHour, configMinute] = settings.email_send_time.split(':').map(Number)
  const configTimeInMinutes = configHour * 60 + configMinute
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  
  console.log(`- Horário configurado: ${configHour}:${configMinute.toString().padStart(2, '0')} (${configTimeInMinutes} minutos)`)
  console.log(`- Horário atual: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutos)`)
  
  // NOVA TOLERÂNCIA MUITO GENEROSA: 12 horas (720 minutos) - praticamente enviar sempre
  const timeDiff = Math.abs(currentTimeInMinutes - configTimeInMinutes)
  console.log(`- Diferença de tempo: ${timeDiff} minutos`)
  
  // Se passou menos de 12 horas do horário configurado, enviar
  if (timeDiff <= 720) {
    console.log(`✅ Dentro da janela de envio (até 12h de diferença do horário configurado)`)
    return true
  }
  
  console.log(`❌ Fora da janela de envio (diferença: ${timeDiff} minutos, máximo: 720 minutos)`)
  return false
}

const getCustomSubject = (settings: any, type: string, contractNumber?: string) => {
  let template = ""
  switch (type) {
    case 'contract_expiry':
      template = settings.contract_expiry_subject || "⚠️ Contrato {contract_number} próximo do vencimento"
      break
    case 'trial_expiry':
      template = settings.trial_expiry_subject || "⏰ Período de teste terminando - Contrato {contract_number}"
      break
    case 'new_contract':
      template = settings.new_contract_subject || "✅ Novo contrato criado - {contract_number}"
      break
    default:
      return ""
  }

  return template.replace('{contract_number}', contractNumber || '')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Iniciando processo automático de notificações...')
    console.log(`🕐 Horário de execução: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)

    // Verificar se temos a chave do Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.error('❌ RESEND_API_KEY não configurada!')
      throw new Error('RESEND_API_KEY não configurada')
    }
    console.log('✅ RESEND_API_KEY configurada')

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Primeiro, executar a função RPC para gerar novas notificações
    console.log('📝 Gerando novas notificações...')
    const { error: rpcError } = await supabase.rpc('generate_contract_notifications')
    
    if (rpcError) {
      console.error('❌ Erro ao gerar notificações:', rpcError)
      throw rpcError
    }

    console.log('✅ Notificações geradas com sucesso!')

    // Buscar todas as configurações de usuários que têm email ativado
    const { data: userSettings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('email_notifications', true)

    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError)
      throw settingsError
    }

    console.log(`📧 Verificando ${userSettings?.length || 0} usuários com email ativado`)

    let emailsSent = 0
    let emailsSkipped = 0
    let emailErrors = 0

    for (const settings of userSettings || []) {
      try {
        console.log(`\n👤 Processando usuário: ${settings.user_id}`)
        console.log(`⚙️ Configurações do usuário:`, {
          email_send_time: settings.email_send_time,
          email_days_of_week: settings.email_days_of_week,
          custom_email: settings.custom_email
        })
        
        // Verificar se é hora de enviar email para este usuário
        if (!shouldSendEmailNow(settings)) {
          console.log(`⏭️ Email pulado para usuário ${settings.user_id} - horário/dia não configurado`)
          emailsSkipped++
          continue
        }

        console.log(`✅ Hora correta para enviar email para usuário ${settings.user_id}`)

        // Buscar notificações não lidas do usuário
        const { data: notifications, error: notificationsError } = await supabase
          .from('notifications')
          .select(`
            *,
            contracts (
              contract_number,
              renewal_date,
              start_date,
              trial_days,
              status
            )
          `)
          .eq('user_id', settings.user_id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })

        if (notificationsError) {
          console.error('❌ Erro ao buscar notificações:', notificationsError)
          continue
        }

        if (!notifications || notifications.length === 0) {
          console.log(`📭 Nenhuma notificação não lida para usuário ${settings.user_id}`)
          continue
        }

        console.log(`📬 ${notifications.length} notificações não lidas encontradas para usuário ${settings.user_id}`)

        // Buscar dados da empresa
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('user_id', settings.user_id)
          .single()

        // Buscar dados do usuário para email
        const { data: userData } = await supabase.auth.admin.getUserById(settings.user_id)

        const userEmail = settings.custom_email || userData?.user?.email

        if (!userEmail) {
          console.log(`⚠️ Email não encontrado para usuário ${settings.user_id}`)
          continue
        }

        console.log(`📧 Email de destino: ${userEmail}`)

        // Enviar email para cada notificação não lida
        for (const notification of notifications) {
          // Verificar se deve enviar este tipo de email
          const shouldSendThisType = () => {
            switch (notification.type) {
              case 'contract_expiry':
                return settings.contract_expiry_email
              case 'trial_expiry':
                return settings.trial_expiry_email
              case 'new_contract':
                return settings.new_contract_email
              default:
                return false
            }
          }

          if (!shouldSendThisType()) {
            console.log(`⏭️ Tipo de notificação ${notification.type} desabilitado para usuário ${settings.user_id}`)
            continue
          }

          console.log(`📨 Tentando enviar email para notificação ${notification.type} - ${notification.title}`)

          // Preparar subject customizado
          const customSubject = getCustomSubject(
            settings, 
            notification.type, 
            notification.contracts?.contract_number
          )

          const emailData: NotificationData = {
            user_email: userEmail,
            type: notification.type as 'contract_expiry' | 'trial_expiry' | 'new_contract',
            title: notification.title,
            message: notification.message,
            contract_number: notification.contracts?.contract_number,
            company_name: companyData?.name,
            custom_subject: customSubject,
          }

          const template = getEmailTemplate(emailData)

          try {
            console.log(`📤 Enviando email via Resend...`)
            console.log(`- Para: ${userEmail}`)
            console.log(`- Assunto: ${template.subject}`)
            
            const { data, error } = await resend.emails.send({
              from: 'Sistema de Contratos <onboarding@resend.dev>',
              to: [userEmail],
              subject: template.subject,
              html: template.html,
            })

            if (error) {
              console.error(`❌ Erro no Resend:`, error)
              emailErrors++
            } else {
              console.log(`✅ Email enviado com sucesso via Resend!`)
              console.log(`- ID do email: ${data?.id}`)
              emailsSent++
            }
          } catch (emailError) {
            console.error(`❌ Exceção ao enviar email:`, emailError)
            emailErrors++
          }
        }
      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${settings.user_id}:`, userError)
      }
    }

    console.log(`\n📊 RESUMO FINAL:`)
    console.log(`- Emails enviados: ${emailsSent}`)
    console.log(`- Usuários pulados: ${emailsSkipped}`)
    console.log(`- Erros de email: ${emailErrors}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        emailsSkipped,
        emailErrors,
        message: `${emailsSent} emails enviados com sucesso` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na função de automação:', error)
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
