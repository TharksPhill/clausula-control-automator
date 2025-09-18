
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User, 
  Building, 
  Mail, 
  Phone,
  CheckCircle2,
  ExternalLink,
  FileText
} from "lucide-react";
import { Quote } from "@/types/quotes";

const QuotePublic = () => {
  const { token } = useParams();

  // Validar token e buscar orçamento
  const { data: quoteData, isLoading, error } = useQuery({
    queryKey: ['quote-public', token],
    queryFn: async () => {
      // Primeiro validar o token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('validate_quote_access_token', { p_token: token });

      if (tokenError || !tokenData || tokenData.length === 0 || !tokenData[0].is_valid) {
        throw new Error('Token inválido ou expirado');
      }

      const quoteId = tokenData[0].quote_id;

      // Buscar dados do orçamento
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Buscar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', quote.user_id)
        .single();

      if (companyError) console.warn('Empresa não encontrada:', companyError);

      // Buscar dados do plano se selecionado
      let plan = null;
      if (quote.selected_plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('id', quote.selected_plan_id)
          .single();

        if (planError) console.warn('Plano não encontrado:', planError);
        else plan = planData;
      }

      return { quote: quote as Quote, company, plan };
    },
    enabled: !!token
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleTestFree = () => {
    window.open('https://typebot.co/lead-magnet-3a9mx2z', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Carregando orçamento...</div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Orçamento não encontrado</h2>
            <p className="text-gray-600">
              O link pode ter expirado ou ser inválido. Entre em contato com a empresa para obter um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { quote, company, plan } = quoteData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Proposta Comercial
          </h1>
          <p className="text-gray-600">
            Número: {quote.quote_number}
          </p>
        </div>

        {/* Conteúdo principal */}
        <Card className="shadow-xl">
          <CardContent className="p-8 space-y-8">
            {/* Cabeçalho da empresa */}
            {company && (
              <div className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                    <p className="text-gray-600 mt-1">{company.address}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {company.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {company.phone}
                      </span>
                      {company.website && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" />
                          {company.website}
                        </span>
                      )}
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
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Informações da Proposta
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Data de Criação:</span>
                    <span className="font-medium">
                      {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Válido até:</span>
                    <span className="font-medium">
                      {quote.expires_at 
                        ? new Date(quote.expires_at).toLocaleDateString('pt-BR')
                        : 'Não especificado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Status:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Disponível
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informações do cliente */}
              {(quote.client_name || quote.client_company) && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Cliente
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

            {/* Sistema proposto */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {quote.system_name}
              </h3>
              {quote.system_description && (
                <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                  {quote.system_description}
                </p>
              )}
            </div>

            {/* Funcionalidades */}
            {quote.features && quote.features.length > 0 && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-xl font-semibold text-green-900 mb-6 text-center">
                  ✨ Funcionalidades Incluídas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quote.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-800">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plano de serviço */}
            {plan && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-lg text-white">
                <h4 className="text-2xl font-bold mb-2 text-center">
                  {plan.name}
                </h4>
                <p className="text-blue-100 text-center mb-6">
                  Ideal para empresas com {plan.employee_range} funcionários
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                    <div className="text-3xl font-bold">
                      {formatCurrency(plan.monthly_price)}
                    </div>
                    <div className="text-blue-100 mt-1">por mês</div>
                  </div>
                  <div className="text-center p-6 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                    <div className="text-3xl font-bold">
                      {formatCurrency(plan.semestral_price)}
                    </div>
                    <div className="text-blue-100 mt-1">semestral</div>
                  </div>
                  <div className="text-center p-6 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                    <div className="text-3xl font-bold">
                      {formatCurrency(plan.annual_price)}
                    </div>
                    <div className="text-blue-100 mt-1">anual</div>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {quote.notes && (
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3">
                  📝 Observações Importantes
                </h4>
                <p className="text-yellow-800 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}

            {/* Botão de teste grátis */}
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 p-8 rounded-xl text-white">
                <h3 className="text-2xl font-bold mb-4">
                  🚀 Experimente Gratuitamente!
                </h3>
                <p className="mb-6 text-lg">
                  Conheça nossa solução antes de decidir. Teste todas as funcionalidades sem compromisso.
                </p>
                <Button
                  onClick={handleTestFree}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 font-bold px-8 py-4 text-lg"
                >
                  Testar Grátis Agora
                </Button>
              </div>
            </div>

            {/* Rodapé */}
            <div className="border-t pt-6 text-center text-sm text-gray-600">
              <p className="mb-2">
                📅 Esta proposta é válida até{' '}
                <strong>
                  {quote.expires_at 
                    ? new Date(quote.expires_at).toLocaleDateString('pt-BR')
                    : `${quote.validity_days} dias a partir da data de emissão`
                  }
                </strong>.
              </p>
              <p>
                Para dúvidas ou esclarecimentos, entre em contato conosco através dos canais informados acima.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuotePublic;
