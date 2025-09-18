import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Settings, DollarSign } from "lucide-react";
import { useVehicleSetting, VehicleSettingsFormData } from "@/hooks/useVehicleSetting";

interface VehicleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
  onSave?: () => void;
}

const VehicleSettingsModal = ({ isOpen, onClose, editingId, onSave }: VehicleSettingsModalProps) => {
  const { settings, loading, saveSettings } = useVehicleSetting(editingId);
  const [formData, setFormData] = useState<VehicleSettingsFormData>({
    brand: "",
    model: "",
    year: 2025,
    license_plate: "",
    vehicle_type: "Passeio",
    fuel_type: "Gasolina",
    purchase_value: 0,
    current_estimated_value: 0,
    annual_ipva: 0,
    annual_insurance: 0,
    annual_maintenance: 0,
    fuel_consumption: 0,
    annual_mileage: 0,
    depreciation_rate: 0,
    fuel_price: 0
  });

  useEffect(() => {
    if (isOpen && !editingId) {
      // Reset form for new entry
      setFormData({
        brand: "",
        model: "",
        year: 2025,
        license_plate: "",
        vehicle_type: "Passeio",
        fuel_type: "Gasolina",
        purchase_value: 0,
        current_estimated_value: 0,
        annual_ipva: 0,
        annual_insurance: 0,
        annual_maintenance: 0,
        fuel_consumption: 0,
        annual_mileage: 0,
        depreciation_rate: 0,
        fuel_price: 0
      });
    } else if (settings && editingId) {
      // Load data for editing
      setFormData({
        brand: settings.brand,
        model: settings.model,
        year: settings.year,
        license_plate: settings.license_plate || "",
        vehicle_type: settings.vehicle_type,
        fuel_type: settings.fuel_type,
        purchase_value: settings.purchase_value,
        current_estimated_value: settings.current_estimated_value,
        annual_ipva: settings.annual_ipva,
        annual_insurance: settings.annual_insurance,
        annual_maintenance: settings.annual_maintenance,
        fuel_consumption: settings.fuel_consumption,
        annual_mileage: settings.annual_mileage,
        depreciation_rate: settings.depreciation_rate,
        fuel_price: settings.fuel_price
      });
    }
  }, [settings, isOpen, editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveSettings(formData);
    if (result) {
      onSave?.(); // Trigger refresh in parent component
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const parseFormattedNumber = (value: string) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            {editingId ? 'Editar Veículo' : 'Adicionar Veículo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="costs" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Custos Anuais
              </TabsTrigger>
              <TabsTrigger value="operational" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Operacional
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ex: Toyota"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: Corolla"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2025 })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="license_plate">Placa</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
                  <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passeio">Passeio</SelectItem>
                      <SelectItem value="Utilitário">Utilitário</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Caminhão">Caminhão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fuel_type">Combustível</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_value">Valor de Compra (R$) *</Label>
                  <Input
                    id="purchase_value"
                    value={formData.purchase_value ? formatNumber(formData.purchase_value) : ''}
                    onChange={(e) => setFormData({ ...formData, purchase_value: parseFormattedNumber(e.target.value) })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="current_estimated_value">Valor Atual Estimado (R$)</Label>
                  <Input
                    id="current_estimated_value"
                    value={formData.current_estimated_value ? formatNumber(formData.current_estimated_value) : ''}
                    onChange={(e) => setFormData({ ...formData, current_estimated_value: parseFormattedNumber(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="costs" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="annual_ipva">IPVA Anual (R$)</Label>
                  <Input
                    id="annual_ipva"
                    value={formData.annual_ipva ? formatNumber(formData.annual_ipva) : ''}
                    onChange={(e) => setFormData({ ...formData, annual_ipva: parseFormattedNumber(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="annual_insurance">Seguro Anual (R$)</Label>
                  <Input
                    id="annual_insurance"
                    value={formData.annual_insurance ? formatNumber(formData.annual_insurance) : ''}
                    onChange={(e) => setFormData({ ...formData, annual_insurance: parseFormattedNumber(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="annual_maintenance">Manutenção Anual (R$)</Label>
                  <Input
                    id="annual_maintenance"
                    value={formData.annual_maintenance ? formatNumber(formData.annual_maintenance) : ''}
                    onChange={(e) => setFormData({ ...formData, annual_maintenance: parseFormattedNumber(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="depreciation_rate">Taxa Depreciação (%)</Label>
                  <Input
                    id="depreciation_rate"
                    value={formData.depreciation_rate ? formData.depreciation_rate.toString().replace('.', ',') : ''}
                    onChange={(e) => setFormData({ ...formData, depreciation_rate: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="annual_mileage">Quilometragem Anual (km)</Label>
                  <Input
                    id="annual_mileage"
                    value={formData.annual_mileage ? formatNumber(formData.annual_mileage) : ''}
                    onChange={(e) => setFormData({ ...formData, annual_mileage: parseFormattedNumber(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
            
              <TabsContent value="operational" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuel_consumption">Consumo (km/L)</Label>
                    <Input
                      id="fuel_consumption"
                      value={formData.fuel_consumption ? formData.fuel_consumption.toString().replace('.', ',') : ''}
                      onChange={(e) => setFormData({ ...formData, fuel_consumption: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fuel_price">Preço do Combustível (R$/L)</Label>
                    <Input
                      id="fuel_price"
                      value={formData.fuel_price ? formData.fuel_price.toString().replace('.', ',') : ''}
                      onChange={(e) => setFormData({ ...formData, fuel_price: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {editingId ? 'Atualizar' : 'Adicionar'} Veículo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleSettingsModal;