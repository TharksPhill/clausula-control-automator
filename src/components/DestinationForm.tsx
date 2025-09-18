import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalVisitServices } from "@/hooks/useTechnicalVisitServices";
import { MapPin, Building, Search, Wrench, Plus } from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";

interface DestinationData {
  id: string;
  label: string;
  contractId: string;
  contractorId: string;
  address: string;
  selectedServices: string[];
  serviceQuantities: { [serviceId: string]: number };
  useContractAddress: boolean;
}

interface DestinationFormProps {
  destination: DestinationData;
  onUpdate: (updates: Partial<DestinationData>) => void;
}

const DestinationForm = ({ destination, onUpdate }: DestinationFormProps) => {
  const { services } = useTechnicalVisitServices();
  const [contractFilter, setContractFilter] = useState("");

  const { data: contracts } = useQuery({
    queryKey: ['contracts-for-calculator'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq('status', 'Ativo');

      if (error) throw error;
      return data;
    }
  });

  // Filtrar contratos com base no filtro de busca
  const filteredContracts = contracts?.filter(contract => {
    if (!contractFilter) return true;
    
    const contractText = `${contract.contract_number} ${contract.contractors?.map(c => c.name).join(' ')}`.toLowerCase();
    return contractText.includes(contractFilter.toLowerCase());
  }) || [];

  const selectedContract = contracts?.find(c => c.id === destination.contractId);
  const selectedContractor = selectedContract?.contractors?.find(c => c.id === destination.contractorId);

  const addService = () => {
    if (services.length > 0) {
      const firstService = services[0];
      onUpdate({
        selectedServices: [...destination.selectedServices, firstService.id],
        serviceQuantities: {
          ...destination.serviceQuantities,
          [firstService.id]: 1
        }
      });
    }
  };

  const removeService = (serviceId: string) => {
    const newServices = destination.selectedServices.filter(id => id !== serviceId);
    const newQuantities = { ...destination.serviceQuantities };
    delete newQuantities[serviceId];
    
    onUpdate({
      selectedServices: newServices,
      serviceQuantities: newQuantities
    });
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    onUpdate({
      serviceQuantities: {
        ...destination.serviceQuantities,
        [serviceId]: Math.max(1, quantity)
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          {destination.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção de Destino */}
        <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <Building className="w-5 h-5" />
            <h3 className="font-semibold">Endereço do Cliente</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id={`use-contract-${destination.id}`}
                checked={destination.useContractAddress}
                onCheckedChange={(checked) => onUpdate({ useContractAddress: checked })}
              />
              <Label htmlFor={`use-contract-${destination.id}`} className="text-sm font-medium">
                Usar endereço do contrato
              </Label>
            </div>

            {destination.useContractAddress ? (
              <div className="space-y-3">
                {/* Filtro de contratos */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número do contrato ou nome do cliente..."
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Seleção de contrato */}
                <Select value={destination.contractId} onValueChange={(value) => onUpdate({ contractId: value, contractorId: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredContracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Contrato: {contract.contract_number}</span>
                          <span className="text-sm text-gray-500">
                            {contract.contractors?.map(c => c.name).join(', ')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Seleção de contratante (se houver múltiplos) */}
                {selectedContract && selectedContract.contractors && selectedContract.contractors.length > 0 && (
                  <Select value={destination.contractorId} onValueChange={(value) => onUpdate({ contractorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o contratante" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedContract.contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{contractor.name}</span>
                            <span className="text-sm text-gray-500">
                              {contractor.address}, {contractor.city} - {contractor.state}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedContractor && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-sm">
                      <p className="font-medium text-green-800">{selectedContractor.name}</p>
                      <p className="text-green-700">
                        {selectedContractor.address}, {selectedContractor.city} - {selectedContractor.state}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AddressAutocomplete
                value={destination.address}
                onChange={(value) => onUpdate({ address: value })}
                placeholder="Digite o endereço de destino manualmente"
                label="Endereço de Destino"
              />
            )}
          </div>
        </div>

        {/* Seção de Serviços */}
        <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-800">
              <Wrench className="w-5 h-5" />
              <h3 className="font-semibold">Serviços Selecionados</h3>
            </div>
            <Button
              onClick={addService}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              disabled={services.length === 0}
            >
              <Plus className="w-4 h-4" />
              Adicionar Serviço
            </Button>
          </div>

          {destination.selectedServices.length === 0 ? (
            <div className="text-center py-6 text-purple-600">
              <p className="text-sm">Nenhum serviço selecionado</p>
              <p className="text-xs text-purple-500 mt-1">
                Clique em "Adicionar Serviço" para incluir serviços específicos para este destino
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {destination.selectedServices.map((serviceId, index) => {
                const service = services.find(s => s.id === serviceId);
                if (!service) return null;

                return (
                  <div key={`${serviceId}-${index}`} className="p-3 bg-white border border-purple-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <Select
                          value={serviceId}
                          onValueChange={(newServiceId) => {
                            const newServices = [...destination.selectedServices];
                            newServices[index] = newServiceId;
                            const newQuantities = { ...destination.serviceQuantities };
                            delete newQuantities[serviceId];
                            newQuantities[newServiceId] = destination.serviceQuantities[serviceId] || 1;
                            onUpdate({
                              selectedServices: newServices,
                              serviceQuantities: newQuantities
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((srv) => (
                              <SelectItem key={srv.id} value={srv.id}>
                                {srv.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => removeService(serviceId)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        Remover
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`quantity-${serviceId}`} className="text-sm">
                          Quantidade:
                        </Label>
                        <Input
                          id={`quantity-${serviceId}`}
                          type="number"
                          min="1"
                          value={destination.serviceQuantities[serviceId] || 1}
                          onChange={(e) => updateServiceQuantity(serviceId, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {service.pricing_type === 'fixed' 
                          ? `Preço fixo: R$ ${service.fixed_price || 0}`
                          : `Por hora: ${service.estimated_hours || 0}h estimadas`
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DestinationForm;