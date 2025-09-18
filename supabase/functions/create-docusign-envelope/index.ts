import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://deno.land/x/supabase@1.2.0/mod.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocuSignEnvelopeRequest {
  contractData: any;
  contractorData: any;
  companyInfo: any;
  options?: {
    emailSubject?: string;
    emailMessage?: string;
    redirectUrl?: string;
    test?: boolean;
  };
}

// Função auxiliar para importar chave PKCS#8 com diagnóstico melhorado
const importPKCS8Key = async (pkcs8Pem: string): Promise<CryptoKey> => {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  const pem = pkcs8Pem.trim();
  if (!pem.includes(pemHeader) || !pem.includes(pemFooter)) {
    throw new Error('Formato de chave PKCS#8 inválido');
  }
  
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
};

// Função auxiliar para converter PKCS#1 para PKCS#8
const convertPKCS1ToPKCS8 = (pkcs1Key: string): string => {
  console.log('🔧 [CONVERSION] Convertendo PKCS#1 para PKCS#8...');
  
  // Remover headers e footers
  let keyContent = pkcs1Key
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  // Decodificar base64
  const pkcs1Bytes = Uint8Array.from(atob(keyContent), c => c.charCodeAt(0));
  
  // ASN.1 structure for RSA algorithm identifier
  const rsaOid = new Uint8Array([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
  
  // Função auxiliar para codificar comprimento DER
  const encodeLengthDER = (length: number): number[] => {
    if (length < 0x80) {
      return [length];
    } else if (length < 0x100) {
      return [0x81, length];
    } else if (length < 0x10000) {
      return [0x82, (length >> 8) & 0xff, length & 0xff];
    } else {
      return [0x83, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff];
    }
  };

  // Criar estrutura PKCS#8
  const versionBytes = new Uint8Array([0x02, 0x01, 0x00]); // INTEGER 0
  const algorithmBytes = rsaOid;
  const privateKeyBytes = new Uint8Array([0x04, ...encodeLengthDER(pkcs1Bytes.length), ...pkcs1Bytes]);
  
  const contentLength = versionBytes.length + algorithmBytes.length + privateKeyBytes.length;
  
  const pkcs8Bytes = new Uint8Array([
    0x30, // SEQUENCE
    ...encodeLengthDER(contentLength),
    ...versionBytes,
    ...algorithmBytes,
    ...privateKeyBytes
  ]);
  
  // Converter para base64 e adicionar headers
  const base64Key = btoa(String.fromCharCode(...pkcs8Bytes));
  const pkcs8Key = '-----BEGIN PRIVATE KEY-----\n' + 
    base64Key.match(/.{1,64}/g)?.join('\n') + 
    '\n-----END PRIVATE KEY-----';

  console.log('✅ [CONVERSION] Conversão concluída');
  return pkcs8Key;
};

const getDocuSignAccessToken = async (userConfig?: any): Promise<string> => {
  console.log('🔑 [AUTH] Iniciando autenticação DocuSign PRODUÇÃO...');
  
  // Buscar credenciais de produção
  let integrationKey = userConfig?.integrationKey || Deno.env.get('DOCUSIGN_INTEGRATION_KEY');
  let userId = userConfig?.userId || Deno.env.get('DOCUSIGN_USER_ID');
  let authServer = userConfig?.authServer || Deno.env.get('DOCUSIGN_AUTH_SERVER') || 'https://account.docusign.com';
  let rsaPrivateKey = userConfig?.rsaPrivateKey || Deno.env.get('DOCUSIGN_RSA_PRIVATE_KEY');

  console.log('🔑 [AUTH] Configuração de PRODUÇÃO carregada:', {
    integrationKey: integrationKey ? '✅ Presente' : '❌ Ausente',
    userId: userId ? '✅ Presente' : '❌ Ausente',
    authServer: authServer || 'Padrão Produção',
    rsaPrivateKey: rsaPrivateKey ? '✅ Presente' : '❌ Ausente',
    environment: authServer.includes('account-d') ? '⚠️ DEMO' : '✅ PRODUÇÃO'
  });

  if (!integrationKey || !userId || !rsaPrivateKey) {
    throw new Error('Credenciais DocuSign de PRODUÇÃO não encontradas. Verifique a configuração no painel administrativo.');
  }

  // Alertar se ainda estiver usando ambiente demo
  if (authServer.includes('account-d')) {
    console.warn('⚠️ [AUTH] ATENÇÃO: Usando servidor de autenticação DEMO. Mude para https://account.docusign.com para produção.');
  }

  try {
    console.log('🔧 [AUTH] Processando chave privada para produção...');
    
    let processedKey = rsaPrivateKey.trim();
    
    if (processedKey.includes('BEGIN RSA PRIVATE KEY')) {
      console.log('🔧 [AUTH] Convertendo PKCS#1 para PKCS#8...');
      processedKey = convertPKCS1ToPKCS8(processedKey);
    }

    const privateKey = await importPKCS8Key(processedKey);
    console.log('✅ [AUTH] Chave privada importada com sucesso para produção');

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

    console.log('🔑 [AUTH] Criando JWT para produção...', {
      issuer: integrationKey.substring(0, 8) + '...',
      subject: userId.substring(0, 8) + '...',
      audience: authServer,
      expiration: new Date((now + 3600) * 1000).toISOString()
    });

    // Create JWT
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signatureInput)
    );
    
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const jwt = `${signatureInput}.${signature}`;

    console.log('📤 [AUTH] Fazendo requisição de token para servidor de PRODUÇÃO:', authServer);

    const tokenResponse = await fetch(`${authServer}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt
      })
    });

    console.log('📥 [AUTH] Status da resposta do servidor de produção:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [AUTH] Falha na autenticação de PRODUÇÃO:', errorText);
      
      if (tokenResponse.status === 401) {
        throw new Error('Falha na autenticação: Verifique suas credenciais de PRODUÇÃO. Certifique-se de que sua aplicação está aprovada para produção.');
      }
      
      throw new Error(`Erro de autenticação DocuSign (${tokenResponse.status}): ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ [AUTH] Token de PRODUÇÃO obtido com sucesso');
    return tokenData.access_token;

  } catch (error: any) {
    console.error('❌ [AUTH] Erro crítico na autenticação de PRODUÇÃO:', error);
    throw new Error(`Falha na autenticação DocuSign de PRODUÇÃO: ${error.message}`);
  }
};

const generateContractHTML = (contractData: any, contractorData: any, companyData: any): string => {
  console.log('📄 [HTML] Gerando HTML do contrato para PRODUÇÃO...');
  
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
            .production-notice { 
              background: #dcfce7; 
              border: 2px solid #16a34a; 
              padding: 10px; 
              margin: 20px 0; 
              border-radius: 5px;
              text-align: center;
              font-weight: bold;
              color: #15803d;
            }
        </style>
    </head>
    <body>
        <div class="production-notice">
            📋 DOCUMENTO OFICIAL - LEGALMENTE VÁLIDO
        </div>

        <div class="header">
            <div class="contract-number">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
            <div>Número: ${contractData.contract_number}</div>
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
        </div>

        <div class="section">
            <h3>CONTRATANTE</h3>
            <div class="party">
                <strong>Empresa:</strong> ${contractorData.name}<br>
                <strong>CNPJ:</strong> ${contractorData.cnpj}<br>
                <strong>Endereço:</strong> ${contractorData.address}<br>
                <strong>Cidade:</strong> ${contractorData.city} - ${contractorData.state}<br>
                <strong>Responsável:</strong> ${contractorData.responsible_name}<br>
                <strong>CPF:</strong> ${contractorData.responsible_cpf}<br>
                <strong>Email:</strong> ${contractorData.email}
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
            <p>Prestação de serviços de sistema de gestão empresarial conforme especificações técnicas detalhadas em anexo.</p>
            
            <div class="party">
                <strong>Plano:</strong> ${contractData.plan_type}<br>
                <strong>Funcionários:</strong> ${contractData.employee_count}<br>
                <strong>CNPJs:</strong> ${contractData.cnpj_count}<br>
                <strong>Valor Mensal:</strong> <span class="value-highlight">R$ ${contractData.monthly_value}</span><br>
                <strong>Data de Início:</strong> ${contractData.start_date}<br>
                <strong>Data de Renovação:</strong> ${contractData.renewal_date}<br>
                <strong>Período de Teste:</strong> ${contractData.trial_days} dias<br>
                <strong>Dia de Pagamento:</strong> ${contractData.payment_day}
            </div>
        </div>

        <div class="section">
            <h3>CONDIÇÕES DE PAGAMENTO</h3>
            <p>
                O pagamento será efetuado mensalmente, sempre no dia ${contractData.payment_day} de cada mês,
                iniciando em ${contractData.payment_start_date}. O não pagamento na data devida acarretará 
                multa de 2% sobre o valor em atraso, além de juros de 1% ao mês.
            </p>
        </div>

        <div class="section">
            <h3>VIGÊNCIA E RENOVAÇÃO</h3>
            <p>
                Este contrato terá vigência de ${contractData.start_date} até ${contractData.renewal_date}, 
                sendo renovado automaticamente por igual período, salvo manifestação em contrário 
                de qualquer das partes com antecedência mínima de 30 (trinta) dias.
            </p>
        </div>

        <div class="signature-area">
            <h3>ASSINATURAS DIGITAIS</h3>
            <p style="text-align: center; margin-bottom: 30px; font-style: italic; color: #666;">
                Este documento será assinado digitalmente através da plataforma DocuSign, 
                garantindo autenticidade e validade jurídica.
            </p>
            
            <div style="margin: 40px 0;">
                <strong>CONTRATANTE:</strong><br>
                <div style="margin-top: 20px; border: 1px solid #ddd; height: 60px; position: relative;">
                    {ContractorSignature}
                </div>
                <div style="margin-top: 10px;">
                    ${contractorData.responsible_name}<br>
                    ${contractorData.name}<br>
                    CPF: ${contractorData.responsible_cpf}
                </div>
            </div>

            <div style="margin: 40px 0;">
                <strong>CONTRATADA:</strong><br>
                <div style="margin-top: 20px; border: 1px solid #ddd; height: 60px; position: relative;">
                    {CompanySignature}
                </div>
                <div style="margin-top: 10px;">
                    ${companyData.responsibleName}<br>
                    ${companyData.name}
                </div>
            </div>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 11px; border-top: 1px solid #ddd; padding-top: 20px;">
            <p><strong>Documento assinado digitalmente via DocuSign</strong></p>
            <p>Este documento tem validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020</p>
            <p>Contrato #${contractData.contract_number} | Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  console.log('🚀 [FUNCTION] ===== FUNÇÃO DOCUSIGN PRODUÇÃO INICIADA =====');
  console.log('🚀 [FUNCTION] Método HTTP:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [FUNCTION] Retornando resposta OPTIONS para CORS');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 [FUNCTION] Lendo corpo da requisição...');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 [FUNCTION] Corpo da requisição recebido');
    } catch (parseError) {
      console.error('❌ [FUNCTION] Erro ao fazer parse do JSON:', parseError);
      throw new Error(`Erro ao fazer parse do JSON: ${parseError.message}`);
    }
    
    const { contractData, contractorData, companyInfo, options }: DocuSignEnvelopeRequest = requestBody;

    console.log('🔍 [FUNCTION] Validando dados de entrada para PRODUÇÃO...');
    
    if (!contractData) {
      throw new Error('contractData é obrigatório');
    }
    if (!contractorData) {
      throw new Error('contractorData é obrigatório');
    }
    if (!companyInfo) {
      throw new Error('companyInfo é obrigatório');
    }

    // Buscar configurações do usuário do Supabase
    console.log('🔍 [FUNCTION] Buscando configurações DocuSign do usuário...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pegar o token do header Authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      supabase.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: configData, error: configError } = await supabase
      .from('docusign_configurations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    let userConfig = null;
    if (configData && !configError) {
      userConfig = {
        integrationKey: configData.integration_key,
        userId: configData.user_id_docusign,
        accountId: configData.account_id,
        rsaPrivateKey: configData.rsa_private_key,
        baseUrl: configData.base_url,
        authServer: configData.auth_server
      };
      console.log('✅ [FUNCTION] Configurações do usuário carregadas:', {
        hasConfig: true,
        environment: userConfig.authServer?.includes('account-d') ? '⚠️ DEMO' : '✅ PRODUÇÃO',
        baseUrl: userConfig.baseUrl
      });
    }

    console.log('🔑 [FUNCTION] Obtendo token de acesso DocuSign de PRODUÇÃO...');
    const accessToken = await getDocuSignAccessToken(userConfig);
    console.log('✅ [FUNCTION] Token de PRODUÇÃO obtido com sucesso');

    // Determinar account ID e base URL
    const accountId = userConfig?.accountId || Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    const baseUrl = userConfig?.baseUrl || Deno.env.get('DOCUSIGN_BASE_URL') || 'https://na1.docusign.net';
    
    console.log('🔍 [FUNCTION] Configuração final:', {
      accountId: accountId ? '✅ Definido' : '❌ Indefinido',
      baseUrl: baseUrl,
      environment: baseUrl.includes('demo') ? '⚠️ DEMO' : '✅ PRODUÇÃO'
    });
    
    if (!accountId) {
      throw new Error('DOCUSIGN_ACCOUNT_ID não está definido');
    }

    // Alertar se ainda estiver usando ambiente demo
    if (baseUrl.includes('demo')) {
      console.warn('⚠️ [FUNCTION] ATENÇÃO: Usando ambiente DEMO. Para produção, use https://na1.docusign.net ou similar.');
    }

    console.log('📄 [FUNCTION] Gerando HTML do contrato para PRODUÇÃO...');
    const contractHTML = generateContractHTML(contractData, contractorData, companyInfo);
    const contractBase64 = btoa(unescape(encodeURIComponent(contractHTML)));
    console.log('✅ [FUNCTION] HTML gerado e convertido para base64');

    console.log('📋 [FUNCTION] Criando definição do envelope de PRODUÇÃO...');
    const envelopeDefinition = {
      emailSubject: options?.emailSubject || `📋 Contrato #${contractData.contract_number} - Assinatura Digital Oficial`,
      emailBlurb: `Olá! Você recebeu este contrato oficial para assinatura digital. Este documento tem validade jurídica e será legalmente vinculante após sua assinatura.`,
      documents: [{
        documentId: "1",
        name: `Contrato_${contractData.contract_number}_Oficial.html`,
        fileExtension: "html",
        documentBase64: contractBase64
      }],
      recipients: {
        signers: [
          {
            email: contractorData.email,
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
                yPosition: "500",
                width: "200",
                height: "50"
              }]
            }
          },
          {
            email: companyInfo.email,
            name: companyInfo.responsibleName || "Administrador",
            recipientId: "2", 
            routingOrder: "2",
            tabs: {
              signHereTabs: [{
                documentId: "1",
                pageNumber: "1", 
                recipientId: "2",
                tabLabel: "CompanySignature",
                xPosition: "100",
                yPosition: "600",
                width: "200",
                height: "50"
              }]
            }
          }
        ]
      },
      status: "sent"
    };

    console.log('📋 [FUNCTION] Envelope de PRODUÇÃO criado:', {
      subject: envelopeDefinition.emailSubject,
      recipients: envelopeDefinition.recipients.signers.length,
      contractorEmail: contractorData.email,
      companyEmail: companyInfo.email
    });

    console.log('📤 [FUNCTION] Enviando requisição para DocuSign API de PRODUÇÃO...');
    
    const envelopeResponse = await fetch(`${baseUrl}/restapi/v2.1/accounts/${accountId}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition)
    });

    console.log('📤 [FUNCTION] Status da resposta DocuSign API de PRODUÇÃO:', envelopeResponse.status);

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      console.error('❌ [FUNCTION] Erro da API DocuSign de PRODUÇÃO:', errorText);
      throw new Error(`DocuSign API error (${envelopeResponse.status}): ${errorText}`);
    }

    const envelope = await envelopeResponse.json();
    console.log('✅ [FUNCTION] Envelope de PRODUÇÃO criado com sucesso:', {
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      environment: baseUrl.includes('demo') ? 'DEMO' : 'PRODUÇÃO'
    });

    console.log('🔗 [FUNCTION] Obtendo URL de assinatura para PRODUÇÃO...');
    const viewRequest = {
      authenticationMethod: "none",
      email: contractorData.email,
      userName: contractorData.responsible_name,
      recipientId: "1",
      returnUrl: options?.redirectUrl || `${req.url.split('/functions')[0]}/contract-signatures`
    };

    const viewResponse = await fetch(`${baseUrl}/restapi/v2.1/accounts/${accountId}/envelopes/${envelope.envelopeId}/views/recipient`, {
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
      console.log('✅ [FUNCTION] URL de assinatura de PRODUÇÃO obtida');
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
      environment: baseUrl.includes('demo') ? 'demo' : 'production',
      recipients: [
        {
          name: contractorData.responsible_name,
          email: contractorData.email,
          status: "sent"
        },
        {
          name: companyInfo.responsibleName || "Administrador", 
          email: companyInfo.email,
          status: "sent"
        }
      ]
    };

    console.log('🎉 [FUNCTION] ===== SUCESSO TOTAL - PRODUÇÃO =====');
    console.log('🎉 [FUNCTION] Envelope de PRODUÇÃO enviado:', {
      envelopeId: envelope.envelopeId,
      environment: result.environment,
      contractNumber: contractData.contract_number
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('💥 [FUNCTION] ===== ERRO CRÍTICO - PRODUÇÃO =====');
    console.error('💥 [FUNCTION] Erro:', error);
    console.error('💥 [FUNCTION] Mensagem:', error.message);
    console.error('💥 [FUNCTION] ============================');
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: 'Falha ao criar envelope DocuSign de PRODUÇÃO',
        timestamp: new Date().toISOString(),
        environment: 'production'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
