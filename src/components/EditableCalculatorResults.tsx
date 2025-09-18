
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  Car,
  DollarSign,
  Fuel,
  Settings,
  Edit3,
  Check,
  X,
  Utensils,
  Wrench,
  Route
} from "lucide-react";

interface DistanceResult {
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
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

interface VehicleBreakdown {
  fuelCostPerKm: number;
  ipvaCostPerKm: number;
  insuranceCostPerKm: number;
  maintenanceCostPerKm: number;
  depreciationCostPerKm: number;
  totalFuelCost: number;
  totalIpvaCost: number;
  totalInsuranceCost: number;
  totalMaintenanceCost: number;
  totalDepreciationCost: number;
  totalTollCost: number;
  totalVehicleCost: number;
  totalCostPerKm: number;
  baseVehicleCost?: number;
  vehicleMarginValue?: number;
}

interface LaborBreakdown {
  employeeName: string;
  hourlyRate: number;
  travelTimeHours: number;
  workTimeHours: number;
  totalTimeHours: number;
  totalLaborCost: number;
}

interface ServiceBreakdown {
  serviceName: string;
  pricingType: 'hourly' | 'fixed';
  unitCost: number;
  quantity: number;
  totalServiceCost: number;
  estimatedHours?: number;
  fixedPrice?: number;
}

interface Breakdown {
  visitCost: number;
  distance: number;
  duration: string;
  vehicleBreakdown: VehicleBreakdown | null;
  laborBreakdown: LaborBreakdown | null;
  serviceBreakdown?: ServiceBreakdown | null;
  totalVehicleCost: number;
  totalLaborCost: number;
  totalServiceCost?: number;
  totalCost: number;
  totalMealCost?: number;
  visitTechnicalCost?: number;
  baseLaborCost?: number;
  laborMarginValue?: number;
  totalTravelCost?: number;
  totalTravelLaborCost?: number;
}

interface EditableCalculatorResultsProps {
  result: DistanceResult;
  tollData: TollData | null;
  breakdown: Breakdown;
  vehicleSettings: any;
  roundTrip?: boolean;
}

const EditableCalculatorResults = ({ 
  result, 
  tollData, 
  breakdown: initialBreakdown, 
  vehicleSettings,
  roundTrip = true
}: EditableCalculatorResultsProps) => {
  // Estados para edição de valores
  const [editingToll, setEditingToll] = useState(false);
  const [editingFuel, setEditingFuel] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState(false);
  
  const [editableTollCost, setEditableTollCost] = useState(tollData?.totalCost || 0);
  const [editableFuelPrice, setEditableFuelPrice] = useState(vehicleSettings?.fuel_price || 5.50);
  const [editableFuelConsumption, setEditableFuelConsumption] = useState(vehicleSettings?.fuel_consumption || 12.0);
  
  // Estados para margens de lucro
  const [vehicleMargin, setVehicleMargin] = useState(0); // percentual de margem
  const [laborMargin, setLaborMargin] = useState(0); // percentual de margem
  
  // Estados para custos de refeições
  const [mealCosts, setMealCosts] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0
  });

  // Estados para quantidade de refeições
  const [mealQuantities, setMealQuantities] = useState({
    breakfast: 1,
    lunch: 1,
    dinner: 1
  });

  // Atualizar valores quando props mudarem
  useEffect(() => {
    console.log('Dados de pedágio recebidos no EditableCalculatorResults:', tollData);
    setEditableTollCost(tollData?.totalCost || 0);
    setEditableFuelPrice(vehicleSettings?.fuel_price || 5.50);
    setEditableFuelConsumption(vehicleSettings?.fuel_consumption || 12.0);
  }, [tollData, vehicleSettings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular breakdown com valores editáveis e margens
  const calculateEditableBreakdown = () => {
    if (!result || !vehicleSettings) return initialBreakdown;

    const distance = result.distanceValue;
    
    // Usar valores editáveis para combustível
    const fuelCostPerKm = editableFuelPrice / editableFuelConsumption;
    const ipvaCostPerKm = vehicleSettings.annual_ipva / vehicleSettings.annual_mileage;
    const insuranceCostPerKm = vehicleSettings.annual_insurance / vehicleSettings.annual_mileage;
    const maintenanceCostPerKm = vehicleSettings.annual_maintenance / vehicleSettings.annual_mileage;
    const depreciationCostPerKm = (vehicleSettings.purchase_value * (vehicleSettings.depreciation_rate / 100)) / vehicleSettings.annual_mileage;
    
    // Custos totais para a distância
    const totalFuelCost = fuelCostPerKm * distance;
    const totalIpvaCost = ipvaCostPerKm * distance;
    const totalInsuranceCost = insuranceCostPerKm * distance;
    const totalMaintenanceCost = maintenanceCostPerKm * distance;
    const totalDepreciationCost = depreciationCostPerKm * distance;
    
    // Usar valor editável do pedágio
    const totalTollCost = editableTollCost;
    
    // Custo base do veículo (sem margem)
    const baseVehicleCost = totalFuelCost + totalIpvaCost + totalInsuranceCost + 
                           totalMaintenanceCost + totalDepreciationCost + totalTollCost;
    
    // Aplicar margem no custo do veículo
    const vehicleMarginValue = (baseVehicleCost * vehicleMargin) / 100;
    const totalVehicleCost = baseVehicleCost + vehicleMarginValue;

    // Calcular apenas o custo da hora técnica de viagem (sem tempo de trabalho)
    const selectedEmployee = initialBreakdown.laborBreakdown;
    let travelLaborCost = 0;
    if (selectedEmployee) {
      const travelTimeHours = result.durationValue / 60;
      travelLaborCost = selectedEmployee.hourlyRate * travelTimeHours;
    }
    
    // Aplicar margem na mão de obra de viagem
    const laborMarginValue = (travelLaborCost * laborMargin) / 100;
    const totalTravelLaborCost = travelLaborCost + laborMarginValue;

    // Total das refeições com quantidade
    const totalMealCost = (mealCosts.breakfast * mealQuantities.breakfast) + 
                         (mealCosts.lunch * mealQuantities.lunch) + 
                         (mealCosts.dinner * mealQuantities.dinner);
    
    // Custo total de viagem = veículo + hora técnica de viagem + refeições
    const totalTravelCost = totalVehicleCost + totalTravelLaborCost + totalMealCost;
    
    // Incluir custos de serviços se existirem
    const totalServiceCost = initialBreakdown.totalServiceCost || 0;
    
    // Total geral = custo de viagem + serviços
    const totalCost = totalTravelCost + totalServiceCost;
    
    return {
      ...initialBreakdown,
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
        totalCostPerKm: totalVehicleCost / distance,
        baseVehicleCost,
        vehicleMarginValue
      },
      totalVehicleCost,
      totalTravelLaborCost,
      totalTravelCost,
      baseLaborCost: travelLaborCost,
      laborMarginValue,
      totalCost,
      totalMealCost
    };
  };

  const breakdown = calculateEditableBreakdown();

  const handleSaveToll = () => {
    setEditingToll(false);
  };

  const handleSaveFuel = () => {
    setEditingFuel(false);
  };

  const handleSaveConsumption = () => {
    setEditingConsumption(false);
  };

  const handleCancelEdit = (field: string) => {
    switch (field) {
      case 'toll':
        setEditableTollCost(tollData?.totalCost || 0);
        setEditingToll(false);
        break;
      case 'fuel':
        setEditableFuelPrice(vehicleSettings?.fuel_price || 5.50);
        setEditingFuel(false);
        break;
      case 'consumption':
        setEditableFuelConsumption(vehicleSettings?.fuel_consumption || 12.0);
        setEditingConsumption(false);
        break;
    }
  };

  return (
    <Card className="bg-background/20 border border-gray-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-400" />
            <span className="text-white">Resultado da Calculadora</span>
          </div>
          <Badge variant={roundTrip ? "default" : "secondary"} className="text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30">
            {roundTrip ? "Ida e Volta" : "Apenas Ida"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da rota */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold text-white">{result.distance}</div>
            <div className="text-sm text-gray-300">Distância Total</div>
          </div>
          <div className="text-center p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold text-white">{result.duration}</div>
            <div className="text-sm text-gray-300">Tempo de Viagem</div>
          </div>
        </div>

        <Separator />

        {/* Análise Financeira Moderna */}
        <div className="space-y-6">
          <h4 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            Análise Financeira da Visita Técnica
          </h4>

          {/* Cards principais organizados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Custo de Viagem */}
            {breakdown.vehicleBreakdown && (
              <Card className="bg-background/20 border border-gray-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-300">
                    <Route className="w-5 h-5" />
                    Custo de Viagem
                  </CardTitle>
                  <div className="text-sm text-gray-400">
                    Percurso: {breakdown.distance} km • Valor KM Rodado: {formatCurrency(
                      (breakdown.vehicleBreakdown.fuelCostPerKm + 
                       breakdown.vehicleBreakdown.ipvaCostPerKm + 
                       breakdown.vehicleBreakdown.insuranceCostPerKm + 
                       breakdown.vehicleBreakdown.maintenanceCostPerKm + 
                       breakdown.vehicleBreakdown.depreciationCostPerKm)
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Combustível editável */}
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-yellow-400">
                        <Fuel className="w-4 h-4 text-yellow-400" />
                        Combustível
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{formatCurrency(breakdown.vehicleBreakdown.totalFuelCost)}</span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingFuel(!editingFuel)} className="hover:bg-yellow-500/20">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingFuel && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <Label className="text-xs text-yellow-300">Preço/Litro (R$)</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editableFuelPrice}
                              onChange={(e) => setEditableFuelPrice(parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs bg-background/50 border-yellow-500/30"
                            />
                            <Button size="sm" onClick={handleSaveFuel} className="h-8 px-2 bg-green-600 hover:bg-green-700">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelEdit('fuel')} className="h-8 px-2 border-gray-500/50 text-gray-400 hover:bg-gray-500/10">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-yellow-300">Consumo (km/L)</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={editableFuelConsumption}
                              onChange={(e) => setEditableFuelConsumption(parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs bg-background/50 border-yellow-500/30"
                            />
                            <Button size="sm" onClick={handleSaveConsumption} className="h-8 px-2 bg-green-600 hover:bg-green-700">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelEdit('consumption')} className="h-8 px-2 border-gray-500/50 text-gray-400 hover:bg-gray-500/10">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outros custos do veículo */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                      <span className="text-sm text-blue-300">IPVA</span>
                      <span className="font-medium text-white">{formatCurrency(breakdown.vehicleBreakdown.totalIpvaCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                      <span className="text-sm text-blue-300">Seguro</span>
                      <span className="font-medium text-white">{formatCurrency(breakdown.vehicleBreakdown.totalInsuranceCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                      <span className="text-sm text-blue-300">Manutenção</span>
                      <span className="font-medium text-white">{formatCurrency(breakdown.vehicleBreakdown.totalMaintenanceCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                      <span className="text-sm text-blue-300">Depreciação</span>
                      <span className="font-medium text-white">{formatCurrency(breakdown.vehicleBreakdown.totalDepreciationCost)}</span>
                    </div>
                  </div>

                  {/* Pedágios editáveis */}
                  <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-orange-400">
                        Pedágios da Rota
                        <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">
                          {roundTrip ? "Ida e Volta" : "Apenas Ida"}
                        </Badge>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{formatCurrency(breakdown.vehicleBreakdown.totalTollCost)}</span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingToll(!editingToll)} className="hover:bg-orange-500/20">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingToll && (
                      <div className="flex gap-2 mt-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={editableTollCost}
                          onChange={(e) => setEditableTollCost(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs bg-background/50 border-orange-500/30"
                          placeholder={`Valor total (${roundTrip ? 'ida e volta' : 'apenas ida'})`}
                        />
                        <Button size="sm" onClick={handleSaveToll} className="h-8 px-2 bg-green-600 hover:bg-green-700">
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelEdit('toll')} className="h-8 px-2 border-gray-500/50 text-gray-400 hover:bg-gray-500/10">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {tollData?.tollStations && tollData.tollStations.length > 0 && !editingToll && (
                      <div className="mt-2 space-y-1">
                        {tollData.tollStations.map((toll, index) => (
                          <div key={index} className="flex justify-between text-xs text-orange-300">
                            <span>{toll.name} ({toll.location})</span>
                            <span>{formatCurrency(toll.cost)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hora Técnica de Viagem */}
                  {breakdown.laborBreakdown && (
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <div className="text-sm font-medium text-purple-400 mb-2">
                        👨‍💼 Hora Técnica de Viagem
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-purple-300 mb-2">
                        <span>Valor/hora: {formatCurrency(breakdown.laborBreakdown.hourlyRate)}</span>
                        <span>Tempo viagem: {breakdown.laborBreakdown.travelTimeHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-purple-300">Subtotal</span>
                        <span className="font-bold text-white">{formatCurrency(breakdown.baseLaborCost || 0)}</span>
                      </div>
                    </div>
                  )}

                  {/* Refeições */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-white flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-gray-400" />
                      Refeições
                    </h6>
                    
                    <div className="space-y-3">
                      {/* Café da Manhã */}
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                        <Label className="text-sm font-medium text-green-400 flex items-center gap-2 mb-2">
                          ☕ Café da Manhã
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-green-300">Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={mealCosts.breakfast}
                              onChange={(e) => setMealCosts({...mealCosts, breakfast: parseFloat(e.target.value) || 0})}
                              className="h-8 text-xs bg-background/50 border-green-500/30"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-green-300">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealQuantities.breakfast}
                              onChange={(e) => setMealQuantities({...mealQuantities, breakfast: parseInt(e.target.value) || 0})}
                              className="h-8 text-xs bg-background/50 border-green-500/30"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {mealCosts.breakfast > 0 && mealQuantities.breakfast > 0 && (
                          <div className="mt-2 text-xs text-green-400 font-medium">
                            Subtotal: {formatCurrency(mealCosts.breakfast * mealQuantities.breakfast)}
                          </div>
                        )}
                      </div>

                      {/* Almoço */}
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-green-500/30">
                        <Label className="text-sm font-medium text-green-400 flex items-center gap-2 mb-2">
                          🍽️ Almoço
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-300">Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={mealCosts.lunch}
                              onChange={(e) => setMealCosts({...mealCosts, lunch: parseFloat(e.target.value) || 0})}
                              className="h-8 text-xs bg-background/50 border-green-500/30 text-white"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-300">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealQuantities.lunch}
                              onChange={(e) => setMealQuantities({...mealQuantities, lunch: parseInt(e.target.value) || 0})}
                              className="h-8 text-xs bg-background/50 border-green-500/30 text-white"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {mealCosts.lunch > 0 && mealQuantities.lunch > 0 && (
                          <div className="mt-2 text-xs text-green-400 font-medium">
                            Subtotal: {formatCurrency(mealCosts.lunch * mealQuantities.lunch)}
                          </div>
                        )}
                      </div>

                      {/* Janta */}
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-green-500/30">
                        <Label className="text-sm font-medium text-green-400 flex items-center gap-2 mb-2">
                          🌙 Janta
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-gray-300">Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={mealCosts.dinner}
                              onChange={(e) => setMealCosts({...mealCosts, dinner: parseFloat(e.target.value) || 0})}
                              className="h-8 text-xs bg-background/50 border-green-500/30 text-white"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-300">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealQuantities.dinner}
                              onChange={(e) => setMealQuantities({...mealQuantities, dinner: parseInt(e.target.value) || 0})}
                              className="h-8 text-xs bg-background/50 border-green-500/30 text-white"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {mealCosts.dinner > 0 && mealQuantities.dinner > 0 && (
                          <div className="mt-2 text-xs text-green-400 font-medium">
                            Subtotal: {formatCurrency(mealCosts.dinner * mealQuantities.dinner)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Margem do Custo de Viagem */}
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Subtotal Viagem</span>
                      <span className="font-medium">{formatCurrency((breakdown.vehicleBreakdown.baseVehicleCost || 0) + (breakdown.baseLaborCost || 0) + (breakdown.totalMealCost || 0))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Margem (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={vehicleMargin}
                        onChange={(e) => setVehicleMargin(parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs w-20"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-600">
                        = {formatCurrency(((breakdown.vehicleBreakdown.baseVehicleCost || 0) + (breakdown.baseLaborCost || 0) + (breakdown.totalMealCost || 0)) * (vehicleMargin / 100))}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg border border-blue-500/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-400">Total Custo de Viagem</span>
                      <span className="font-bold text-white text-lg">{formatCurrency(breakdown.totalTravelCost || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card 2: Serviços (se existir) */}
            {breakdown.serviceBreakdown && (
              <Card className="bg-background/20 border border-gray-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-400">
                    <Wrench className="w-5 h-5" />
                    Serviços da Visita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-orange-500/30">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-orange-400">Serviço</div>
                        <div className="font-bold text-white">{breakdown.serviceBreakdown.serviceName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-400">Tipo</div>
                        <div className="font-bold text-white">
                          {breakdown.serviceBreakdown.pricingType === 'hourly' ? 'Por Hora' : 'Valor Fixo'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-400">Valor Unitário</div>
                        <div className="font-bold text-white">{formatCurrency(breakdown.serviceBreakdown.unitCost)}</div>
                        {breakdown.serviceBreakdown.pricingType === 'hourly' && breakdown.serviceBreakdown.estimatedHours && (
                          <div className="text-xs text-orange-400">
                            {breakdown.serviceBreakdown.estimatedHours}h × {formatCurrency(breakdown.serviceBreakdown.unitCost / breakdown.serviceBreakdown.estimatedHours)}/h
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-orange-400">Quantidade</div>
                        <div className="font-bold text-white">{breakdown.serviceBreakdown.quantity}x</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/50 rounded-lg border border-orange-500/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-400">Total Serviços</span>
                      <span className="font-bold text-white text-lg">{formatCurrency(breakdown.serviceBreakdown.totalServiceCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo Final */}
          <Card className="bg-background/20 border border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-gray-300">📋 Resumo da Visita Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid grid-cols-1 ${breakdown.serviceBreakdown ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-blue-500/30">
                  <div className="text-sm text-blue-400">Custo de Viagem</div>
                  <div className="text-lg font-bold text-white">{formatCurrency(breakdown.totalTravelCost || 0)}</div>
                  <div className="text-xs text-gray-400">Veículo + Hora Técnica + Refeições</div>
                </div>
                {breakdown.serviceBreakdown && (
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-orange-500/30">
                    <div className="text-sm text-orange-400">Serviços Técnicos</div>
                    <div className="text-lg font-bold text-white">{formatCurrency(breakdown.totalServiceCost || 0)}</div>
                    <div className="text-xs text-gray-400">{breakdown.serviceBreakdown.serviceName}</div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total Final */}
              <div className="p-4 bg-gray-800/50 rounded-lg border-2 border-green-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-400">💰 Total da Visita Técnica</span>
                  <Badge className="text-xl font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2">
                    {formatCurrency(breakdown.totalCost)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-green-400">
                  Custo por km: {formatCurrency(breakdown.totalCost / breakdown.distance)}/km
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableCalculatorResults;
