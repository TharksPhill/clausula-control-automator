import { supabase } from '@/integrations/supabase/client';
import { TravelQuoteData } from '@/types/travel-quote';

export const generateTravelQuotePDF = async (quoteData: TravelQuoteData) => {
  try {
    console.log('=== GERANDO PDF DE ORÇAMENTO DE VIAGEM ===');
    console.log('Quote data recebida:', quoteData);

    // Generate quote HTML content
    const quoteHtml = generateTravelQuoteHTML(quoteData);
    console.log('HTML gerado:', quoteHtml.substring(0, 500) + '...');
    
    console.log("🚀 Enviando HTML para Edge Function...");
    
    // Call the html-to-pdf edge function
    const { data, error } = await supabase.functions.invoke('html-to-pdf', {
      body: { html: quoteHtml }
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
    const filename = `orcamento-viagem-${quoteData.clientName.replace(/\s/g, '_')}-${Date.now()}.pdf`;
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
    console.error('Erro detalhado ao gerar PDF:', error);
    throw new Error('Erro ao gerar PDF do orçamento de viagem');
  }
};

const generateTravelQuoteHTML = (quoteData: TravelQuoteData) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const totalDestinations = quoteData.destinations.length;

  return `
    <div style="width: 100%; max-width: 800px; margin: 0 auto; background: white; color: black; font-family: Arial, sans-serif;">
      <!-- Header da Empresa -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #3b82f6; color: white;">
        ${quoteData.companyLogo ? `
          <div style="margin-bottom: 15px;">
            <img src="${quoteData.companyLogo}" alt="Logo da empresa" style="max-height: 60px; max-width: 200px;">
          </div>
        ` : ''}
        <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">${quoteData.companyName}</h1>
        <div style="margin-top: 15px; font-size: 14px;">
          <p style="margin: 5px 0;">CNPJ: ${quoteData.companyCnpj}</p>
          <p style="margin: 5px 0;">${quoteData.companyAddress}</p>
          <p style="margin: 5px 0;">${quoteData.companyEmail} | ${quoteData.companyPhone}</p>
          ${quoteData.companyWebsite ? `<p style="margin: 5px 0;">${quoteData.companyWebsite}</p>` : ''}
        </div>
      </div>

      <!-- Título do Orçamento -->
      <div style="text-align: center; margin-bottom: 25px; padding: 15px; border: 2px solid #e5e7eb;">
        <h2 style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 0 0 8px 0;">ORÇAMENTO DE VIAGEM TÉCNICA</h2>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Número: VT-${Date.now().toString().slice(-6)}</p>
        <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">Data: ${formatDate(new Date())}</p>
        ${quoteData.travelDate ? `<p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">Data da Viagem: ${quoteData.travelDate}</p>` : ''}
      </div>

      <!-- Dados do Cliente -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb;">
        <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">DADOS DO CLIENTE</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Nome:</strong> ${quoteData.clientName}</p>
        ${quoteData.clientCompany ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Empresa:</strong> ${quoteData.clientCompany}</p>` : ''}
        ${quoteData.clientEmail ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${quoteData.clientEmail}</p>` : ''}
        ${quoteData.clientPhone ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Telefone:</strong> ${quoteData.clientPhone}</p>` : ''}
        ${quoteData.clientAddress ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Endereço:</strong> ${quoteData.clientAddress}</p>` : ''}
      </div>

      <!-- Informações da Viagem -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; background: #f8fafc;">
        <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #10b981; padding-bottom: 5px;">INFORMAÇÕES DA VIAGEM</h3>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">📍 Ponto de Partida</h4>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 15px;">${quoteData.origin}</p>
        </div>

        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">🎯 Destinos (${totalDestinations})</h4>
          ${quoteData.destinations.map((destination, index) => `
            <div style="margin-bottom: 12px; padding: 10px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="flex: 1;">
                  <h5 style="font-size: 13px; font-weight: bold; color: #1f2937; margin: 0 0 4px 0;">
                    ${index + 1}. ${destination.label}
                  </h5>
                  <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0;">${destination.address}</p>
                  ${destination.services.length > 0 ? `
                    <p style="font-size: 11px; color: #059669; margin: 0;">
                      <strong>Serviços:</strong> ${destination.services.join(', ')}
                    </p>
                  ` : ''}
                </div>
                <div style="text-align: right; margin-left: 15px;">
                  <p style="font-size: 11px; color: #6b7280; margin: 0;">${formatDistance(destination.distance)}</p>
                  <p style="font-size: 11px; color: #6b7280; margin: 0;">${formatDuration(destination.duration)}</p>
                  ${destination.tollCost > 0 ? `<p style="font-size: 11px; color: #f59e0b; margin: 0;">Pedágio: ${formatCurrency(destination.tollCost)}</p>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background: white; padding: 12px; border: 1px solid #10b981; border-radius: 8px;">
          <h4 style="font-size: 14px; font-weight: bold; color: #065f46; margin: 0 0 8px 0;">📊 Resumo da Viagem</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;"><strong>Distância Total:</strong> ${formatDistance(quoteData.costs.totalDistance)}</p>
              <p style="font-size: 12px; color: #6b7280; margin: 0;"><strong>Tempo Total:</strong> ${formatDuration(quoteData.costs.totalDuration)}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;"><strong>Tipo:</strong> ${quoteData.roundTrip ? 'Ida e Volta' : 'Somente Ida'}</p>
              <p style="font-size: 12px; color: #6b7280; margin: 0;"><strong>Pedágios:</strong> ${formatCurrency(quoteData.costs.totalTolls)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detalhamento de Custos -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; background: #fef3c7;">
        <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">DETALHAMENTO DE CUSTOS</h3>
        
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
              <span style="color: #374151; font-weight: bold;">Item</span>
              <span style="color: #374151; font-weight: bold;">Valor</span>
            </div>
            
            ${quoteData.costs.fuelCost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                <span style="color: #6b7280;">🛣️ Combustível (${formatDistance(quoteData.costs.totalDistance)})</span>
                <span style="color: #374151;">${formatCurrency(quoteData.costs.fuelCost)}</span>
              </div>
            ` : ''}
            
            ${quoteData.costs.vehicleCost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                <span style="color: #6b7280;">🚗 Desgaste do Veículo</span>
                <span style="color: #374151;">${formatCurrency(quoteData.costs.vehicleCost)}</span>
              </div>
            ` : ''}
            
            ${quoteData.costs.totalTolls > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                <span style="color: #6b7280;">🛣️ Pedágios</span>
                <span style="color: #374151;">${formatCurrency(quoteData.costs.totalTolls)}</span>
              </div>
            ` : ''}
            
            ${quoteData.costs.employeeCost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                <span style="color: #6b7280;">👷 Mão de Obra (${formatDuration(quoteData.costs.totalDuration)})</span>
                <span style="color: #374151;">${formatCurrency(quoteData.costs.employeeCost)}</span>
              </div>
            ` : ''}
            
            ${quoteData.costs.serviceCost > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
                <span style="color: #6b7280;">🔧 Serviços Técnicos</span>
                <span style="color: #374151;">${formatCurrency(quoteData.costs.serviceCost)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Resumo Financeiro -->
      <div style="margin-bottom: 25px; padding: 20px; border: 2px solid #3b82f6; background: #f0f9ff;">
        <h3 style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; text-align: center;">RESUMO FINANCEIRO</h3>
        
        <div style="background: white; padding: 15px; border-radius: 8px;">
          <div style="border-top: 2px solid #3b82f6; padding-top: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: bold; color: #1e40af;">VALOR TOTAL DA VIAGEM:</span>
              <span style="font-size: 24px; font-weight: bold; color: #059669;">${formatCurrency(quoteData.costs.totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notas e Observações -->
      ${quoteData.notes ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; background: #f9fafb;">
          <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #6b7280; padding-bottom: 5px;">OBSERVAÇÕES</h3>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0;">${quoteData.notes}</p>
        </div>
      ` : ''}

      <!-- Informações Importantes -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #fbbf24; background: #fffbeb;">
        <h3 style="font-size: 14px; font-weight: bold; color: #92400e; margin: 0 0 10px 0;">CONDIÇÕES GERAIS</h3>
        <ul style="font-size: 12px; color: #6b7280; line-height: 1.4; margin: 0; padding-left: 16px;">
          <li style="margin-bottom: 3px;">Orçamento válido por ${quoteData.validityDays} dias</li>
          <li style="margin-bottom: 3px;">Valores sujeitos a alteração sem aviso prévio</li>
          <li style="margin-bottom: 3px;">Proposta comercial sem valor fiscal</li>
          <li style="margin-bottom: 3px;">Valores podem variar conforme condições de trânsito e combustível</li>
          <li style="margin-bottom: 3px;">Serviços executados por profissional qualificado</li>
          <li style="margin-bottom: 3px;">Deslocamento inclui ida ${quoteData.roundTrip ? 'e volta' : 'apenas'}</li>
        </ul>
      </div>

      <!-- Rodapé -->
      <div style="text-align: center; padding: 15px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 11px;">
        <p style="margin: 0 0 5px 0;">
          <strong>${quoteData.companyName}</strong> - ${quoteData.responsibleName}
        </p>
        <p style="margin: 0 0 5px 0;">
          Este orçamento foi gerado automaticamente em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
        <p style="margin: 0;">
          Para dúvidas ou esclarecimentos, entre em contato conosco através dos canais de atendimento.
        </p>
      </div>
    </div>
  `;
};

export const generateTravelQuoteText = (quoteData: TravelQuoteData) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  let quoteText = `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `                🚗 ORÇAMENTO DE VIAGEM TÉCNICA\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n\n`;
  
  quoteText += `🏢 EMPRESA: ${quoteData.companyName}\n`;
  quoteText += `📄 CNPJ: ${quoteData.companyCnpj}\n`;
  quoteText += `📧 Email: ${quoteData.companyEmail}\n`;
  quoteText += `📱 Telefone: ${quoteData.companyPhone}\n`;
  if (quoteData.companyWebsite) quoteText += `🌐 Website: ${quoteData.companyWebsite}\n`;
  quoteText += `\n`;
  
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                        👤 DADOS DO CLIENTE\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `▸ Nome: ${quoteData.clientName}\n`;
  if (quoteData.clientCompany) quoteText += `▸ Empresa: ${quoteData.clientCompany}\n`;
  if (quoteData.clientEmail) quoteText += `▸ Email: ${quoteData.clientEmail}\n`;
  if (quoteData.clientPhone) quoteText += `▸ Telefone: ${quoteData.clientPhone}\n`;
  quoteText += `\n`;

  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                      🗺️ INFORMAÇÕES DA VIAGEM\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `📍 Origem: ${quoteData.origin}\n`;
  quoteText += `🎯 Destinos: ${quoteData.destinations.length}\n`;
  quoteText += `🔄 Tipo: ${quoteData.roundTrip ? 'Ida e Volta' : 'Somente Ida'}\n`;
  quoteText += `📏 Distância Total: ${formatDistance(quoteData.costs.totalDistance)}\n`;
  quoteText += `⏱️ Tempo Total: ${formatDuration(quoteData.costs.totalDuration)}\n\n`;

  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                         💰 CUSTOS DETALHADOS\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  if (quoteData.costs.fuelCost > 0) {
    quoteText += `🛣️ Combustível: ${formatCurrency(quoteData.costs.fuelCost)}\n`;
  }
  if (quoteData.costs.vehicleCost > 0) {
    quoteText += `🚗 Desgaste do Veículo: ${formatCurrency(quoteData.costs.vehicleCost)}\n`;
  }
  if (quoteData.costs.totalTolls > 0) {
    quoteText += `🛣️ Pedágios: ${formatCurrency(quoteData.costs.totalTolls)}\n`;
  }
  if (quoteData.costs.employeeCost > 0) {
    quoteText += `👷 Mão de Obra: ${formatCurrency(quoteData.costs.employeeCost)}\n`;
  }
  if (quoteData.costs.serviceCost > 0) {
    quoteText += `🔧 Serviços: ${formatCurrency(quoteData.costs.serviceCost)}\n`;
  }
  quoteText += `\n`;

  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `💰 VALOR TOTAL: ${formatCurrency(quoteData.costs.totalCost)}\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n\n`;

  quoteText += `📋 Válido por ${quoteData.validityDays} dias\n`;
  quoteText += `📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n`;

  return quoteText;
};