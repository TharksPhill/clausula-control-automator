import { supabase } from '@/integrations/supabase/client';

export interface QuoteData {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  selectedPlan: any;
  planPeriod: 'monthly' | 'semestral' | 'annual';
  selectedAddons: any[];
  systemName: string;
  systemDescription: string;
  introduction: string;
  validityDays: number;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
  };
  hasFreeTrial?: boolean;
  freeTrialDays?: number;
  paymentStartDate?: Date | null;
  companyProfile?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    cnpj?: string;
    logo?: string;
    website?: string;
  };
}

export const generateQuotePDF = async (quoteData: QuoteData) => {
  try {
    console.log('=== GERANDO PDF ===');
    console.log('Dados do orçamento:', {
      clientName: quoteData.clientName,
      selectedPlan: quoteData.selectedPlan,
      hasFreeTrial: quoteData.hasFreeTrial,
      freeTrialDays: quoteData.freeTrialDays,
      paymentStartDate: quoteData.paymentStartDate,
      introduction: quoteData.introduction,
      selectedAddons: quoteData.selectedAddons
    });
    
    // Log específico para verificar features
    if (quoteData.selectedPlan) {
      console.log('Features do plano no PDF:', quoteData.selectedPlan.features);
      console.log('Tipo de features:', Array.isArray(quoteData.selectedPlan.features) ? 'Array' : typeof quoteData.selectedPlan.features);
    }
    
    // Fetch company profile data
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', (await supabase.auth.getSession()).data.session?.user?.id)
      .single();
    
    const quoteDataWithCompany = {
      ...quoteData,
      companyProfile: companyData ? {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        cnpj: companyData.cnpj,
        logo: companyData.logo,
        website: companyData.website
      } : undefined
    };

    // Generate quote HTML content
    const quoteHtml = generateQuoteHTML(quoteDataWithCompany);
    
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
    const filename = `orcamento-${quoteData.clientName.replace(/\s/g, '_')}-${Date.now()}.pdf`;
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
    throw new Error('Erro ao gerar PDF do orçamento');
  }
};

const generateQuoteHTML = (quoteData: QuoteData) => {
  console.log('=== INICIANDO GERAÇÃO DO HTML DO PDF ===');
  console.log('Features do plano:', quoteData.selectedPlan?.features);
  console.log('Timestamp:', new Date().toISOString());
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const calculatePlanPrice = () => {
    if (!quoteData.selectedPlan) return 0;
    
    switch (quoteData.planPeriod) {
      case 'semestral':
        return quoteData.selectedPlan.semestral_price;
      case 'annual':
        return quoteData.selectedPlan.annual_price;
      default:
        return quoteData.selectedPlan.monthly_price;
    }
  };

  const calculateAddonsTotal = () => {
    const periodMultiplier = getPlanPeriodMultiplier();
    return quoteData.selectedAddons.reduce((total, { addon, quantity }) => {
      // Calcular o total baseado no tipo de precificação
      if (addon.pricing_type === 'package' && addon.package_ranges && addon.package_ranges.length > 0) {
        const sortedRanges = [...addon.package_ranges].sort((a: any, b: any) => a.min - b.min);
        const range = sortedRanges.find((r: any) => quantity >= r.min && quantity <= r.max) || 
                     sortedRanges[sortedRanges.length - 1];
        if (range) {
          return total + (range.price * periodMultiplier);
        }
      }
      return total + (addon.price_per_unit * quantity * periodMultiplier);
    }, 0);
  };

  const getSubtotal = () => {
    return calculatePlanPrice() + calculateAddonsTotal();
  };

  const calculateDiscount = () => {
    const subtotal = getSubtotal();
    if (quoteData.discount.value <= 0) return 0;

    if (quoteData.discount.type === 'percentage') {
      return subtotal * (quoteData.discount.value / 100);
    } else {
      return Math.min(quoteData.discount.value, subtotal);
    }
  };

  const getTotalValue = () => {
    return getSubtotal() - calculateDiscount();
  };

  const getPlanPeriodMultiplier = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  };

  const getPeriodLabel = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 'Semestral (6 meses)';
      case 'annual': return 'Anual (12 meses)';
      default: return 'Mensal';
    }
  };

  // Professional business proposal design
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #2c3e50;
          line-height: 1.5;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }
        
        .company-left {
          flex: 1;
        }
        
        .company-logo {
          height: 60px;
          width: auto;
          object-fit: contain;
          margin-bottom: 10px;
        }
        
        .company-right {
          text-align: right;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 4px;
        }
        
        .company-details {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.4;
        }
        
        /* Proposal Header */
        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        
        .client-name {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .proposal-number {
          text-align: right;
        }
        
        .proposal-label {
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .proposal-value {
          font-size: 20px;
          font-weight: 700;
          color: #2563eb;
        }
        
        .proposal-date {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }
        
        /* Intro Text */
        .intro-text {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 20px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 4px;
        }
        
        /* Table */
        .items-table {
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        
        .items-table thead {
          background: #f3f4f6;
        }
        
        .items-table th {
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .items-table th.text-right,
        .items-table td.text-right {
          text-align: right;
        }
        
        .items-table th.text-center,
        .items-table td.text-center {
          text-align: center;
        }
        
        .items-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .items-table td {
          padding: 12px;
          font-size: 12px;
          color: #374151;
        }
        
        .item-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }
        
        .item-description {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.3;
        }
        
        .item-details {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.4;
        }
        
        .item-details li {
          margin-left: 15px;
          margin-bottom: 2px;
        }
        
        /* Summary */
        .summary-section {
          margin-top: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 13px;
        }
        
        .summary-row.subtotal {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 8px;
        }
        
        .summary-row.discount {
          color: #059669;
        }
        
        .summary-row.total {
          border-top: 2px solid #2563eb;
          padding-top: 12px;
          margin-top: 8px;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .summary-label {
          color: #6b7280;
        }
        
        .summary-value {
          font-weight: 600;
          color: #1f2937;
        }
        
        /* Observations */
        .observations {
          margin-top: 30px;
          padding: 15px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }
        
        .observations-title {
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        
        .observations-text {
          font-size: 11px;
          color: #78350f;
          line-height: 1.5;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 25px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .info-item {
          text-align: center;
        }
        
        .info-label {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
        }
        
        /* Payment Methods */
        .payment-methods {
          margin-top: 25px;
          padding: 15px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }
        
        .payment-title {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
        }
        
        .payment-options {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .payment-option {
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 11px;
          color: #4b5563;
        }
        
        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 30px;
        }
        
        .signature-line {
          width: 200px;
          border-bottom: 1px solid #9ca3af;
          padding-bottom: 40px;
        }
        
        .signature-label {
          font-size: 10px;
          color: #6b7280;
          text-align: center;
          margin-top: 5px;
        }
        
        .footer-text {
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          line-height: 1.4;
        }
        
        .footer-company {
          text-align: center;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-company-name {
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 4px;
        }
        
        .footer-contact {
          font-size: 10px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-left">
            ${quoteData.companyProfile?.logo ? `
              <img src="${quoteData.companyProfile.logo}" alt="Logo" class="company-logo" />
            ` : ''}
          </div>
          <div class="company-right">
            <div class="company-name">${quoteData.companyProfile?.name || 'Sua empresa'}</div>
            <div class="company-details">
              ${quoteData.companyProfile?.cnpj ? `CNPJ: ${quoteData.companyProfile.cnpj}<br>` : ''}
              ${quoteData.companyProfile?.address || 'Endereço'}<br>
              ${quoteData.companyProfile?.phone || 'Telefone'}<br>
              ${quoteData.companyProfile?.email || 'email@empresa.com'}
            </div>
          </div>
        </div>
        
        <!-- Proposal Header -->
        <div class="proposal-header">
          <div>
            <div class="client-name">${quoteData.clientName}</div>
            ${quoteData.clientCompany ? `<div style="font-size: 12px; color: #6b7280;">${quoteData.clientCompany}</div>` : ''}
          </div>
          <div class="proposal-number">
            <div class="proposal-label">Proposta Nº</div>
            <div class="proposal-value">${Date.now().toString().slice(-6)}</div>
            <div class="proposal-date">${formatDate(new Date())}</div>
          </div>
        </div>
        
        <!-- Intro Text -->
        <div class="intro-text">
          <strong>${quoteData.introduction}</strong>
          ${quoteData.systemDescription ? `<br><br><strong>Solução:</strong> ${quoteData.systemDescription}` : ''}
        </div>
        
        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 28%;">Descrição</th>
              <th style="width: 22%;">Funcionalidades</th>
              <th class="text-center" style="width: 8%;">Qtd</th>
              <th class="text-right" style="width: 20%;">Valor Unit.</th>
              <th class="text-right" style="width: 22%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quoteData.selectedPlan ? `
              <tr>
                <td>
                  <div class="item-name">${quoteData.selectedPlan.name}</div>
                  <div class="item-description">Plano ${getPeriodLabel()}</div>
                  <div style="margin-top: 8px;">
                    <ul class="item-details">
                      <li>Até ${quoteData.selectedPlan.employee_range} funcionários</li>
                      <li>Período: ${getPeriodLabel()}</li>
                      ${quoteData.selectedPlan.allowed_cnpjs ? `<li>${quoteData.selectedPlan.allowed_cnpjs} CNPJ(s) incluído(s)</li>` : ''}
                    </ul>
                  </div>
                </td>
                <td>
                  ${quoteData.selectedPlan.features && Array.isArray(quoteData.selectedPlan.features) && quoteData.selectedPlan.features.length > 0 ? 
                    `<ul class="item-details">
                      ${quoteData.selectedPlan.features.map((feature: string) => `<li>• ${feature}</li>`).join('')}
                    </ul>` : 
                    '<span style="color: #9ca3af; font-style: italic;">-</span>'
                  }
                </td>
                <td class="text-center">1</td>
                <td class="text-right">${formatCurrency(calculatePlanPrice())}</td>
                <td class="text-right"><strong>${formatCurrency(calculatePlanPrice())}</strong></td>
              </tr>
            ` : ''}
            
            ${quoteData.selectedAddons.map(({ addon, quantity }) => {
              const periodMultiplier = getPlanPeriodMultiplier();
              let unitPrice = 0;
              let totalPrice = 0;
              
              if (addon.pricing_type === 'package' && addon.package_ranges && addon.package_ranges.length > 0) {
                const sortedRanges = [...addon.package_ranges].sort((a: any, b: any) => a.min - b.min);
                const range = sortedRanges.find((r: any) => quantity >= r.min && quantity <= r.max) || 
                             sortedRanges[sortedRanges.length - 1];
                if (range) {
                  unitPrice = range.price;
                  totalPrice = range.price * periodMultiplier;
                }
              } else {
                unitPrice = addon.price_per_unit;
                totalPrice = addon.price_per_unit * quantity * periodMultiplier;
              }
              
              return `
                <tr>
                  <td>
                    <div class="item-name">${addon.name}</div>
                    <div class="item-description">${addon.description}</div>
                    <div style="margin-top: 8px;">
                      <div class="item-details">
                        ${addon.pricing_type === 'package' ? 
                          `Pacote de ${addon.package_increment || quantity} ${addon.unit_type}s` :
                          `Por ${addon.unit_type}`
                        }
                      </div>
                    </div>
                  </td>
                  <td>
                    ${addon.features && Array.isArray(addon.features) && addon.features.length > 0 ? 
                      `<ul class="item-details">
                        ${addon.features.map((feature: string) => `<li>• ${feature}</li>`).join('')}
                      </ul>` : 
                      '<span style="color: #9ca3af; font-style: italic;">-</span>'
                    }
                  </td>
                  <td class="text-center">${quantity}</td>
                  <td class="text-right">${formatCurrency(unitPrice)}</td>
                  <td class="text-right"><strong>${formatCurrency(totalPrice)}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <!-- Summary -->
        <div class="summary-section">
          <div class="summary-row subtotal">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">${formatCurrency(getSubtotal())}</span>
          </div>
          
          ${quoteData.discount.value > 0 ? `
            <div class="summary-row discount">
              <span class="summary-label">
                Desconto
                ${quoteData.discount.type === 'percentage' ? `(${quoteData.discount.value}%)` : ''}
                ${quoteData.discount.description ? `- ${quoteData.discount.description}` : ''}
              </span>
              <span class="summary-value">-${formatCurrency(calculateDiscount())}</span>
            </div>
          ` : ''}
          
          <div class="summary-row total">
            <span>TOTAL</span>
            <span>${formatCurrency(getTotalValue())}</span>
          </div>
        </div>
        
        <!-- Observations -->
        <div class="observations">
          <div class="observations-title">Observações da Proposta</div>
          <div class="observations-text">
            ${quoteData.hasFreeTrial && quoteData.freeTrialDays && quoteData.freeTrialDays > 0 ? `
              • <strong>TESTE GRÁTIS:</strong> ${quoteData.freeTrialDays} dias de teste sem compromisso<br>
              • <strong>Início do pagamento:</strong> ${quoteData.paymentStartDate ? formatDate(quoteData.paymentStartDate instanceof Date ? quoteData.paymentStartDate : new Date(quoteData.paymentStartDate)) : 'Após período de teste'}<br>
            ` : `
              • <strong>Início do pagamento:</strong> ${formatDate(new Date())}<br>
            `}
            • Esta proposta é válida por ${quoteData.validityDays} dias a partir da data de emissão<br>
            • Os valores estão sujeitos a alteração sem aviso prévio após o vencimento
          </div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Vendedor</div>
            <div class="info-value">${quoteData.companyProfile?.name || 'Consultor'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Validade da Proposta</div>
            <div class="info-value">${quoteData.validityDays} dias</div>
          </div>
          <div class="info-item">
            <div class="info-label">Condição de Pagamento</div>
            <div class="info-value">
              ${quoteData.hasFreeTrial && quoteData.freeTrialDays && quoteData.freeTrialDays > 0 ? 
                `${quoteData.freeTrialDays} dias grátis` : 
                'À combinar'
              }
            </div>
          </div>
        </div>
        
        <!-- Payment Methods -->
        <div class="payment-methods">
          <div class="payment-title">Formas de Pagamento</div>
          <div class="payment-options">
            <div class="payment-option">• Boleto Bancário</div>
            <div class="payment-option">• Pix</div>
            <div class="payment-option">• Cartão de Crédito (até 12x)</div>
            <div class="payment-option">• Transferência Bancária</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="signature-section">
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura do Cliente</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura da Empresa</div>
            </div>
          </div>
          
          <div class="footer-text">
            Este documento foi gerado eletronicamente em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}<br>
            Para verificar a autenticidade desta proposta, entre em contato conosco.
          </div>
          
          <div class="footer-company">
            <div class="footer-company-name">${quoteData.companyProfile?.name || 'Sua Empresa'}</div>
            <div class="footer-contact">
              ${quoteData.companyProfile?.email || 'contato@empresa.com'} | 
              ${quoteData.companyProfile?.phone || '(00) 0000-0000'} | 
              ${quoteData.companyProfile?.website || 'www.empresa.com'}
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateQuoteText = (quoteData: QuoteData) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculatePlanPrice = () => {
    if (!quoteData.selectedPlan) return 0;
    
    switch (quoteData.planPeriod) {
      case 'semestral':
        return quoteData.selectedPlan.semestral_price;
      case 'annual':
        return quoteData.selectedPlan.annual_price;
      default:
        return quoteData.selectedPlan.monthly_price;
    }
  };

  const calculateAddonsTotal = () => {
    const periodMultiplier = getPlanPeriodMultiplier();
    return quoteData.selectedAddons.reduce((total, { addon, quantity }) => {
      return total + (addon.price_per_unit * quantity * periodMultiplier);
    }, 0);
  };

  const getSubtotal = () => {
    return calculatePlanPrice() + calculateAddonsTotal();
  };

  const calculateDiscount = () => {
    const subtotal = getSubtotal();
    if (quoteData.discount.value <= 0) return 0;

    if (quoteData.discount.type === 'percentage') {
      return subtotal * (quoteData.discount.value / 100);
    } else {
      return Math.min(quoteData.discount.value, subtotal);
    }
  };

  const getTotalValue = () => {
    return getSubtotal() - calculateDiscount();
  };

  const getPlanPeriodMultiplier = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  };

  const getPeriodLabel = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 'Semestral (6 meses)';
      case 'annual': return 'Anual (12 meses)';
      default: return 'Mensal';
    }
  };

  let quoteText = `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `                    📋 ORÇAMENTO - ${quoteData.systemName}\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n\n`;
  
  quoteText += `🏢 EMPRESA: RHiD & iDSecure\n`;
  quoteText += `📧 Email: contato@araponto.com\n`;
  quoteText += `📱 Telefone: (16) 99232-6766\n`;
  quoteText += `🌐 Website: www.araponto.com\n\n`;
  
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                        👤 DADOS DO CLIENTE\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `▸ Nome: ${quoteData.clientName}\n`;
  if (quoteData.clientCompany) quoteText += `▸ Empresa: ${quoteData.clientCompany}\n`;
  if (quoteData.clientEmail) quoteText += `▸ Email: ${quoteData.clientEmail}\n`;
  if (quoteData.clientPhone) quoteText += `▸ Telefone: ${quoteData.clientPhone}\n`;
  quoteText += `\n`;

  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                      📄 INTRODUÇÃO DA PROPOSTA\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `${quoteData.introduction}\n\n`;

  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                          🖥️ SISTEMA\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `▸ Sistema: ${quoteData.systemName}\n`;
  quoteText += `▸ Descrição: ${quoteData.systemDescription}\n\n`;
  
  if (quoteData.selectedPlan) {
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteText += `                        📦 PLANO SELECIONADO\n`;
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteText += `▸ Plano: ${quoteData.selectedPlan.name}\n`;
    quoteText += `▸ Funcionários: ${quoteData.selectedPlan.employee_range}\n`;
    quoteText += `▸ Período: ${getPeriodLabel()}\n`;
    quoteText += `▸ Valor: ${formatCurrency(calculatePlanPrice())}\n`;
    
    if (quoteData.selectedPlan.features && quoteData.selectedPlan.features.length > 0) {
      quoteText += `\n📌 Funcionalidades incluídas:\n`;
      quoteData.selectedPlan.features.forEach((feature: string) => {
        quoteText += `  • ${feature}\n`;
      });
    }
    quoteText += `\n`;
  }
  
  if (quoteData.selectedAddons.length > 0) {
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteText += `                          🔧 ADICIONAIS\n`;
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteData.selectedAddons.forEach(({ addon, quantity }) => {
      const periodMultiplier = getPlanPeriodMultiplier();
      const addonTotalPeriod = addon.price_per_unit * quantity * periodMultiplier;
      quoteText += `▸ ${addon.name}\n`;
      quoteText += `  Quantidade: ${quantity}x por ${periodMultiplier === 1 ? 'mês' : periodMultiplier + ' meses'}\n`;
      quoteText += `  Valor: ${formatCurrency(addonTotalPeriod)}\n\n`;
    });
    quoteText += `💰 Total dos Adicionais: ${formatCurrency(calculateAddonsTotal())}\n\n`;
  }
  
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `                        💰 RESUMO FINANCEIRO\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `▸ Subtotal: ${formatCurrency(getSubtotal())}\n`;
  
  if (quoteData.discount.value > 0) {
    quoteText += `▸ Desconto`;
    if (quoteData.discount.description) {
      quoteText += ` (${quoteData.discount.description})`;
    }
    if (quoteData.discount.type === 'percentage') {
      quoteText += ` ${quoteData.discount.value}%`;
    }
    quoteText += `: -${formatCurrency(calculateDiscount())}\n`;
  }
  
  quoteText += `\n💵 VALOR TOTAL (${getPeriodLabel()}): ${formatCurrency(getTotalValue())}\n`;
  
  if (quoteData.planPeriod !== 'monthly') {
    quoteText += `📊 Equivale a ${formatCurrency(getTotalValue() / getPlanPeriodMultiplier())} por mês\n`;
  }
  
  quoteText += `\n───────────────────────────────────────────────────────────────\n`;
  quoteText += `                    ⚠️ INFORMAÇÕES IMPORTANTES\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  if (quoteData.hasFreeTrial && quoteData.freeTrialDays) {
    quoteText += `🎁 TESTE GRÁTIS: ${quoteData.freeTrialDays} dias sem compromisso\n`;
    if (quoteData.paymentStartDate) {
      const paymentDate = new Date(quoteData.paymentStartDate);
      quoteText += `📅 Início do pagamento: ${paymentDate.toLocaleDateString('pt-BR')}\n`;
    }
  }
  quoteText += `▸ Validade: ${quoteData.validityDays} dias\n`;
  quoteText += `▸ Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
  quoteText += `▸ Valores sujeitos a alteração sem aviso prévio\n`;
  quoteText += `▸ Proposta comercial sem valor fiscal\n`;
  quoteText += `▸ Condições especiais mediante negociação\n\n`;
  
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `              RHiD & iDSecure - Sistema Completo\n`;
  quoteText += `         Para dúvidas: contato@araponto.com | (16) 99232-6766\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  
  return quoteText;
};
