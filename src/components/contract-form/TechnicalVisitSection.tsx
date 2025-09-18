import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  MapPin, 
  Car,
  User,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Route
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTechnicalVisitSettings } from "@/hooks/useTechnicalVisitSettings";
import { useVehicleSettingsList } from "@/hooks/useVehicleSettingsList";
import { useCosts } from "@/hooks/useCosts";
import { useTechnicalVisitServices } from "@/hooks/useTechnicalVisitServices";
import { useGoogleMapsDistance } from "@/hooks/useGoogleMapsDistance";
import { useTollCalculator } from "@/hooks/useTollCalculator";
import { useContract } from "@/context/ContractContext";

interface TechnicalVisitSectionProps {
  disabled?: boolean;
}

interface DistanceResult {
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
  isSimulated?: boolean;
}

interface TollData {
  totalCost: number;
  tollStations: Array<{
    name: string;
    cost: number;
    location: string;
  }>;
  route: string;
}

const TechnicalVisitSection: React.FC<TechnicalVisitSectionProps> = ({ disabled = false }) => {
  const { contractData, updateContractData } = useContract();
  const { settings: technicalSettings, loading: settingsLoading } = useTechnicalVisitSettings();
  const { vehicles: vehicleSettingsList, loading: vehicleLoading } = useVehicleSettingsList();
  const { employeeCosts } = useCosts();
  const { services } = useTechnicalVisitServices();
  const { toast } = useToast();
  const { calculateDistance, loading: googleMapsLoading } = useGoogleMapsDistance();
  const { calculateTolls, loading: tollLoading } = useTollCalculator();

  // Estados locais
  const [applyTechnicalVisit, setApplyTechnicalVisit] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);
  const [roundTrip, setRoundTrip] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [tollData, setTollData] = useState<TollData | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [editableTotal, setEditableTotal] = useState<string>("");

  // Endereços
  const originAddress = "Av. Padre Antônio Cezarino, 842 - Vila Xavier (Vila Xavier), Araraquara - SP, 14810-142";
  
  // Pegar endereço do primeiro contratante
  const contractorAddress = contractData.contractors?.[0] ? 
    `${contractData.contractors[0].address}, ${contractData.contractors[0].city}, ${contractData.contractors[0].state}` 
    : "";

  // Função para formatar valores monetários brasileiros
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar números brasileiros
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Função para converter string formatada para número
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Efeito para sincronizar com o valor do contrato
  useEffect(() => {
    if (applyTechnicalVisit && calculatedTotal > 0) {
      const currentMonthlyValue = parseFormattedNumber(contractData.monthlyValue || "0");
      const newMonthlyValue = currentMonthlyValue + calculatedTotal;
      updateContractData({
        monthlyValue: formatNumber(newMonthlyValue)
      });
    } else if (!applyTechnicalVisit) {
      // Remover valor da visita técnica se desabilitado
      const currentMonthlyValue = parseFormattedNumber(contractData.monthlyValue || "0");
      const valueWithoutTechnicalVisit = currentMonthlyValue - calculatedTotal;
      if (valueWithoutTechnicalVisit >= 0) {
        updateContractData({
          monthlyValue: formatNumber(valueWithoutTechnicalVisit)
        });
      }
    }
  }, [applyTechnicalVisit, calculatedTotal]);

  // Função de validação de endereço
  const validateAddress = (address: string) => {
    if (!address) return { isValid: false, message: "Endereço vazio" };
    
    const hasNumber = /\d/.test(address);
    const hasComma = address.includes(',');
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length < 2) {
      return { 
        isValid: false, 
        message: "Endereço incompleto. Inclua: Rua, Número, Cidade, Estado" 
      };
    }
    
    if (!hasNumber) {
      return { 
        isValid: false, 
        message: "Inclua o número do endereço" 
      };
    }
    
    return { isValid: true, message: "Endereço válido" };
  };

  // Função para calcular custos
  const calculateTechnicalVisitCost = () => {
    if (!result) return 0;

    const selectedVehicle = vehicleSettingsList?.find(v => v.id === selectedVehicleId);
    if (!selectedVehicle) return 0;

    // Custo do veículo por km
    const distance = result.distanceValue;
    const fuelCostPerKm = selectedVehicle.fuel_price / selectedVehicle.fuel_consumption;
    const ipvaCostPerKm = selectedVehicle.annual_ipva / selectedVehicle.annual_mileage;
    const insuranceCostPerKm = selectedVehicle.annual_insurance / selectedVehicle.annual_mileage;
    const maintenanceCostPerKm = selectedVehicle.annual_maintenance / selectedVehicle.annual_mileage;
    const depreciationCostPerKm = (selectedVehicle.purchase_value * (selectedVehicle.depreciation_rate / 100)) / selectedVehicle.annual_mileage;
    
    const vehicleCostPerKm = fuelCostPerKm + ipvaCostPerKm + insuranceCostPerKm + maintenanceCostPerKm + depreciationCostPerKm;
    const totalVehicleCost = vehicleCostPerKm * distance;

    // Custo de pedágios
    const totalTollCost = tollData?.totalCost || 0;

    // Custo da mão de obra (funcionário selecionado)
    let totalLaborCost = 0;
    if (selectedEmployeeId) {
      const employee = employeeCosts.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        const monthlyHours = 220;
        const totalMonthlyCost = employee.salary + (employee.benefits || 0) + (employee.taxes || 0);
        const hourlyRate = totalMonthlyCost / monthlyHours;
        const travelTimeHours = result.durationValue / 60;
        const workTimeHours = 2; // 2 horas de trabalho padrão
        const totalTimeHours = travelTimeHours + workTimeHours;
        totalLaborCost = hourlyRate * totalTimeHours;
      }
    }

    // Custo dos serviços (serviço selecionado)
    let totalServiceCost = 0;
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      
      if (service) {
        let unitCost = 0;
        if (service.pricing_type === 'fixed') {
          unitCost = service.fixed_price || 0;
        } else if (service.pricing_type === 'hourly') {
          const employee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
          if (employee) {
            const monthlyHours = 220;
            const totalMonthlyCost = employee.salary + (employee.benefits || 0) + (employee.taxes || 0);
            const hourlyRate = totalMonthlyCost / monthlyHours;
            unitCost = hourlyRate * (service.estimated_hours || 0);
          }
        }
        totalServiceCost = unitCost * serviceQuantity;
      }
    }

    return totalVehicleCost + totalTollCost + totalLaborCost + totalServiceCost;
  };

  // Função para calcular apenas o valor do KM rodado
  const calculateKmCost = () => {
    if (!result) return 0;

    const selectedVehicle = vehicleSettingsList?.find(v => v.id === selectedVehicleId);
    if (!selectedVehicle) return 0;

    const distance = result.distanceValue;
    const fuelCostPerKm = selectedVehicle.fuel_price / selectedVehicle.fuel_consumption;
    const ipvaCostPerKm = selectedVehicle.annual_ipva / selectedVehicle.annual_mileage;
    const insuranceCostPerKm = selectedVehicle.annual_insurance / selectedVehicle.annual_mileage;
    const maintenanceCostPerKm = selectedVehicle.annual_maintenance / selectedVehicle.annual_mileage;
    const depreciationCostPerKm = (selectedVehicle.purchase_value * (selectedVehicle.depreciation_rate / 100)) / selectedVehicle.annual_mileage;
    
    const vehicleCostPerKm = fuelCostPerKm + ipvaCostPerKm + insuranceCostPerKm + maintenanceCostPerKm + depreciationCostPerKm;
    return vehicleCostPerKm; // Retorna apenas o custo por km, não multiplicado pela distância
  };

  // Função para calcular apenas o valor da visita técnica baseado no serviço selecionado
  const calculateVisitCost = () => {
    if (!selectedServiceId) return 0;
    
    const service = services.find(s => s.id === selectedServiceId);
    
    if (!service) return 0;
    
    let unitCost = 0;
    if (service.pricing_type === 'fixed') {
      unitCost = service.fixed_price || 0;
    } else if (service.pricing_type === 'hourly') {
      const employee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
      if (employee) {
        const monthlyHours = 220;
        const totalMonthlyCost = employee.salary + (employee.benefits || 0) + (employee.taxes || 0);
        const hourlyRate = totalMonthlyCost / monthlyHours;
        unitCost = hourlyRate * (service.estimated_hours || 0);
      }
    }
    
    return unitCost * serviceQuantity;
  };

  // Função para calcular distância
  const handleCalculate = async () => {
    if (!contractorAddress) {
      toast({
        title: "Erro",
        description: "Preencha os dados do contratante primeiro para calcular a visita técnica.",
        variant: "destructive",
      });
      return;
    }

    const originValidation = validateAddress(originAddress);
    const destinationValidation = validateAddress(contractorAddress);

    if (!originValidation.isValid) {
      toast({
        title: "Endereço de Origem Inválido",
        description: originValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (!destinationValidation.isValid) {
      toast({
        title: "Endereço de Destino Inválido", 
        description: destinationValidation.message,
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    
    try {
      console.log('🗺️ Calculando distância entre:', originAddress, 'e', contractorAddress);
      
      const distanceResult = await calculateDistance(originAddress, contractorAddress);
      
      if (!distanceResult) {
        throw new Error('Não foi possível calcular a distância');
      }

      const displayMultiplier = roundTrip ? 2 : 1;
      const totalDistance = distanceResult.distanceValue * displayMultiplier;
      const totalDuration = distanceResult.durationValue * displayMultiplier;
      
      const finalResult = {
        ...distanceResult,
        distance: `${totalDistance} km${distanceResult.isSimulated ? ' (simulado)' : ''}`,
        distanceValue: totalDistance,
        duration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min${distanceResult.isSimulated ? ' (simulado)' : ''}`,
        durationValue: totalDuration
      };

      setResult(finalResult);
      
      // Calcular pedágios
      const tollResult = await calculateTolls(originAddress, contractorAddress, distanceResult.distanceValue);
      
      if (tollResult && roundTrip) {
        const adjustedTollData = {
          ...tollResult,
          totalCost: tollResult.totalCost * 2,
          tollStations: tollResult.tollStations.map(station => ({
            ...station,
            cost: station.cost * 2
          }))
        };
        setTollData(adjustedTollData);
      } else {
        setTollData(tollResult);
      }
      
    } catch (error) {
      console.error('❌ Erro ao calcular distância:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular distância. Verifique os endereços e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  // Efeito para recalcular total quando dados mudam
  useEffect(() => {
    if (result && applyTechnicalVisit) {
      const total = calculateTechnicalVisitCost();
      setCalculatedTotal(total);
      setEditableTotal(formatNumber(total));
    }
  }, [result, selectedVehicleId, selectedEmployeeId, selectedServiceId, serviceQuantity, technicalSettings, vehicleSettingsList, employeeCosts, services, tollData]);

  // Função para atualizar valor editável
  const handleEditableTotalChange = (value: string) => {
    setEditableTotal(value);
    const numericValue = parseFormattedNumber(value);
    setCalculatedTotal(numericValue);
  };

  if (settingsLoading || vehicleLoading) {
    return <div>Carregando configurações...</div>;
  }

  if (!technicalSettings) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="text-center text-amber-700">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>Configure primeiro as configurações de visita técnica na aba "Configuração".</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vehicleSettingsList || vehicleSettingsList.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="text-center text-amber-700">
            <Car className="w-12 h-12 mx-auto mb-4" />
            <p>Configure primeiro os dados dos veículos na aba "Veículos".</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Visita Técnica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Switch principal */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="apply-technical-visit" className="text-base font-medium">
              Aplicar Visita Técnica
            </Label>
            <p className="text-sm text-muted-foreground">
              Incluir custo de visita técnica neste contrato
            </p>
          </div>
          <Switch
            id="apply-technical-visit"
            checked={applyTechnicalVisit}
            onCheckedChange={setApplyTechnicalVisit}
            disabled={disabled}
          />
        </div>

        {applyTechnicalVisit && (
          <div className="space-y-6">
            {/* Informações do endereço */}
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="w-5 h-5" />
                <h3 className="font-semibold">Endereços da Visita</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-primary">Origem (Sua Empresa)</Label>
                  <p className="text-sm mt-1 p-2 bg-background border rounded">
                    {originAddress}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-primary">Destino (Cliente)</Label>
                  {contractorAddress ? (
                    <p className="text-sm mt-1 p-2 bg-background border rounded">
                      {contractorAddress}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 mt-1 p-2 bg-amber-50 border border-amber-200 rounded">
                      Preencha os dados do contratante para ver o endereço
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Configurações de ida e volta */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="round-trip" className="text-base font-medium">
                  Ida e Volta
                </Label>
                <p className="text-sm text-muted-foreground">
                  Calcular custos para ida e volta (dobra distância e custos)
                </p>
              </div>
              <Switch
                id="round-trip"
                checked={roundTrip}
                onCheckedChange={setRoundTrip}
                disabled={disabled}
              />
            </div>

            {/* Seleção de veículo */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Car className="w-4 h-4" />
                Veículo
              </Label>
              <Select 
                value={selectedVehicleId} 
                onValueChange={setSelectedVehicleId}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleSettingsList.filter(vehicle => vehicle.is_active).map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de funcionários */}
            {employeeCosts.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Funcionários
                </Label>
                <Select 
                  value={selectedEmployeeId} 
                  onValueChange={setSelectedEmployeeId}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeCosts.filter(emp => emp.is_active).map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Seleção de serviços */}
            {services.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Serviços Adicionais
                </Label>
                <Select 
                  value={selectedServiceId} 
                  onValueChange={setSelectedServiceId}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{service.name}</span>
                          {service.description && (
                            <span className="text-xs text-muted-foreground">
                              {service.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedServiceId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={serviceQuantity}
                      onChange={(e) => setServiceQuantity(parseInt(e.target.value) || 1)}
                      disabled={disabled}
                      className="w-24"
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Quantas vezes este serviço será realizado durante a visita
                    </p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Botão calcular */}
            <div className="flex justify-center">
              <Button 
                onClick={handleCalculate}
                disabled={calculating || !selectedVehicleId || !contractorAddress || disabled}
                className="px-8"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular Visita Técnica
                  </>
                )}
              </Button>
            </div>

            {/* Resultados */}
            {result && (
              <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Resultado do Cálculo</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Distância</Label>
                    <p className="font-medium">{result.distance}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tempo de Viagem</Label>
                    <p className="font-medium">{result.duration}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tipo de Viagem</Label>
                    <p className="font-medium">{roundTrip ? 'Ida e Volta' : 'Só Ida'}</p>
                  </div>
                </div>

                <Separator />

                {/* Detalhamento dos custos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-primary font-medium">Valor KM Rodado</Label>
                    <p className="font-bold text-primary">
                      {formatCurrency(calculateKmCost())}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor da Visita Técnica</Label>
                    <p className="font-medium">{formatCurrency(calculateVisitCost())}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">Valor Total da Visita Técnica</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={editableTotal}
                      onChange={(e) => handleEditableTotalChange(e.target.value)}
                      disabled={disabled}
                      className="w-48 font-medium text-lg"
                      placeholder="0,00"
                    />
                    <Badge variant="secondary" className="text-primary">
                      {formatCurrency(calculatedTotal)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você pode editar este valor manualmente se necessário.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TechnicalVisitSection;