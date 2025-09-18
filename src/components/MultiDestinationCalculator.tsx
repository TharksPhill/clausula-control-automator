import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Trash2, Calculator, Target, User, CheckCircle, Route, AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalVisitSettings } from "@/hooks/useTechnicalVisitSettings";
import { useVehicleSettings } from "@/hooks/useVehicleSettings";
import { useCosts } from "@/hooks/useCosts";
import { useTechnicalVisitServices } from "@/hooks/useTechnicalVisitServices";
import { useGoogleMapsDistance } from "@/hooks/useGoogleMapsDistance";
import { useTollCalculator } from "@/hooks/useTollCalculator";
import AddressAutocomplete from "./AddressAutocomplete";
import DestinationForm from "./DestinationForm";
import EditableCalculatorResults from "./EditableCalculatorResults";
import TravelRouteMap from "./TravelRouteMap";
import TravelQuoteGenerator from "./TravelQuoteGenerator";

interface Destination {
  id: string;
  label: string;
  contractId: string;
  contractorId: string;
  address: string;
  selectedServices: string[];
  serviceQuantities: { [serviceId: string]: number };
  useContractAddress: boolean;
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

interface DestinationResult {
  destination: Destination;
  distanceResult: DistanceResult;
  tollData: TollData | null;
}

const MultiDestinationCalculator = () => {
  const { settings, loading: settingsLoading } = useTechnicalVisitSettings();
  const { settings: vehicleSettings, loading: vehicleLoading } = useVehicleSettings();
  const { employeeCosts } = useCosts();
  const { services } = useTechnicalVisitServices();
  const { toast } = useToast();
  const { calculateTolls, loading: tollLoading } = useTollCalculator();
  const { calculateDistance, loading: googleMapsLoading } = useGoogleMapsDistance();

  // Estados para origem
  const [originAddress, setOriginAddress] = useState("Av. Padre Antônio Cezarino, 842 - Vila Xavier (Vila Xavier), Araraquara - SP, 14810-142");
  const [useManualOrigin, setUseManualOrigin] = useState(false);

  // Estados para destinos
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);

  // Estados para cálculos
  const [roundTrip, setRoundTrip] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<DestinationResult[]>([]);
  const [showQuoteGenerator, setShowQuoteGenerator] = useState(false);

  const addDestination = () => {
    const newDestination: Destination = {
      id: `dest-${Date.now()}`,
      label: `Destino ${destinations.length + 1}`,
      contractId: "",
      contractorId: "",
      address: "",
      selectedServices: [],
      serviceQuantities: {},
      useContractAddress: true
    };

    setDestinations([...destinations, newDestination]);
    setActiveDestinationId(newDestination.id);
    
    toast({
      title: "Destino Adicionado",
      description: `${newDestination.label} foi adicionado à lista.`,
    });
  };

  const removeDestination = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    setDestinations(destinations.filter(d => d.id !== destinationId));
    
    if (activeDestinationId === destinationId) {
      setActiveDestinationId(destinations.length > 1 ? destinations[0].id : null);
    }
    
    toast({
      title: "Destino Removido",
      description: `${destination?.label} foi removido da lista.`,
      variant: "destructive",
    });
  };

  const updateDestination = (destinationId: string, updates: Partial<Destination>) => {
    setDestinations(destinations.map(dest => 
      dest.id === destinationId ? { ...dest, ...updates } : dest
    ));
  };

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

  const handleCalculateAllDestinations = async () => {
    if (!originAddress) {
      toast({
        title: "Erro",
        description: "Endereço de origem é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const originValidation = validateAddress(originAddress);
    if (!originValidation.isValid) {
      toast({
        title: "Endereço de Origem Inválido",
        description: originValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (destinations.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um destino para calcular.",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    const newResults: DestinationResult[] = [];

    try {
      for (const destination of destinations) {
        const { data: contracts } = await supabase
          .from('contracts')
          .select(`
            id,
            contract_number,
            contractors (
              id,
              name,
              address,
              city,
              state
            )
          `)
          .eq('id', destination.contractId);

        const selectedContract = contracts?.[0];
        const selectedContractor = selectedContract?.contractors?.find(c => c.id === destination.contractorId);

        const finalDestinationAddress = destination.useContractAddress && selectedContractor
          ? `${selectedContractor.address}, ${selectedContractor.city}, ${selectedContractor.state}`
          : destination.address;

        if (!finalDestinationAddress) {
          throw new Error(`Endereço de destino não configurado para ${destination.label}`);
        }

        const destinationValidation = validateAddress(finalDestinationAddress);
        if (!destinationValidation.isValid) {
          throw new Error(`Endereço inválido para ${destination.label}: ${destinationValidation.message}`);
        }

        console.log(`🗺️ Calculando distância para ${destination.label}: ${originAddress} → ${finalDestinationAddress}`);
        
        const distanceResult = await calculateDistance(originAddress, finalDestinationAddress);
        
        if (!distanceResult) {
          throw new Error(`Não foi possível calcular a distância para ${destination.label}`);
        }

        const displayMultiplier = roundTrip ? 2 : 1;
        const totalDistance = distanceResult.distanceValue * displayMultiplier;
        const totalDuration = distanceResult.durationValue * displayMultiplier;
        
        const finalDistanceResult = {
          ...distanceResult,
          distance: `${totalDistance} km${distanceResult.isSimulated ? ' (simulado)' : ''}`,
          distanceValue: totalDistance,
          duration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min${distanceResult.isSimulated ? ' (simulado)' : ''}`,
          durationValue: totalDuration
        };

        const tollResult = await calculateTolls(originAddress, finalDestinationAddress, distanceResult.distanceValue);
        
        let adjustedTollData = null;
        if (tollResult && roundTrip) {
          adjustedTollData = {
            ...tollResult,
            totalCost: tollResult.totalCost * 2,
            tollStations: tollResult.tollStations.map(station => ({
              ...station,
              cost: station.cost * 2
            }))
          };
        } else {
          adjustedTollData = tollResult;
        }

        newResults.push({
          destination: {
            ...destination,
            address: finalDestinationAddress
          },
          distanceResult: finalDistanceResult,
          tollData: adjustedTollData
        });
      }

      setResults(newResults);
      
      toast({
        title: "Cálculo Concluído",
        description: `Distâncias calculadas para ${destinations.length} destino(s).`,
      });

    } catch (error) {
      console.error('❌ Erro ao calcular distâncias:', error);
      toast({
        title: "Erro",
        description: `Erro ao calcular distâncias: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const originValidation = originAddress ? validateAddress(originAddress) : null;

  if (settingsLoading || vehicleLoading) {
    return <div>Carregando configurações...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Configure primeiro as configurações de visita técnica.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vehicleSettings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Route className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Configure primeiro os dados do veículo na aba "Veículo".</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculadora Multi-Destinos
            </div>
            <Button onClick={addDestination} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Destino
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Adicione múltiplos destinos para calcular custos de visitas técnicas com diferentes clientes e serviços.
          </div>
        </CardContent>
      </Card>

      {/* Seção de Origem */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <User className="w-5 h-5" />
              <h3 className="font-semibold">Ponto de Partida (Seu Endereço)</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="manual-origin"
                  checked={useManualOrigin}
                  onCheckedChange={setUseManualOrigin}
                />
                <Label htmlFor="manual-origin" className="text-sm font-medium">
                  Digitar endereço manualmente
                </Label>
              </div>

              {useManualOrigin ? (
                <AddressAutocomplete
                  value={originAddress}
                  onChange={setOriginAddress}
                  placeholder="Digite seu endereço de partida"
                  label="Endereço de Partida"
                />
              ) : (
                <div className="p-3 bg-white border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Endereço padrão:</span>
                  </div>
                  <p className="text-sm text-gray-700">{originAddress}</p>
                </div>
              )}

              {originAddress && originValidation && !originValidation.isValid && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-800">
                    <strong>⚠️ PROBLEMA:</strong> {originValidation.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuração de Ida e Volta */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="round-trip"
                checked={roundTrip}
                onCheckedChange={setRoundTrip}
              />
              <Label htmlFor="round-trip" className="text-sm font-medium">
                Calcular ida e volta (dobra distância e custos)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Destinos */}
      {destinations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Destinos Configurados ({destinations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {destinations.map((destination) => (
                <div key={destination.id} className="flex items-center gap-2">
                  <Badge 
                    variant={activeDestinationId === destination.id ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-2 py-2 px-3"
                    onClick={() => setActiveDestinationId(destination.id)}
                  >
                    <MapPin className="w-3 h-3" />
                    {destination.label}
                    {destination.contractId && (
                      <span className="text-xs opacity-75">
                        ✓
                      </span>
                    )}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={() => removeDestination(destination.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário para o destino ativo */}
      {activeDestinationId && (() => {
        const activeDestination = destinations.find(d => d.id === activeDestinationId);
        if (!activeDestination) return null;
        
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                Configurando: {activeDestination.label}
              </h3>
              <Badge variant="secondary">
                {destinations.findIndex(d => d.id === activeDestinationId) + 1} de {destinations.length}
              </Badge>
            </div>
            
            <DestinationForm
              destination={activeDestination}
              onUpdate={(updates) => updateDestination(activeDestinationId, updates)}
            />
          </div>
        );
      })()}

      {/* Estado vazio */}
      {destinations.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum destino configurado</p>
              <p className="text-sm mb-4">
                Clique em "Adicionar Destino" para começar a configurar suas visitas técnicas multi-destinos.
              </p>
              <Button onClick={addDestination} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Adicionar Primeiro Destino
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Calcular */}
      {destinations.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button 
                onClick={handleCalculateAllDestinations}
                disabled={calculating || tollLoading || googleMapsLoading}
                size="lg"
                className="px-8 py-3"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5 mr-2" />
                    Calcular Todas as Distâncias
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {results.length > 0 && !showQuoteGenerator && (
        <div className="space-y-6">
          {/* Mapa da Rota */}
          <TravelRouteMap
            origin={originAddress}
            destinations={results.map(result => ({
              address: result.destination.useContractAddress 
                ? `${result.destination.address}` 
                : result.destination.address,
              label: result.destination.label
            }))}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Resultados dos Cálculos
                </div>
                <Button 
                  onClick={() => setShowQuoteGenerator(true)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Orçamento
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Resultados detalhados para cada destino.
              </div>
            </CardContent>
          </Card>

          {/* Resultados individuais por destino */}
          {results.map((result, index) => {
            const { destination, distanceResult, tollData } = result;
            
            // Calcular breakdown para este destino específico
            const calculateDestinationBreakdown = () => {
              if (!settings || !vehicleSettings) return null;
              
              const visitCost = Number(settings.visit_cost) || 0;
              
              // Cálculo do custo do veículo
              const distance = distanceResult.distanceValue;
              const fuelCostPerKm = vehicleSettings.fuel_price / vehicleSettings.fuel_consumption;
              const ipvaCostPerKm = vehicleSettings.annual_ipva / vehicleSettings.annual_mileage;
              const insuranceCostPerKm = vehicleSettings.annual_insurance / vehicleSettings.annual_mileage;
              const maintenanceCostPerKm = vehicleSettings.annual_maintenance / vehicleSettings.annual_mileage;
              const depreciationCostPerKm = (vehicleSettings.purchase_value * (vehicleSettings.depreciation_rate / 100)) / vehicleSettings.annual_mileage;
              
              const totalFuelCost = fuelCostPerKm * distance;
              const totalIpvaCost = ipvaCostPerKm * distance;
              const totalInsuranceCost = insuranceCostPerKm * distance;
              const totalMaintenanceCost = maintenanceCostPerKm * distance;
              const totalDepreciationCost = depreciationCostPerKm * distance;
              const totalTollCost = tollData?.totalCost || 0;
              const totalVehicleCost = totalFuelCost + totalIpvaCost + totalInsuranceCost + 
                                     totalMaintenanceCost + totalDepreciationCost + totalTollCost;
              
              // Cálculo do custo de mão de obra
              const selectedEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
              let laborBreakdown = null;
              if (selectedEmployee) {
                const monthlyHours = 220;
                const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
                const hourlyRate = totalMonthlyCost / monthlyHours;
                const travelTimeHours = distanceResult.durationValue / 60;
                const workTimeHours = 2;
                const totalTimeHours = travelTimeHours + workTimeHours;
                const totalLaborCost = hourlyRate * totalTimeHours;
                
                laborBreakdown = {
                  employeeName: selectedEmployee.name,
                  hourlyRate,
                  travelTimeHours,
                  workTimeHours,
                  totalTimeHours,
                  totalLaborCost
                };
              }
              
              // Cálculo dos serviços
              let totalServiceCost = 0;
              const serviceBreakdowns = destination.selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                if (!service) return null;
                
                const quantity = destination.serviceQuantities[serviceId] || 1;
                let unitCost = 0;
                
                if (service.pricing_type === 'fixed') {
                  unitCost = service.fixed_price || 0;
                } else if (service.pricing_type === 'hourly' && selectedEmployee) {
                  const monthlyHours = 220;
                  const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
                  const hourlyRate = totalMonthlyCost / monthlyHours;
                  unitCost = hourlyRate * (service.estimated_hours || 0);
                }
                
                const serviceCost = unitCost * quantity;
                totalServiceCost += serviceCost;
                
                return {
                  serviceName: service.name,
                  pricingType: service.pricing_type,
                  unitCost,
                  quantity,
                  totalServiceCost: serviceCost,
                  estimatedHours: service.estimated_hours,
                  fixedPrice: service.fixed_price
                };
              }).filter(Boolean);
              
              const totalCost = visitCost + totalVehicleCost + (laborBreakdown?.totalLaborCost || 0) + totalServiceCost;
              
              return {
                visitCost,
                distance: distanceResult.distanceValue,
                duration: distanceResult.duration,
                vehicleBreakdown: {
                  fuelCostPerKm,
                  ipvaCostPerKm,
                  insuranceCostPerKm,
                  maintenanceCostPerKm,
                  depreciationCostPerKm,
                  totalFuelCost,
                  totalIpvaCost,
                  totalInsuranceCost,
                  totalMaintenanceCost,
                  totalDepreciationCost,
                  totalTollCost,
                  totalVehicleCost,
                  totalCostPerKm: totalVehicleCost / distance
                },
                laborBreakdown,
                serviceBreakdowns,
                totalVehicleCost,
                totalLaborCost: laborBreakdown?.totalLaborCost || 0,
                totalServiceCost,
                totalCost
              };
            };
            
            const breakdown = calculateDestinationBreakdown();
            
            return (
              <Card key={destination.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="mr-2">
                      {index + 1}
                    </Badge>
                    {destination.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {breakdown && (
                    <EditableCalculatorResults
                      result={distanceResult}
                      breakdown={breakdown}
                      tollData={tollData}
                      vehicleSettings={vehicleSettings}
                      roundTrip={roundTrip}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Resumo Consolidado */}
          {results.length > 1 && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calculator className="w-5 h-5" />
                  Resumo Consolidado - Todos os Destinos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Distância Total</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {results.reduce((total, result) => total + result.distanceResult.distanceValue, 0).toFixed(1)} km
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Tempo Total</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.floor(results.reduce((total, result) => total + result.distanceResult.durationValue, 0) / 60)}h{" "}
                      {results.reduce((total, result) => total + result.distanceResult.durationValue, 0) % 60}min
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Pedágios Total</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      R$ {results.reduce((total, result) => total + (result.tollData?.totalCost || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gerador de Orçamento */}
      {showQuoteGenerator && results.length > 0 && (() => {
        // Calcular custos consolidados
        let totalDistance = 0;
        let totalDuration = 0;
        let totalTolls = 0;
        let totalFuelCost = 0;
        let totalVehicleCost = 0;
        let totalEmployeeCost = 0;
        let totalServiceCost = 0;

        results.forEach(result => {
          totalDistance += result.distanceResult.distanceValue;
          totalDuration += result.distanceResult.durationValue;
          totalTolls += result.tollData?.totalCost || 0;

          if (settings && vehicleSettings) {
            // Calcular custos de combustível
            const fuelCostPerKm = vehicleSettings.fuel_price / vehicleSettings.fuel_consumption;
            totalFuelCost += fuelCostPerKm * result.distanceResult.distanceValue;

            // Calcular custos do veículo
            const ipvaCostPerKm = vehicleSettings.annual_ipva / vehicleSettings.annual_mileage;
            const insuranceCostPerKm = vehicleSettings.annual_insurance / vehicleSettings.annual_mileage;
            const maintenanceCostPerKm = vehicleSettings.annual_maintenance / vehicleSettings.annual_mileage;
            const depreciationCostPerKm = (vehicleSettings.purchase_value * (vehicleSettings.depreciation_rate / 100)) / vehicleSettings.annual_mileage;
            
            totalVehicleCost += (fuelCostPerKm + ipvaCostPerKm + insuranceCostPerKm + maintenanceCostPerKm + depreciationCostPerKm) * result.distanceResult.distanceValue;

            // Calcular custos de mão de obra
            const selectedEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
            if (selectedEmployee) {
              const monthlyHours = 220;
              const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
              const hourlyRate = totalMonthlyCost / monthlyHours;
              const travelTimeHours = result.distanceResult.durationValue / 60;
              const workTimeHours = 2; // Tempo estimado de trabalho
              const totalTimeHours = travelTimeHours + workTimeHours;
              totalEmployeeCost += hourlyRate * totalTimeHours;
            }

            // Calcular custos dos serviços
            result.destination.selectedServices.forEach(serviceId => {
              const service = services.find(s => s.id === serviceId);
              if (service) {
                if (service.pricing_type === 'fixed') {
                  totalServiceCost += service.fixed_price || 0;
                } else if (service.pricing_type === 'hourly') {
                  const selectedEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
                  if (selectedEmployee) {
                    const monthlyHours = 220;
                    const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
                    const hourlyRate = totalMonthlyCost / monthlyHours;
                    totalServiceCost += hourlyRate * (service.estimated_hours || 0);
                  }
                }
              }
            });
          }
        });

        const visitCost = Number(settings?.visit_cost) || 0;
        const finalTotalCost = visitCost + totalVehicleCost + totalEmployeeCost + totalServiceCost + totalTolls;

        const consolidatedCosts = {
          totalDistance,
          totalDuration,
          totalTolls,
          fuelCost: totalFuelCost,
          vehicleCost: totalVehicleCost,
          employeeCost: totalEmployeeCost,
          serviceCost: totalServiceCost,
          totalCost: finalTotalCost
        };

        return (
          <TravelQuoteGenerator
            origin={originAddress}
            destinations={results.map(result => ({
              id: result.destination.id,
              label: result.destination.label,
              address: result.destination.address,
              selectedServices: result.destination.selectedServices,
              distanceResult: result.distanceResult,
              tollData: result.tollData
            }))}
            roundTrip={roundTrip}
            calculatedCosts={consolidatedCosts}
            onClose={() => setShowQuoteGenerator(false)}
          />
        );
      })()}
    </div>
  );
};

export default MultiDestinationCalculator;
