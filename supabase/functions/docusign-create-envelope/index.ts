
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocuSignEnvelopeRequest {
  contractData: any;
  contractorData: any;
  companyData: any;
  options?: {
    emailSubject?: string;
    emailMessage?: string;
    redirectUrl?: string;
  };
}

interface DocuSignAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const getDocuSignAccessToken = async (): Promise<string> => {
  console.log('🔑 [AUTH] Iniciando autenticação DocuSign...');
  
  const integrationKey = Deno.env.get('DOCUSIGN_INTEGRATION_KEY');
  const userId = Deno.env.get('DOCUSIGN_USER_ID');
  const authServer = Deno.env.get('DOCUSIGN_AUTH_SERVER') || 'https://account-d.docusign.com';
  const rsaPrivateKey = Deno.env.get('DOCUSIGN_RSA_PRIVATE_KEY');

  console.log('🔑 [AUTH] Variáveis de ambiente:', {
    integrationKey: integrationKey ? '✅ Definido' : '❌ Indefinido',
    userId: userId ? '✅ Definido' : '❌ Indefinido',
    authServer: authServer ? '✅ Definido' : '❌ Indefinido',
    rsaPrivateKey: rsaPrivateKey ? '✅ Definido' : '❌ Indefinido'
  });

  if (!integrationKey || !userId || !rsaPrivateKey) {
    throw new Error('DocuSign credentials are missing');
  }

  // Create JWT assertion
  const header = {
    "alg": "RS256",
    "typ": "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    "iss": integrationKey,
    "sub": userId,
    "aud": authServer,
    "iat": now,
    "exp": now + 3600, // 1 hour
    "scope": "signature impersonation"
  };

  console.log('🔑 [AUTH] JWT payload criado:', payload);

  // For demonstration purposes, we'll use a simplified approach
  // In production, you'd want to use a proper JWT library
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  // This is a simplified JWT creation - in production use a proper JWT library
  const assertion = `${encodedHeader}.${encodedPayload}.signature_placeholder`;

  console.log('🔑 [AUTH] Fazendo requisição para obter token...');

  const tokenResponse = await fetch(`${authServer}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      'assertion': assertion
    })
  });

  console.log('🔑 [AUTH] Status da resposta:', tokenResponse.status);

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('❌ [AUTH] Falha na autenticação DocuSign:', errorText);
    throw new Error('Failed to authenticate with DocuSign');
  }

  const tokenData: DocuSignAuthResponse = await tokenResponse.json();
  console.log('✅ [AUTH] Token obtido com sucesso');
  return tokenData.access_token;
};

const generateContractHTML = (contractData: any, contractorData: any, companyData: any): string => {
  console.log('📄 [HTML] Gerando HTML do contrato...');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Contrato #${contractData.contract_number}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .contract-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .section { margin: 20px 0; }
            .signature-area { margin-top: 50px; padding: 20px; border: 1px solid #ccc; }
            .party { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .value-highlight { font-weight: bold; color: #059669; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="contract-number">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
            <div>Número: ${contractData.contract_number}</div>
        </div>

        <div class="section">
            <h3>CONTRATANTE</h3>
            <div class="party">
                <strong>Empresa:</strong> ${contractorData.name}<br>
                <strong>CNPJ:</strong> ${contractorData.cnpj}<br>
                <strong>Endereço:</strong> ${contractorData.address}<br>
                <strong>Cidade:</strong> ${contractorData.city} - ${contractorData.state}<br>
                <strong>Responsável:</strong> ${contractorData.responsible_name}<br>
                <strong>CPF:</strong> ${contractorData.responsible_cpf}
            </div>
        </div>

        <div class="section">
            <h3>CONTRATADA</h3>
            <div class="party">
                <strong>Empresa:</strong> ${companyData.name}<br>
                <strong>Email:</strong> ${companyData.email}<br>
                <strong>Telefone:</strong> ${companyData.phone}<br>
                <strong>Responsável:</strong> ${companyData.responsibleName}
            </div>
        </div>

        <div class="section">
            <h3>OBJETO DO CONTRATO</h3>
            <p>Prestação de serviços de sistema de gestão empresarial conforme especificações técnicas.</p>
            
            <div class="party">
                <strong>Plano:</strong> ${contractData.plan_type}<br>
                <strong>Funcionários:</strong> ${contractData.employee_count}<br>
                <strong>CNPJs:</strong> ${contractData.cnpj_count}<br>
                <strong>Valor Mensal:</strong> <span class="value-highlight">R$ ${contractData.monthly_value}</span><br>
                <strong>Data de Início:</strong> ${contractData.start_date}<br>
                <strong>Data de Renovação:</strong> ${contractData.renewal_date}<br>
                <strong>Período de Teste:</strong> ${contractData.trial_days} dias
            </div>
        </div>

        <div class="section">
            <h3>CONDIÇÕES DE PAGAMENTO</h3>
            <p>
                O pagamento será efetuado mensalmente, sempre no dia ${contractData.payment_day} de cada mês,
                iniciando em ${contractData.payment_start_date}.
            </p>
        </div>

        <div class="signature-area">
            <h3>ASSINATURAS</h3>
            
            <div style="margin: 40px 0;">
                <strong>CONTRATANTE:</strong><br>
                <div style="margin-top: 20px;">
                    {ContractorSignature}
                </div>
                <div style="margin-top: 10px;">
                    ${contractorData.responsible_name}<br>
                    ${contractorData.name}
                </div>
            </div>

            <div style="margin: 40px 0;">
                <strong>CONTRATADA:</strong><br>
                <div style="margin-top: 20px;">
                    {CompanySignature}
                </div>
                <div style="margin-top: 10px;">
                    ${companyData.responsibleName}<br>
                    ${companyData.name}
                </div>
            </div>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Documento gerado em ${new Date().toLocaleDateString('pt-BR')}
        </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  console.log('🚀 [FUNCTION] ===== FUNÇÃO DOCUSIGN INICIADA =====');
  console.log('🚀 [FUNCTION] Método HTTP:', req.method);
  console.log('🚀 [FUNCTION] URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [FUNCTION] Retornando resposta OPTIONS para CORS');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 [FUNCTION] Lendo corpo da requisição...');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 [FUNCTION] Corpo da requisição recebido:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ [FUNCTION] Erro ao fazer parse do JSON:', parseError);
      throw new Error(`Erro ao fazer parse do JSON: ${parseError.message}`);
    }
    
    const { contractData, contractorData, companyData, options }: DocuSignEnvelopeRequest = requestBody;

    console.log('🔍 [FUNCTION] Validando dados de entrada...');
    console.log('🔍 [FUNCTION] contractData:', contractData ? '✅ Presente' : '❌ Ausente');
    console.log('🔍 [FUNCTION] contractorData:', contractorData ? '✅ Presente' : '❌ Ausente');
    console.log('🔍 [FUNCTION] companyData:', companyData ? '✅ Presente' : '❌ Ausente');

    if (!contractData) {
      throw new Error('contractData é obrigatório');
    }
    if (!contractorData) {
      throw new Error('contractorData é obrigatório');
    }
    if (!companyData) {
      throw new Error('companyData é obrigatório');
    }

    console.log('🔑 [FUNCTION] Obtendo token de acesso DocuSign...');
    const accessToken = await getDocuSignAccessToken();
    console.log('✅ [FUNCTION] Token obtido com sucesso');

    const accountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    console.log('🔍 [FUNCTION] Account ID:', accountId ? '✅ Definido' : '❌ Indefinido');
    
    if (!accountId) {
      throw new Error('DOCUSIGN_ACCOUNT_ID não está definido');
    }

    console.log('📄 [FUNCTION] Gerando HTML do contrato...');
    const contractHTML = generateContractHTML(contractData, contractorData, companyData);
    const contractBase64 = btoa(unescape(encodeURIComponent(contractHTML)));
    console.log('✅ [FUNCTION] HTML gerado e convertido para base64');

    console.log('📋 [FUNCTION] Criando definição do envelope...');
    const envelopeDefinition = {
      emailSubject: options?.emailSubject || `Contrato #${contractData.contract_number} - Assinatura Digital`,
      documents: [{
        documentId: "1",
        name: `Contrato_${contractData.contract_number}.html`,
        fileExtension: "html",
        documentBase64: contractBase64
      }],
      recipients: {
        signers: [
          {
            email: contractorData.email || `contato@${contractorData.name.toLowerCase().replace(/\s+/g, '')}.com`,
            name: contractorData.responsible_name,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [{
                documentId: "1",
                pageNumber: "1",
                recipientId: "1",
                tabLabel: "ContractorSignature",
                xPosition: "100",
                yPosition: "500"
              }]
            }
          },
          {
            email: companyData.email || "admin@empresa.com",
            name: companyData.responsibleName || "Administrador",
            recipientId: "2", 
            routingOrder: "2",
            tabs: {
              signHereTabs: [{
                documentId: "1",
                pageNumber: "1", 
                recipientId: "2",
                tabLabel: "CompanySignature",
                xPosition: "100",
                yPosition: "600"
              }]
            }
          }
        ]
      },
      status: "sent"
    };

    console.log('📋 [FUNCTION] Envelope definition criado:', JSON.stringify(envelopeDefinition, null, 2));

    console.log('📤 [FUNCTION] Enviando requisição para DocuSign API...');
    
    const envelopeResponse = await fetch(`https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition)
    });

    console.log('📤 [FUNCTION] Status da resposta DocuSign API:', envelopeResponse.status);

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      console.error('❌ [FUNCTION] Erro da API DocuSign:', errorText);
      throw new Error(`DocuSign API error (${envelopeResponse.status}): ${errorText}`);
    }

    const envelope = await envelopeResponse.json();
    console.log('✅ [FUNCTION] Envelope criado com sucesso:', {
      envelopeId: envelope.envelopeId,
      status: envelope.status
    });

    console.log('🔗 [FUNCTION] Obtendo URL de assinatura...');
    const viewRequest = {
      authenticationMethod: "none",
      email: contractorData.email || `contato@${contractorData.name.toLowerCase().replace(/\s+/g, '')}.com`,
      userName: contractorData.responsible_name,
      recipientId: "1",
      returnUrl: options?.redirectUrl || "https://example.com/signed"
    };

    console.log('🔗 [FUNCTION] View request:', JSON.stringify(viewRequest, null, 2));

    const viewResponse = await fetch(`https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelope.envelopeId}/views/recipient`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(viewRequest)
    });

    let signingUrl = null;
    if (viewResponse.ok) {
      const viewData = await viewResponse.json();
      signingUrl = viewData.url;
      console.log('✅ [FUNCTION] URL de assinatura obtida');
    } else {
      const viewError = await viewResponse.text();
      console.warn('⚠️ [FUNCTION] Não foi possível obter URL de assinatura:', viewError);
    }

    const result = {
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      signingUrl: signingUrl,
      documentId: "1",
      createdDateTime: new Date().toISOString(),
      recipients: [
        {
          name: contractorData.responsible_name,
          email: contractorData.email || `contato@${contractorData.name.toLowerCase().replace(/\s+/g, '')}.com`,
          status: "sent"
        },
        {
          name: companyData.responsibleName || "Administrador", 
          email: companyData.email || "admin@empresa.com",
          status: "sent"
        }
      ]
    };

    console.log('🎉 [FUNCTION] ===== SUCESSO TOTAL =====');
    console.log('🎉 [FUNCTION] Resultado final:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('💥 [FUNCTION] ===== ERRO CRÍTICO =====');
    console.error('💥 [FUNCTION] Erro:', error);
    console.error('💥 [FUNCTION] Mensagem:', error.message);
    console.error('💥 [FUNCTION] Stack:', error.stack);
    console.error('💥 [FUNCTION] ============================');
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: 'Falha ao criar envelope DocuSign',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
