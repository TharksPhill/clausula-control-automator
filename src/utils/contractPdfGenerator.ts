
import { supabase } from '@/integrations/supabase/client';
import { 
  getClause411Text, 
  getClause21Text, 
  getClause71Text, 
  getValueText,
  formatContractant 
} from '@/utils/contractClauses';

export const generateContractPDF = async (contractData: any, contractorData: any, type: 'original' | 'signed' = 'original') => {
  try {
    console.log("🔍 GERANDO PDF - Dados recebidos:", { contractData, contractorData, type });
    
    // Verificar se os dados essenciais existem
    if (!contractData || !contractorData) {
      console.error("❌ Dados insuficientes para gerar PDF:", { contractData, contractorData });
      throw new Error('Dados do contrato ou contratante não encontrados');
    }

    // Generate contract HTML content
    const contractHtml = generateContractHTML(contractData, contractorData, type);
    console.log("📄 HTML gerado para PDF (primeiros 500 chars):", contractHtml.substring(0, 500));
    
    console.log("🚀 Enviando HTML para Edge Function...");
    
    // Call the html-to-pdf edge function
    const { data, error } = await supabase.functions.invoke('html-to-pdf', {
      body: { html: contractHtml }
    });

    if (error) {
      console.error("❌ Erro na Edge Function:", error);
      throw new Error(`Erro na conversão HTML para PDF: ${error.message}`);
    }

    if (!data?.success || !data?.pdfBase64) {
      console.error("❌ Resposta inválida da Edge Function:", data);
      throw new Error('Falha ao gerar PDF: resposta inválida do servidor');
    }

    console.log("✅ PDF gerado com sucesso pela Edge Function");

    // Create download link and trigger download
    const filename = `contrato-${contractData?.contract_number || 'documento'}-${type}.pdf`;
    const dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
    
    // Create temporary link element for download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("📥 Download iniciado automaticamente");

    return true;
  } catch (error) {
    console.error('❌ Erro detalhado ao gerar PDF:', error);
    console.error('Stack trace:', error.stack);
    
    throw new Error(`Erro ao gerar PDF do contrato: ${error.message}`);
  }
};

const generateContractHTML = (contractData: any, contractorData: any, type: 'original' | 'signed') => {
  console.log("🏗️ Gerando HTML do contrato:", { contractData, contractorData, type });
  
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Normalizar contractorData - pode vir como array ou objeto único
  const allContractors = Array.isArray(contractorData) ? contractorData : [contractorData];
  const contractorTermLabel = allContractors.length === 1 ? "CONTRATANTE" : "CONTRATANTES";

  console.log("👥 Contratantes normalizados:", allContractors);

  // Calcular valores baseados no plano
  const baseValue = parseFloat(contractData?.monthly_value?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  let displayValue = baseValue;
  let valueLabel = "Valor Mensal";
  
  if (contractData?.plan_type === 'semestral') {
    const discount = parseFloat(contractData?.semestral_discount) || 0;
    displayValue = (baseValue * 6) * (1 - discount / 100);
    valueLabel = "Valor Semestral";
  } else if (contractData?.plan_type === 'anual') {
    const discount = parseFloat(contractData?.anual_discount) || 0;
    displayValue = (baseValue * 12) * (1 - discount / 100);
    valueLabel = "Valor Anual";
  }

  console.log("💰 Valores calculados:", { baseValue, displayValue, valueLabel });

  // Usar os mesmos dados da empresa que o preview
  const companyInfo = contractData?.company || {};
  console.log("🏢 Informações da empresa:", companyInfo);

  // Gerar seção de assinaturas
  const generateSignatureSection = () => {
    const signatureBaseStyle = `
      width: 300px; 
      height: 60px; 
      margin: 20px auto;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    `;

    if (type === 'signed') {
      return `
        <div style="margin-top: 40px; page-break-inside: avoid;">
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="margin-bottom: 15px; color: #333;">
              As partes abaixo identificadas declaram ter lido e compreendido integralmente os termos e condições do contrato mencionado, concordando em cumpri-los em sua totalidade.
            </p>
            <p style="margin-bottom: 25px; color: #333; font-weight: bold;">
              Araraquara, ${formatDate(contractData?.start_date)}
            </p>
          </div>

          <!-- Assinatura da empresa contratada (assinada) -->
          <div style="text-align: center; margin-bottom: 60px;">
            <div style="${signatureBaseStyle} border-color: #22c55e; background: #f0fdf4; color: #166534;">
              <div style="text-align: center;">
                <div style="font-weight: bold; font-size: 14px;">✓ ASSINADO DIGITALMENTE</div>
                <div style="font-size: 10px; margin-top: 2px;">
                  ${new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            <div style="font-weight: bold; font-size: 11px; margin-top: 15px;">
              CONTRATADA: ${companyInfo?.name || 'Araponto'}<br/>
              Responsável: ${companyInfo?.responsible_name || 'Administrador'}
            </div>
          </div>

          <!-- Assinaturas dos contratantes (assinadas) -->
          ${allContractors.map((contractor, index) => `
            <div style="text-align: center; margin-bottom: 60px;">
              <div style="${signatureBaseStyle} border-color: #22c55e; background: #f0fdf4; color: #166534;">
                <div style="text-align: center;">
                  <div style="font-weight: bold; font-size: 14px;">✓ ASSINADO DIGITALMENTE</div>
                  <div style="font-size: 10px; margin-top: 2px;">
                    ${new Date().toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <div style="font-weight: bold; font-size: 11px; margin-top: 15px;">
                ${allContractors.length === 1 
                  ? `CONTRATANTE: ${contractor?.name || 'Não informado'}`
                  : `CONTRATANTE ${index + 1}: ${contractor?.name || 'Não informado'}`
                }<br/>
                Responsável: ${contractor?.responsible_name || contractor?.name || 'Não informado'}
              </div>
            </div>
          `).join('')}

          <div style="margin-top: 30px; border: 2px solid #22c55e; background: #f0fdf4; padding: 15px; border-radius: 8px;">
            <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 14px;">INFORMAÇÕES DA ASSINATURA DIGITAL</h3>
            <p style="margin: 5px 0; font-size: 11px;"><strong>Documento assinado em:</strong> ${new Date().toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p style="margin: 5px 0; font-size: 11px;"><strong>Assinado por:</strong> ${allContractors.map(c => c?.responsible_name || c?.name).filter(Boolean).join(', ')}</p>
            <p style="margin: 5px 0; font-size: 11px;"><strong>IP de origem:</strong> 127.0.0.1</p>
            <p style="font-size: 9px; color: #666; margin-top: 10px;">
              Este documento foi assinado digitalmente de acordo com a Lei 14.063/2020 e possui validade jurídica equivalente à assinatura manuscrita.
            </p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="margin-top: 40px; page-break-inside: avoid;">
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="margin-bottom: 15px; color: #333;">
              As partes abaixo identificadas declaram ter lido e compreendido integralmente os termos e condições do contrato mencionado, concordando em cumpri-los em sua totalidade.
            </p>
            <p style="margin-bottom: 25px; color: #333; font-weight: bold;">
              Araraquara, ${formatDate(contractData?.start_date)}
            </p>
          </div>

          <!-- Assinatura da empresa contratada -->
          <div style="text-align: center; margin-bottom: 60px;">
            <div style="${signatureBaseStyle} border-color: #333; background: white;"></div>
            <div style="font-weight: bold; font-size: 11px; margin-top: 15px;">
              CONTRATADA: ${companyInfo?.name || 'Araponto'}<br/>
              Responsável: ${companyInfo?.responsible_name || 'Administrador'}
            </div>
          </div>

          <!-- Assinaturas dos contratantes -->
          ${allContractors.map((contractor, index) => `
            <div style="text-align: center; margin-bottom: 60px;">
              <div style="${signatureBaseStyle} border-color: #333; background: white;"></div>
              <div style="font-weight: bold; font-size: 11px; margin-top: 15px;">
                ${allContractors.length === 1 
                  ? `CONTRATANTE: ${contractor?.name || 'Não informado'}`
                  : `CONTRATANTE ${index + 1}: ${contractor?.name || 'Não informado'}`
                }<br/>
                Responsável: ${contractor?.responsible_name || contractor?.name || 'Não informado'}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #000; background: white; }
        .container { max-width: 180mm; margin: 0 auto; padding: 0; background: white; }
        h1, h2, h3 { margin-bottom: 8px; }
        p { margin-bottom: 6px; }
        .header { text-align: center; margin-bottom: 25px; }
        .company-info { background: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
        .contract-title { font-size: 20px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
        .contract-number { font-size: 16px; color: #6b7280; }
        .section { margin-bottom: 20px; }
        .clause-title { font-weight: bold; margin-bottom: 5px; }
        .data-grid { display: table; width: 100%; }
        .data-row { display: table-row; }
        .data-cell { display: table-cell; padding: 3px 10px 3px 0; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Company Header -->
        <div class="header">
          <div class="company-info">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">${companyInfo?.name || 'Araponto'}</h1>
            <p><strong>Endereço:</strong> ${companyInfo?.address || 'Padre Antonio Cesarino, Nº 842'}</p>
            <p><strong>Telefone:</strong> ${companyInfo?.phone || '16992326766'}</p>
            <p><strong>Website:</strong> ${companyInfo?.website || 'www.araponto.com'}</p>
            <p><strong>E-mail:</strong> ${companyInfo?.email || 'contato@araponto.com'}</p>
          </div>
        </div>

        <!-- Contract Title -->
        <div class="header" style="border-bottom: 2px solid #1f2937; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 class="contract-title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
          <h2 class="contract-number">(Nº${contractData?.contract_number || '003'})</h2>
          ${type === 'signed' ? `
            <div style="margin-top: 10px; padding: 8px; background: #f0fdf4; border: 1px solid #bbf7d0;">
              <p style="font-weight: bold; color: #166534;">✓ CONTRATO ASSINADO</p>
              <p style="font-size: 11px; color: #15803d;">
                Assinado em ${new Date().toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} - IP: 127.0.0.1
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Contractor Information -->
        <div class="section">
          <h3 style="font-size: 18px; color: #3b82f6; margin-bottom: 10px;">PARTES CONTRATANTES</h3>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>CONTRATANTE:</strong> <strong>${allContractors[0]?.name || 'EMPRESA CONTRATANTE'}</strong>, pessoa jurídica de direito privado, inscrita no <strong>CNPJ/MF</strong> 
            sob o nº <strong>${allContractors[0]?.cnpj || '00.000.000/0001-00'}</strong> com sede na <strong>${allContractors[0]?.address || 'Endereço não informado'}</strong>, na <strong>cidade de 
            ${allContractors[0]?.city || 'Cidade'}, estado ${allContractors[0]?.state || 'Estado'}</strong>, neste ato representada por seu responsável, <strong>${allContractors[0]?.responsible_name || 'Responsável'}</strong>, 
            inscrito(a) no <strong>CPF/MF</strong> sob o nº <strong>${allContractors[0]?.responsible_cpf || '000.000.000-00'}</strong>.
          </p>

          <div style="background: #f3f4f6; padding: 12px; margin-bottom: 15px;">
            <p style="text-align: justify;">
              <strong>CONTRATADO:</strong> <strong>${companyInfo?.name || 'M.L.C. LEITE'}</strong>, pessoa jurídica de direito privado, inscrita no <strong>CNPJ/MF</strong> sob o nº 
              <strong>${companyInfo?.cnpj || '27.995.971/0001-75'}</strong>, com sede na <strong>${companyInfo?.address || 'Av: PADRE ANTONIO CESARINO'}</strong>, na <strong>cidade de ${companyInfo?.city || 'ARARAQUARA'}, 
              estado ${companyInfo?.state || 'SÃO PAULO'}</strong>, neste ato representada por seu GERENTE COMERCIAL, <strong>${companyInfo?.responsible_name || 'EDSON ROBERTO PIRES'}</strong>, 
              inscrito(a) no <strong>CPF/MF</strong> sob o nº <strong>378.259.038.46</strong>.
            </p>
          </div>
        </div>

        <!-- Contract Details -->
        <div class="section">
          <h3 style="text-decoration: underline; font-weight: bold; margin-bottom: 8px;">DADOS DO CONTRATO</h3>
          <div class="data-grid">
            <div class="data-row">
              <div class="data-cell"><strong>${valueLabel}:</strong></div>
              <div class="data-cell">${formatCurrency(displayValue)}</div>
              <div class="data-cell"><strong>Tipo de Plano:</strong></div>
              <div class="data-cell">${contractData?.plan_type?.charAt(0).toUpperCase() + contractData?.plan_type?.slice(1) || 'Mensal'}</div>
            </div>
            <div class="data-row">
              <div class="data-cell"><strong>Funcionários:</strong></div>
              <div class="data-cell">${contractData?.employee_count || 'Não especificado'}</div>
              <div class="data-cell"><strong>CNPJs:</strong></div>
              <div class="data-cell">${contractData?.cnpj_count || '1'}</div>
            </div>
            <div class="data-row">
              <div class="data-cell"><strong>Data de Início:</strong></div>
              <div class="data-cell">${formatDate(contractData?.start_date)}</div>
              <div class="data-cell"><strong>Data de Renovação:</strong></div>
              <div class="data-cell">${formatDate(contractData?.renewal_date)}</div>
            </div>
            <div class="data-row">
              <div class="data-cell"><strong>Pagamento inicia:</strong></div>
              <div class="data-cell">${formatDate(contractData?.payment_start_date)}</div>
              <div class="data-cell"><strong>Vencimento:</strong></div>
              <div class="data-cell">Dia ${contractData?.payment_day || 'XX'}</div>
            </div>
            <div class="data-row">
              <div class="data-cell"><strong>Dias de Teste:</strong></div>
              <div class="data-cell">${contractData?.trial_days || '0'} dias</div>
              <div class="data-cell"></div>
              <div class="data-cell"></div>
            </div>
          </div>
        </div>

        <!-- Contract Clauses -->
        <div class="section">
          <h3 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #9ca3af; padding-bottom: 3px;">CLÁUSULAS CONTRATUAIS</h3>
          
          <div style="text-align: justify;">
            <div style="margin-bottom: 12px;">
              <h4 class="clause-title">CLÁUSULA 1ª - DO OBJETO</h4>
              <p>O presente contrato tem por objeto a prestação de serviços de software para gestão de recursos humanos, incluindo controle de ponto eletrônico, gestão de funcionários e relatórios gerenciais, conforme especificações técnicas anexas.</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h4 class="clause-title">CLÁUSULA 2ª - DO PRAZO E VIGÊNCIA</h4>
              <p><strong>2.1.</strong> ${getClause21Text(contractData?.plan_type || 'mensal')}</p>
              <p><strong>2.2.</strong> O presente contrato terá vigência de 12 (doze) meses, iniciando-se em ${formatDate(contractData?.start_date)} e encerrando-se em ${formatDate(contractData?.renewal_date)}, renovando-se automaticamente por períodos iguais, salvo manifestação em contrário de qualquer das partes com antecedência mínima de 30 (trinta) dias.</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h4 class="clause-title">CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO</h4>
              <p><strong>3.1.</strong> Pelos serviços prestados, ${allContractors.length > 1 ? 'os CONTRATANTES pagarão' : 'o CONTRATANTE pagará'} à CONTRATADA o ${getValueText(contractData?.plan_type || 'mensal')} de ${formatCurrency(displayValue)}.</p>
              <p><strong>3.2.</strong> Os pagamentos deverão ser efetuados até o dia ${contractData?.payment_day || 'XX'} de cada mês/período, conforme a periodicidade contratada.</p>
              <p><strong>3.3.</strong> O valor contratado será reajustado anualmente pelo IGPM ou, na sua falta, por índice que vier a substituí-lo.</p>
              <p><strong>3.4.</strong> O não pagamento na data devida implicará em multa de 2% sobre o valor em atraso, acrescida de juros de 1% ao mês.</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h4 class="clause-title">CLÁUSULA 4ª - DOS SERVIÇOS INCLUSOS E ADICIONAIS</h4>
              <p><strong>4.1.</strong> O plano contratado inclui o controle de até ${contractData?.employee_count || 'XX'} funcionários e ${contractData?.cnpj_count || '1'} CNPJ(s).</p>
              <p><strong>4.1.1.</strong> ${getClause411Text(contractData?.plan_type || 'mensal')}</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h4 class="clause-title">CLÁUSULA 5ª - DAS OBRIGAÇÕES DA CONTRATADA</h4>
              <p><strong>5.1.</strong> Fornecer acesso contínuo aos sistemas contratados, 24 horas por dia, 7 dias por semana;</p>
              <p><strong>5.2.</strong> Prestar suporte técnico via chat, e-mail ou telefone em horário comercial;</p>
              <p><strong>5.3.</strong> Realizar backup diário dos dados e garantir a segurança das informações;</p>
              <p><strong>5.4.</strong> Implementar atualizações e melhorias no sistema sem custo adicional;</p>
              <p><strong>5.5.</strong> Garantir compliance com a legislação trabalhista vigente.</p>
            </div>

            <div style="margin-bottom: 12px;">
              <h4 class="clause-title">CLÁUSULA 6ª - DAS OBRIGAÇÕES DO${allContractors.length > 1 ? 'S' : ''} ${contractorTermLabel}</h4>
              <p><strong>6.1.</strong> Efetuar o pagamento nas datas acordadas;</p>
              <p><strong>6.2.</strong> Fornecer informações necessárias e corretas para a prestação dos serviços;</p>
              <p><strong>6.3.</strong> Zelar pelo uso adequado do sistema e manter sigilo das credenciais de acesso;</p>
              <p><strong>6.4.</strong> Comunicar imediatamente qualquer irregularidade ou problema técnico;</p>
              <p><strong>6.5.</strong> Responsabilizar-se pela veracidade dos dados inseridos no sistema.</p>
            </div>
          </div>
        </div>

        ${generateSignatureSection()}

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ccc; padding-top: 15px;">
          <p style="font-size: 9px; color: #666;">
            Este contrato foi gerado automaticamente pelo sistema em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log("✅ HTML do contrato gerado com sucesso");
  return htmlContent;
};
