import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalData {
  company: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  client: {
    name: string;
    company?: string;
  };
  proposalNumber: string;
  date: string;
  items: Array<{
    name: string;
    description: string;
    details: string[];
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  summary: {
    subtotal: string;
    discount?: string;
    total: string;
  };
  validity: string;
  paymentCondition: string;
  paymentMethods: string[];
  observations?: string;
}

function extractProposalData(html: string): ProposalData {
  // Função auxiliar para extrair texto de HTML
  const extractText = (pattern: RegExp): string => {
    const match = html.match(pattern);
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : '';
  };

  // Extrair dados da empresa
  const companyName = extractText(/<div class="company-name">(.*?)<\/div>/);
  const companyDetails = html.match(/<div class="company-details">([\s\S]*?)<\/div>/);
  let cnpj = '', address = '', phone = '', email = '', website = '';
  
  if (companyDetails) {
    const detailsText = companyDetails[1];
    const cnpjMatch = detailsText.match(/CNPJ:\s*([^<]+)/);
    const addressMatch = detailsText.match(/Endereço:\s*([^<]+)/);
    const phoneMatch = detailsText.match(/Telefone:\s*([^<]+)/);
    const emailMatch = detailsText.match(/E-mail:\s*([^<]+)/);
    const websiteMatch = detailsText.match(/Site:\s*([^<]+)/);
    
    cnpj = cnpjMatch ? cnpjMatch[1].trim() : '';
    address = addressMatch ? addressMatch[1].trim() : '';
    phone = phoneMatch ? phoneMatch[1].trim() : '';
    email = emailMatch ? emailMatch[1].trim() : '';
    website = websiteMatch ? websiteMatch[1].trim() : '';
  }

  // Extrair dados do cliente
  const clientName = extractText(/<div class="client-name">(.*?)<\/div>/);
  const clientCompanyMatch = html.match(/<div class="client-name">.*?<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
  const clientCompany = clientCompanyMatch ? clientCompanyMatch[1].trim() : '';

  // Extrair número da proposta e data
  const proposalNumber = extractText(/<div class="proposal-value">(.*?)<\/div>/);
  const proposalDate = extractText(/<div class="proposal-date">(.*?)<\/div>/);

  // Extrair itens da tabela
  const items: ProposalData['items'] = [];
  const tableBody = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  
  if (tableBody) {
    const rows = tableBody[1].match(/<tr>([\s\S]*?)<\/tr>/g) || [];
    
    for (const row of rows) {
      const nameMatch = row.match(/<div class="item-name">(.*?)<\/div>/);
      const descMatch = row.match(/<div class="item-description">(.*?)<\/div>/);
      const detailsMatch = row.match(/<li>(.*?)<\/li>/g);
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
      
      if (nameMatch && cells.length >= 5) {
        const details = detailsMatch ? detailsMatch.map(d => d.replace(/<[^>]*>/g, '').trim()) : [];
        const qtdCell = cells[2].replace(/<[^>]*>/g, '').trim();
        const unitPriceCell = cells[3].replace(/<[^>]*>/g, '').trim();
        const totalPriceCell = cells[4].replace(/<[^>]*>/g, '').trim();
        
        items.push({
          name: nameMatch[1].trim(),
          description: descMatch ? descMatch[1].trim() : '',
          details,
          quantity: parseInt(qtdCell) || 1,
          unitPrice: unitPriceCell,
          totalPrice: totalPriceCell
        });
      }
    }
  }

  // Extrair resumo financeiro
  const subtotalMatch = html.match(/class="summary-row subtotal".*?class="summary-value">(.*?)<\/span>/s);
  const discountMatch = html.match(/class="summary-row discount".*?class="summary-value">(.*?)<\/span>/s);
  const totalMatch = html.match(/class="summary-row total".*?class="summary-value">(.*?)<\/span>/s);

  // Extrair validade e condições
  const validityMatch = html.match(/Validade da Proposta.*?class="info-value">(.*?)<\/div>/s);
  const paymentCondMatch = html.match(/Cond\. Pagamento.*?class="info-value">(.*?)<\/div>/s);

  // Extrair formas de pagamento
  const paymentMethods: string[] = [];
  const paymentOptionsMatch = html.match(/<div class="payment-option">(.*?)<\/div>/g);
  if (paymentOptionsMatch) {
    paymentOptionsMatch.forEach(opt => {
      const text = opt.replace(/<[^>]*>/g, '').trim();
      if (text) paymentMethods.push(text);
    });
  }

  // Extrair observações
  const observationsMatch = html.match(/<div class="observations-text">(.*?)<\/div>/s);
  const observations = observationsMatch 
    ? observationsMatch[1].replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '').trim() 
    : undefined;

  return {
    company: {
      name: companyName,
      cnpj,
      address,
      phone,
      email,
      website
    },
    client: {
      name: clientName,
      company: clientCompany
    },
    proposalNumber,
    date: proposalDate,
    items,
    summary: {
      subtotal: subtotalMatch ? subtotalMatch[1].trim() : 'R$ 0,00',
      discount: discountMatch ? discountMatch[1].trim() : undefined,
      total: totalMatch ? totalMatch[1].trim() : 'R$ 0,00'
    },
    validity: validityMatch ? validityMatch[1].trim() : '30 dias',
    paymentCondition: paymentCondMatch ? paymentCondMatch[1].trim() : 'À combinar',
    paymentMethods,
    observations
  };
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  // Remove caracteres de nova linha e substitui por espaços
  const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
  const words = cleanText.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Usa try-catch para evitar erros de codificação
    try {
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Palavra muito longa, força quebra
          lines.push(word);
        }
      }
    } catch (error) {
      // Se houver erro de codificação, adiciona a palavra atual e continua
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

async function htmlToPdfBase64(html: string): Promise<{ success: boolean; pdfBase64?: string; error?: string; detail?: any }> {
  try {
    console.log('[DEBUG PDF] Iniciando conversão HTML para PDF');
    
    // Extrair dados da proposta
    const data = extractProposalData(html);
    console.log('[DEBUG PDF] Dados extraídos:', {
      company: data.company.name,
      client: data.client.name,
      items: data.items.length,
      total: data.summary.total
    });
    
    // Criar documento PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Configurações da página
    const pageWidth = 595; // A4
    const pageHeight = 842;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    
    // Função auxiliar para adicionar nova página se necessário
    const checkNewPage = (requiredSpace: number) => {
      if (y - requiredSpace < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        return true;
      }
      return false;
    };
    
    // Função para desenhar linha
    const drawLine = (y: number) => {
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8)
      });
    };
    
    // CABEÇALHO DA EMPRESA
    page.drawText(data.company.name || 'Araponto', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0.15, 0.38, 0.92) // Azul
    });
    y -= 25;
    
    if (data.company.cnpj) {
      page.drawText(`CNPJ: ${data.company.cnpj}`, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 15;
    }
    
    if (data.company.address) {
      page.drawText(`${data.company.address}`, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 15;
    }
    
    if (data.company.phone || data.company.email) {
      page.drawText(`${data.company.phone} | ${data.company.email}`, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 15;
    }
    
    if (data.company.website) {
      page.drawText(data.company.website, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.15, 0.38, 0.92)
      });
      y -= 15;
    }
    
    y -= 10;
    drawLine(y);
    y -= 20;
    
    // DADOS DO CLIENTE E PROPOSTA
    page.drawText(data.client.name, {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    // Número da proposta (alinhado à direita)
    const proposalText = `Proposta Nº ${data.proposalNumber}`;
    const proposalWidth = helveticaBold.widthOfTextAtSize(proposalText, 14);
    page.drawText(proposalText, {
      x: pageWidth - margin - proposalWidth,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0.15, 0.38, 0.92)
    });
    y -= 20;
    
    if (data.client.company) {
      page.drawText(data.client.company, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
      });
    }
    
    // Data (alinhada à direita)
    const dateWidth = helvetica.widthOfTextAtSize(data.date, 10);
    page.drawText(data.date, {
      x: pageWidth - margin - dateWidth,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4)
    });
    y -= 30;
    
    // INTRODUÇÃO
    const introText = `Apresentamos nossa proposta exclusiva para ${data.client.company || 'sua empresa'}.`;
    const introLines = wrapText(introText, contentWidth, 11, helvetica);
    for (const line of introLines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 11,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3)
      });
      y -= 15;
    }
    y -= 10;
    
    // TABELA DE ITENS
    // Cabeçalho da tabela
    checkNewPage(40);
    page.drawRectangle({
      x: margin,
      y: y - 25,
      width: contentWidth,
      height: 25,
      color: rgb(0.95, 0.95, 0.95)
    });
    
    page.drawText('Descrição', {
      x: margin + 5,
      y: y - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    page.drawText('Qtd', {
      x: margin + 350,
      y: y - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    page.drawText('Valor Unit.', {
      x: margin + 400,
      y: y - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    page.drawText('Total', {
      x: margin + 470,
      y: y - 18,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    y -= 35;
    
    // Itens da tabela
    for (const item of data.items) {
      checkNewPage(60);
      
      // Nome do item
      page.drawText(item.name, {
        x: margin + 5,
        y,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      y -= 15;
      
      // Descrição
      if (item.description) {
        const descLines = wrapText(item.description, 340, 9, helvetica);
        for (const line of descLines) {
          page.drawText(line, {
            x: margin + 5,
            y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4)
          });
          y -= 12;
        }
      }
      
      // Detalhes
      for (const detail of item.details) {
        const detailLines = wrapText(`• ${detail}`, 340, 9, helvetica);
        for (const line of detailLines) {
          page.drawText(line, {
            x: margin + 10,
            y,
            size: 9,
            font: helvetica,
            color: rgb(0.5, 0.5, 0.5)
          });
          y -= 12;
        }
      }
      
      // Valores (posicionados na mesma linha do nome)
      const itemY = y + 15 + (item.description ? 15 : 0) + (item.details.length * 12);
      
      page.drawText(item.quantity.toString(), {
        x: margin + 360,
        y: itemY,
        size: 10,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      page.drawText(item.unitPrice, {
        x: margin + 400,
        y: itemY,
        size: 10,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      page.drawText(item.totalPrice, {
        x: margin + 470,
        y: itemY,
        size: 10,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      
      y -= 15;
      drawLine(y + 5);
      y -= 10;
    }
    
    // RESUMO FINANCEIRO
    checkNewPage(100);
    y -= 10;
    
    // Subtotal
    page.drawText('Subtotal:', {
      x: margin + 380,
      y,
      size: 11,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4)
    });
    page.drawText(data.summary.subtotal, {
      x: margin + 470,
      y,
      size: 11,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3)
    });
    y -= 20;
    
    // Desconto (se houver)
    if (data.summary.discount) {
      page.drawText('Desconto:', {
        x: margin + 380,
        y,
        size: 11,
        font: helvetica,
        color: rgb(0.05, 0.59, 0.41) // Verde
      });
      page.drawText(data.summary.discount, {
        x: margin + 470,
        y,
        size: 11,
        font: helvetica,
        color: rgb(0.05, 0.59, 0.41)
      });
      y -= 20;
    }
    
    // Total
    drawLine(y + 5);
    y -= 5;
    page.drawText('TOTAL:', {
      x: margin + 380,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1)
    });
    page.drawText(data.summary.total, {
      x: margin + 450,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0.15, 0.38, 0.92)
    });
    y -= 30;
    
    // OBSERVAÇÕES
    if (data.observations) {
      checkNewPage(80);
      page.drawRectangle({
        x: margin,
        y: y - 60,
        width: contentWidth,
        height: 60,
        color: rgb(1, 0.95, 0.78),
        borderColor: rgb(0.96, 0.62, 0.04),
        borderWidth: 1
      });
      
      page.drawText('Observações:', {
        x: margin + 10,
        y: y - 20,
        size: 10,
        font: helveticaBold,
        color: rgb(0.57, 0.25, 0.05)
      });
      
      const obsLines = wrapText(data.observations, contentWidth - 20, 9, helvetica);
      let obsY = y - 35;
      for (const line of obsLines) {
        if (obsY < y - 55) break; // Limitar ao espaço do retângulo
        page.drawText(line, {
          x: margin + 10,
          y: obsY,
          size: 9,
          font: helvetica,
          color: rgb(0.47, 0.21, 0.04)
        });
        obsY -= 12;
      }
      y -= 70;
    }
    
    // INFORMAÇÕES ADICIONAIS
    checkNewPage(80);
    y -= 10;
    
    // Validade
    page.drawText('Validade da Proposta:', {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText(data.validity, {
      x: margin + 120,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.15, 0.38, 0.92)
    });
    
    // Condição de pagamento
    page.drawText('Condição de Pagamento:', {
      x: margin + 250,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    page.drawText(data.paymentCondition, {
      x: margin + 380,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.15, 0.38, 0.92)
    });
    y -= 25;
    
    // Formas de pagamento
    page.drawText('Formas de Pagamento:', {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3)
    });
    y -= 15;
    
    for (const method of data.paymentMethods) {
      page.drawText(method, {
        x: margin + 10,
        y,
        size: 9,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 12;
    }
    
    // ASSINATURAS
    checkNewPage(100);
    y = Math.min(y - 30, 150); // Posicionar assinaturas no final da página
    
    // Linha de assinatura do cliente
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 200, y },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6)
    });
    page.drawText('Assinatura do Cliente', {
      x: margin + 50,
      y: y - 15,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Linha de assinatura da empresa
    page.drawLine({
      start: { x: pageWidth - margin - 200, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6)
    });
    page.drawText('Assinatura da Empresa', {
      x: pageWidth - margin - 150,
      y: y - 15,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // RODAPÉ
    const footerText = `Documento gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const footerWidth = helvetica.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (pageWidth - footerWidth) / 2,
      y: 30,
      size: 8,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6)
    });
    
    // Adicionar informações de contato no rodapé
    if (data.company.email || data.company.phone) {
      const contactText = `Para verificar a autenticidade desta proposta, entre em contato conosco.`;
      const contactWidth = helvetica.widthOfTextAtSize(contactText, 8);
      page.drawText(contactText, {
        x: (pageWidth - contactWidth) / 2,
        y: 20,
        size: 8,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6)
      });
      
      const contactInfo = `${data.company.name} ${data.company.email ? `${data.company.email} |` : ''} ${data.company.phone || ''} ${data.company.website ? `| ${data.company.website}` : ''}`;
      const contactInfoWidth = helvetica.widthOfTextAtSize(contactInfo, 8);
      page.drawText(contactInfo, {
        x: (pageWidth - contactInfoWidth) / 2,
        y: 10,
        size: 8,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6)
      });
    }
    
    // Gerar PDF
    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    
    console.log('[DEBUG PDF] PDF gerado com sucesso!');
    console.log('[DEBUG PDF] Tamanho:', pdfBytes.length, 'bytes');
    
    return { success: true, pdfBase64: base64 };
    
  } catch (error) {
    console.error('[ERROR PDF] Erro na geração:', error);
    return { 
      success: false, 
      error: `Erro interno: ${error.message}`,
      detail: {
        name: error.constructor.name,
        message: error.message,
        stack: error.stack
      }
    };
  }
}

serve(async (req) => {
  console.log('🚀 Edge Function html-to-pdf chamada');
  console.log('📍 Método:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html } = await req.json();
    
    if (!html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'HTML é obrigatório'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔄 Iniciando conversão HTML para PDF...');
    const result = await htmlToPdfBase64(html);
    
    if (result.success) {
      console.log('✅ PDF gerado com sucesso');
      return new Response(
        JSON.stringify({ 
          success: true, 
          pdfBase64: result.pdfBase64 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('❌ Erro na geração:', result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          detail: result.detail
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro interno: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});