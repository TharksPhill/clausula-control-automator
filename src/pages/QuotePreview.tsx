
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSignWellIntegration } from "@/hooks/useSignWellIntegration";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Mail, 
  Phone,
  CheckCircle2,
  Copy,
  FileSignature
} from "lucide-react";
import { Quote } from "@/types/quotes";
import BackButton from "@/components/BackButton";


const QuotePreview = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingToSignWell, setIsSendingToSignWell] = useState(false);
  
  // Hook do SignWell
  const { sendPdfForSignature, isConfigured: isSignWellConfigured } = useSignWellIntegration();

  // Buscar dados do orçamento
  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) throw error;
      return data as Quote;
    },
    enabled: !!quoteId
  });

  // Buscar dados da empresa
  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Buscar dados do plano selecionado
  const { data: selectedPlan } = useQuery({
    queryKey: ['plan', quote?.selected_plan_id],
    queryFn: async () => {
      if (!quote?.selected_plan_id) return null;
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', quote.selected_plan_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!quote?.selected_plan_id
  });

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !quote) {
      console.error("❌ Falha: contentRef ou quote não disponível");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Generate the HTML content for the quote
      const element = contentRef.current;
      const htmlContent = element.outerHTML;

      console.log("🚀 Enviando HTML do orçamento para Edge Function...");
      console.log("📄 Tamanho do HTML:", htmlContent.length, "caracteres");
      console.log("📄 Preview do HTML:", htmlContent.substring(0, 500) + "...");
      
      // Call the html-to-pdf edge function
      const { data, error } = await supabase.functions.invoke('html-to-pdf', {
        body: { html: htmlContent }
      });

      console.log("📦 Resposta da Edge Function:", { data, error });

      if (error) {
        console.error("❌ Erro na Edge Function:", error);
        console.error("❌ Detalhes completos do erro:", JSON.stringify(error, null, 2));
        
        const errorMsg = error.message || 'Erro desconhecido na Edge Function';
        toast({
          title: "Erro na Edge Function",
          description: `Erro na conversão HTML para PDF: ${errorMsg}`,
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        console.error("❌ Falha na geração do PDF:", data);
        
        const errorMsg = data?.error || 'Resposta inválida do servidor';
        const statusCode = data?.detail?.status || data?.detail?.step || 'desconhecido';
        
        // Mensagens específicas baseadas no tipo de erro
        let userMessage = `Erro ao gerar PDF: ${errorMsg}`;
        if (statusCode.includes('api_key')) {
          userMessage = `Erro de configuração: API Key do PDFShift não encontrada ou inválida. Verifique as configurações.`;
        } else if (statusCode.includes('test_failed')) {
          userMessage = `Erro na validação da API key: ${errorMsg}. Verifique se a chave está correta.`;
        } else if (statusCode === 401 || statusCode === '401') {
          userMessage = `Erro de autenticação: Chave de API inválida ou expirada.`;
        } else if (statusCode === 429 || statusCode === '429') {
          userMessage = `Erro de limite: Muitas requisições. Tente novamente em alguns minutos.`;
        } else if (statusCode.includes('not_found')) {
          userMessage = `Erro: API Key não encontrada. Configure a chave PDFShift nas configurações.`;
        }
        
        toast({
          title: "Erro ao gerar PDF",
          description: `${userMessage} (${statusCode})`,
          variant: "destructive",
        });
        return;
      }

      if (!data?.pdfBase64 || data.pdfBase64.trim() === '') {
        console.error("❌ PDF Base64 vazio ou inválido:", data);
        toast({
          title: "Erro na geração",
          description: "PDF gerado está vazio ou inválido",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ PDF gerado com sucesso - Base64 length:", data.pdfBase64.length);

      // Create download link and trigger download
      const filename = `orcamento-${quote.quote_number}.pdf`;
      const dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
      
      console.log("🔗 Criando link de download:", { filename, dataUrlLength: dataUrl.length });
      
      try {
        // Create temporary link element for download
        const link = document.createElement('a');
        
        // Validate the base64 data
        if (!data.pdfBase64 || data.pdfBase64.length < 100) {
          throw new Error('Base64 inválido ou muito pequeno');
        }
        
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        
        console.log("📎 Adicionando link ao DOM e disparando click...");
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        
        // Force a small delay to ensure the link is properly attached
        setTimeout(() => {
          try {
            link.click();
            console.log("✅ Click disparado com sucesso");
            
            // Remove link after a short delay
            setTimeout(() => {
              if (document.body.contains(link)) {
                document.body.removeChild(link);
                console.log("🗑️ Link removido do DOM");
              }
            }, 100);
            
          } catch (clickError) {
            console.error("❌ Erro ao disparar click:", clickError);
            
            // Fallback: try using window.open
            try {
              console.log("🔄 Tentando fallback com window.open...");
              const newWindow = window.open(dataUrl, '_blank');
              if (!newWindow) {
                throw new Error('Popup bloqueado');
              }
            } catch (fallbackError) {
              console.error("❌ Fallback falhou:", fallbackError);
              throw new Error('Não foi possível iniciar o download. Verifique se popups estão habilitados.');
            }
          }
        }, 10);
        
      } catch (linkError) {
        console.error("❌ Erro na criação/disparo do link:", linkError);
        throw linkError;
      }
      
      toast({
        title: "Sucesso!",
        description: "PDF gerado e download iniciado.",
      });
      
    } catch (error) {
      console.error('❌ Erro completo ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!quote) return;

    setIsGeneratingLink(true);
    try {
      const { data: token, error } = await supabase
        .rpc('generate_quote_access_token', { p_quote_id: quote.id });

      if (error) throw error;

      const shareUrl = `${window.location.origin}/quote-public/${token}`;
      
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link copiado!",
        description: "O link de compartilhamento foi copiado para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar link de compartilhamento.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSendToSignWell = async () => {
    if (!contentRef.current || !quote) {
      console.error("❌ Falha: contentRef ou quote não disponível");
      return;
    }

    setIsSendingToSignWell(true);
    try {
      // Primeiro, gerar o PDF
      console.log("🚀 Gerando PDF para envio ao SignWell...");
      const element = contentRef.current;
      const htmlContent = element.outerHTML;
      
      // Chamar a função html-to-pdf
      const { data, error } = await supabase.functions.invoke('html-to-pdf', {
        body: { html: htmlContent }
      });

      if (error) {
        console.error("❌ Erro na geração do PDF:", error);
        toast({
          title: "Erro na Geração do PDF",
          description: "Erro ao gerar PDF para o SignWell",
          variant: "destructive",
        });
        return;
      }

      if (!data?.success || !data?.pdfBase64) {
        console.error("❌ PDF não gerado corretamente:", data);
        toast({
          title: "Erro na Geração",
          description: "PDF não foi gerado corretamente",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ PDF gerado, enviando para SignWell...");
      
      // Enviar para o SignWell
      const result = await sendPdfForSignature(data.pdfBase64, quote.quote_number);
      
      if (result) {
        toast({
          title: "Sucesso!",
          description: `Orçamento enviado para assinatura no SignWell. ID: ${result.document_id}`,
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar para SignWell:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar para SignWell. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingToSignWell(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Carregando orçamento...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Orçamento não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header com ações */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              Orçamento {quote.quote_number}
            </h1>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? "Gerando..." : "Baixar PDF"}
            </Button>
            
            <Button
              onClick={handleGenerateShareLink}
              disabled={isGeneratingLink}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4" />
              {isGeneratingLink ? "Gerando..." : "Compartilhar"}
            </Button>

            {isSignWellConfigured && (
              <Button
                onClick={handleSendToSignWell}
                disabled={isSendingToSignWell || isGeneratingPdf}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <FileSignature className="w-4 h-4" />
                {isSendingToSignWell ? "Enviando..." : "Enviar para SignWell"}
              </Button>
            )}
          </div>
        </div>

        {/* Conteúdo do orçamento */}
        <div ref={contentRef} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* Cabeçalho da empresa */}
          {company && (
            <div className="border-b pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                  <p className="text-gray-600 mt-1">{company.address}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {company.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </span>
                  </div>
                </div>
                {company.logo && (
                  <img src={company.logo} alt="Logo" className="h-16 w-auto" />
                )}
              </div>
            </div>
          )}

          {/* Informações do orçamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Informações do Orçamento
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número:</span>
                  <span className="font-medium">{quote.quote_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação:</span>
                  <span className="font-medium">
                    {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Válido até:</span>
                  <span className="font-medium">
                    {quote.expires_at 
                      ? new Date(quote.expires_at).toLocaleDateString('pt-BR')
                      : 'Não especificado'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={quote.status === 'draft' ? 'secondary' : 'default'}>
                    {quote.status === 'draft' ? 'Rascunho' : quote.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Informações do cliente */}
            {(quote.client_name || quote.client_company) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informações do Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  {quote.client_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{quote.client_name}</span>
                    </div>
                  )}
                  {quote.client_company && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>{quote.client_company}</span>
                    </div>
                  )}
                  {quote.client_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{quote.client_email}</span>
                    </div>
                  )}
                  {quote.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{quote.client_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Informações do sistema */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {quote.system_name}
            </h3>
            {quote.system_description && (
              <p className="text-gray-700 mb-6 leading-relaxed">
                {quote.system_description}
              </p>
            )}
          </div>

          {/* Funcionalidades */}
          {quote.features && quote.features.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Funcionalidades Incluídas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quote.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações do plano */}
          {selectedPlan && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Plano de Serviço
              </h4>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h5 className="font-bold text-blue-900 text-lg">{selectedPlan.name}</h5>
                <p className="text-blue-700 mt-1 mb-4">
                  Para empresas com {selectedPlan.employee_range} funcionários
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedPlan.monthly_price)}
                    </div>
                    <div className="text-sm text-gray-600">Mensal</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedPlan.semestral_price)}
                    </div>
                    <div className="text-sm text-gray-600">Semestral</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(selectedPlan.annual_price)}
                    </div>
                    <div className="text-sm text-gray-600">Anual</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {quote.notes && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Observações
              </h4>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Rodapé */}
          <div className="border-t pt-6 text-center text-sm text-gray-600">
            <p>
              Este orçamento é válido até {' '}
              {quote.expires_at 
                ? new Date(quote.expires_at).toLocaleDateString('pt-BR')
                : `${quote.validity_days} dias a partir da data de emissão`
              }.
            </p>
            <p className="mt-2">
              Para dúvidas ou esclarecimentos, entre em contato conosco.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;
