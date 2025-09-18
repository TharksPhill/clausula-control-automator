import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TravelQuoteData } from '@/types/travel-quote';
import { generateTravelQuotePDF } from '@/utils/travelQuotePdfGenerator';
import { useTechnicalVisitSettings } from '@/hooks/useTechnicalVisitSettings';
import { useVehicleSettings } from '@/hooks/useVehicleSettings';
import { useCosts } from '@/hooks/useCosts';
import { useTechnicalVisitServices } from '@/hooks/useTechnicalVisitServices';
import { 
  FileText, 
  Download, 
  User, 
  Building2, 
  MapPin, 
  Calculator,
  Clock,
  DollarSign,
  Route,
  Fuel,
  Settings,
  Loader2
} from 'lucide-react';

interface TravelQuoteGeneratorProps {
  origin: string;
  destinations: Array<{
    id: string;
    label: string;
    address: string;
    selectedServices: string[];
    distanceResult: {
      distance: string;
      distanceValue: number;
      duration: string;
      durationValue: number;
    };
    tollData: {
      totalCost: number;
    } | null;
  }>;
  roundTrip: boolean;
  calculatedCosts: {
    totalDistance: number;
    totalDuration: number;
    totalTolls: number;
    fuelCost: number;
    vehicleCost: number;
    employeeCost: number;
    serviceCost: number;
    totalCost: number;
  };
  onClose?: () => void;
}

const TravelQuoteGenerator: React.FC<TravelQuoteGeneratorProps> = ({
  origin,
  destinations,
  roundTrip,
  calculatedCosts,
  onClose
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const { settings } = useTechnicalVisitSettings();
  const { settings: vehicleSettings } = useVehicleSettings();
  const { employeeCosts } = useCosts();
  const { services } = useTechnicalVisitServices();
  
  const [companyData, setCompanyData] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    responsibleName: ''
  });
  
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: ''
  });
  
  const [quoteSettings, setQuoteSettings] = useState({
    validityDays: 30,
    notes: '',
    travelDate: ''
  });

  const [realCalculatedCosts, setRealCalculatedCosts] = useState(calculatedCosts);

  useEffect(() => {
    loadCompanyData();
  }, []);

  useEffect(() => {
    // Recalcular custos quando os dados mudarem
    calculateRealCosts();
  }, [destinations, settings, vehicleSettings, employeeCosts, services]);

  const calculateRealCosts = () => {
    if (!settings || !vehicleSettings) return;

    let totalFuelCost = 0;
    let totalVehicleCost = 0;
    let totalEmployeeCost = 0;
    let totalServiceCost = 0;
    let totalDistance = 0;
    let totalDuration = 0;
    let totalTolls = 0;

    const selectedEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
    
    destinations.forEach(destination => {
      const distance = destination.distanceResult.distanceValue;
      const duration = destination.distanceResult.durationValue;
      
      totalDistance += distance;
      totalDuration += duration;
      totalTolls += destination.tollData?.totalCost || 0;

      // Calcular custo de combustível
      const fuelCostPerKm = vehicleSettings.fuel_price / vehicleSettings.fuel_consumption;
      totalFuelCost += fuelCostPerKm * distance;

      // Calcular custo total do veículo
      const ipvaCostPerKm = vehicleSettings.annual_ipva / vehicleSettings.annual_mileage;
      const insuranceCostPerKm = vehicleSettings.annual_insurance / vehicleSettings.annual_mileage;
      const maintenanceCostPerKm = vehicleSettings.annual_maintenance / vehicleSettings.annual_mileage;
      const depreciationCostPerKm = (vehicleSettings.purchase_value * (vehicleSettings.depreciation_rate / 100)) / vehicleSettings.annual_mileage;
      
      totalVehicleCost += (fuelCostPerKm + ipvaCostPerKm + insuranceCostPerKm + maintenanceCostPerKm + depreciationCostPerKm) * distance;

      // Calcular custo de mão de obra
      if (selectedEmployee) {
        const monthlyHours = 220;
        const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
        const hourlyRate = totalMonthlyCost / monthlyHours;
        const travelTimeHours = duration / 60;
        const workTimeHours = 2; // Tempo estimado de trabalho
        const totalTimeHours = travelTimeHours + workTimeHours;
        totalEmployeeCost += hourlyRate * totalTimeHours;
      }

      // Calcular custo dos serviços
      destination.selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          if (service.pricing_type === 'fixed') {
            totalServiceCost += service.fixed_price || 0;
          } else if (service.pricing_type === 'hourly' && selectedEmployee) {
            const monthlyHours = 220;
            const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
            const hourlyRate = totalMonthlyCost / monthlyHours;
            totalServiceCost += hourlyRate * (service.estimated_hours || 0);
          }
        }
      });
    });

    // Adicionar custo de visita
    const visitCost = Number(settings.visit_cost) || 0;
    const totalCost = visitCost + totalVehicleCost + totalEmployeeCost + totalServiceCost + totalTolls;

    setRealCalculatedCosts({
      totalDistance,
      totalDuration,
      totalTolls,
      fuelCost: totalFuelCost,
      vehicleCost: totalVehicleCost,
      employeeCost: totalEmployeeCost,
      serviceCost: totalServiceCost,
      totalCost
    });
  };

  const loadCompanyData = async () => {
    try {
      // Tentar carregar do localStorage primeiro
      const savedData = localStorage.getItem("companyProfile");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setCompanyData({
          name: parsedData.name || '',
          cnpj: parsedData.cnpj || '',
          address: parsedData.address || '',
          phone: parsedData.phone || '',
          email: parsedData.email || '',
          website: parsedData.website || '',
          logo: parsedData.logo || '',
          responsibleName: parsedData.responsibleName || ''
        });
      }

      // Também tentar carregar do Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (company) {
          const supabaseData = {
            name: company.name || '',
            cnpj: company.cnpj || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
            website: company.website || '',
            logo: company.logo || '',
            responsibleName: company.responsible_name || ''
          };
          setCompanyData(supabaseData);
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados da empresa:", error);
    }
  };

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

  const validateData = () => {
    if (!companyData.name || !companyData.cnpj || !companyData.address || 
        !companyData.phone || !companyData.email || !companyData.responsibleName) {
      toast({
        title: "Dados da empresa incompletos",
        description: "Configure os dados da empresa no perfil antes de gerar o orçamento.",
        variant: "destructive",
      });
      return false;
    }

    if (!clientData.name) {
      toast({
        title: "Nome do cliente obrigatório",
        description: "Informe pelo menos o nome do cliente.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const addDebugInfo = (info: string) => {
    console.log(`📄 PDF Generation: ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Função simplificada para gerar PDF
  const generateSimplePDF = async (quoteData: TravelQuoteData) => {
    addDebugInfo('Iniciando geração de PDF simplificada');
    
    try {
      // Criar um PDF simples usando uma abordagem mais confiável
      const pdfContent = `
        ORÇAMENTO DE VIAGEM TÉCNICA
        
        Empresa: ${quoteData.companyName}
        CNPJ: ${quoteData.companyCnpj}
        Responsável: ${quoteData.responsibleName}
        
        Cliente: ${quoteData.clientName}
        ${quoteData.clientCompany ? `Empresa: ${quoteData.clientCompany}` : ''}
        
        DETALHES DA VIAGEM:
        Origem: ${quoteData.origin}
        
        Destinos:
        ${quoteData.destinations.map((dest, i) => `${i + 1}. ${dest.label} - ${dest.address}`).join('\n')}
        
        CUSTOS:
        Distância Total: ${quoteData.costs.totalDistance.toFixed(1)} km
        Tempo Total: ${Math.floor(quoteData.costs.totalDuration / 60)}h ${quoteData.costs.totalDuration % 60}min
        Custo de Combustível: R$ ${quoteData.costs.fuelCost.toFixed(2)}
        Custo do Veículo: R$ ${quoteData.costs.vehicleCost.toFixed(2)}
        Custo de Mão de Obra: R$ ${quoteData.costs.employeeCost.toFixed(2)}
        Custo dos Serviços: R$ ${quoteData.costs.serviceCost.toFixed(2)}
        Pedágios: R$ ${quoteData.costs.totalTolls.toFixed(2)}
        
        TOTAL: R$ ${quoteData.costs.totalCost.toFixed(2)}
        
        Validade: ${quoteData.validityDays} dias
        ${quoteData.notes ? `\nObservações:\n${quoteData.notes}` : ''}
      `;

      addDebugInfo('Conteúdo do PDF gerado');

      // Criar e baixar o arquivo
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orcamento-viagem-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addDebugInfo('Arquivo baixado com sucesso');
      return true;
    } catch (error) {
      addDebugInfo(`Erro na geração simples: ${error}`);
      throw error;
    }
  };

  const handleGenerateQuote = async () => {
    addDebugInfo('Iniciando processo de geração de orçamento');
    
    if (!validateData()) {
      addDebugInfo('Validação de dados falhou');
      return;
    }

    setIsGenerating(true);
    
    try {
      addDebugInfo('Montando dados do orçamento');
      
      const quoteData: TravelQuoteData = {
        // Dados da empresa
        companyName: companyData.name || 'Nome da Empresa',
        companyCnpj: companyData.cnpj || '00.000.000/0000-00',
        companyAddress: companyData.address || 'Endereço da Empresa',
        companyPhone: companyData.phone || '(00) 0000-0000',
        companyEmail: companyData.email || 'email@empresa.com',
        companyWebsite: companyData.website || '',
        companyLogo: companyData.logo || '',
        responsibleName: companyData.responsibleName || 'Responsável',

        // Dados do cliente
        clientName: clientData.name,
        clientEmail: clientData.email || '',
        clientCompany: clientData.company || '',
        clientPhone: clientData.phone || '',
        clientAddress: clientData.address || '',

        // Informações da viagem
        origin: origin,
        destinations: destinations.map(dest => ({
          label: dest.label,
          address: dest.address,
          services: dest.selectedServices || [],
          distance: dest.distanceResult?.distanceValue || 0,
          duration: dest.distanceResult?.durationValue || 0,
          tollCost: dest.tollData?.totalCost || 0
        })),
        roundTrip: roundTrip,
        travelDate: quoteSettings.travelDate,

        // Custos calculados
        costs: {
          totalDistance: calculatedCosts.totalDistance || 0,
          totalDuration: calculatedCosts.totalDuration || 0,
          totalTolls: calculatedCosts.totalTolls || 0,
          fuelCost: calculatedCosts.fuelCost || 0,
          vehicleCost: calculatedCosts.vehicleCost || 0,
          employeeCost: calculatedCosts.employeeCost || 0,
          serviceCost: calculatedCosts.serviceCost || 0,
          totalCost: calculatedCosts.totalCost || 0
        },

        // Configurações
        validityDays: quoteSettings.validityDays,
        notes: quoteSettings.notes
      };

      addDebugInfo(`Dados montados: Total R$ ${quoteData.costs.totalCost.toFixed(2)}`);

      // Tentar gerar PDF simples primeiro
      await generateSimplePDF(quoteData);
      
      toast({
        title: "Orçamento gerado com sucesso!",
        description: "O arquivo foi baixado automaticamente (versão de texto).",
      });

      addDebugInfo('Processo concluído com sucesso');

      if (onClose) {
        onClose();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      addDebugInfo(`Erro durante geração: ${errorMsg}`);
      console.error('Erro ao gerar orçamento:', error);
      
      toast({
        title: "Erro ao gerar orçamento",
        description: `Erro: ${errorMsg}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const missingCompanyData = !companyData.name || !companyData.cnpj || !companyData.address || 
                            !companyData.phone || !companyData.email || !companyData.responsibleName;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Orçamento de Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure os dados do cliente e gere um orçamento profissional em PDF para apresentar ao seu cliente.
          </p>
        </CardContent>
      </Card>

      {/* Status dos dados da empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados da Empresa
            {missingCompanyData ? (
              <Badge variant="destructive">Incompleto</Badge>
            ) : (
              <Badge variant="default">Configurado</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {missingCompanyData ? (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Configure os dados da empresa no perfil para poder gerar orçamentos. 
                São necessários: nome, CNPJ, endereço, telefone, email e nome do responsável.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm"><strong>Empresa:</strong> {companyData.name}</p>
              <p className="text-sm"><strong>CNPJ:</strong> {companyData.cnpj}</p>
              <p className="text-sm"><strong>Responsável:</strong> {companyData.responsibleName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                value={clientData.name}
                onChange={(e) => setClientData({...clientData, name: e.target.value})}
                placeholder="Nome completo do cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientCompany">Empresa</Label>
              <Input
                id="clientCompany"
                value={clientData.company}
                onChange={(e) => setClientData({...clientData, company: e.target.value})}
                placeholder="Nome da empresa do cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({...clientData, email: e.target.value})}
                placeholder="email@cliente.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input
                id="clientPhone"
                value={clientData.phone}
                onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clientAddress">Endereço do Cliente</Label>
              <Input
                id="clientAddress"
                value={clientData.address}
                onChange={(e) => setClientData({...clientData, address: e.target.value})}
                placeholder="Endereço completo do cliente"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Viagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Resumo da Viagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Origem:</span>
              <span className="text-sm">{origin}</span>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-medium">Destinos ({destinations.length}):</span>
              </div>
              <div className="space-y-1 ml-6">
                {destinations.map((dest, index) => (
                  <div key={dest.id} className="text-sm text-muted-foreground">
                    {index + 1}. {dest.label} - {formatDistance(dest.distanceResult.distanceValue)}
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                <span>{formatDistance(realCalculatedCosts.totalDistance)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(realCalculatedCosts.totalDuration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4" />
                <span>{formatCurrency(realCalculatedCosts.fuelCost)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold">{formatCurrency(realCalculatedCosts.totalCost)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Validade (dias)</Label>
              <Input
                id="validityDays"
                type="number"
                value={quoteSettings.validityDays}
                onChange={(e) => setQuoteSettings({...quoteSettings, validityDays: parseInt(e.target.value) || 30})}
                min="1"
                max="365"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="travelDate">Data da Viagem</Label>
              <Input
                id="travelDate"
                type="date"
                value={quoteSettings.travelDate}
                onChange={(e) => setQuoteSettings({...quoteSettings, travelDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={quoteSettings.notes}
              onChange={(e) => setQuoteSettings({...quoteSettings, notes: e.target.value})}
              placeholder="Observações adicionais que aparecerão no orçamento..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Info (PDF Generation)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded max-h-40 overflow-y-auto">
              <ul className="space-y-1">
                {debugInfo.slice(-15).map((info, index) => (
                  <li key={index}>• {info}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button 
          onClick={handleGenerateQuote}
          disabled={isGenerating || missingCompanyData || !clientData.name}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Gerar Arquivo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TravelQuoteGenerator;
