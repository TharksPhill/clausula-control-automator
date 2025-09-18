import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

import { Trash2, Edit } from "lucide-react";
import { useVehicleSettingsList } from "@/hooks/useVehicleSettingsList";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VehicleSettingsListProps {
  onEdit?: (id: string) => void;
}

const VehicleSettingsList = ({ onEdit }: VehicleSettingsListProps) => {
  const { vehicles, loading, deleteVehicle } = useVehicleSettingsList();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  const calculateCostPerKm = (vehicle: any) => {
    const fuelCostPerKm = vehicle.fuel_price / vehicle.fuel_consumption;
    const ipvaCostPerKm = vehicle.annual_ipva / vehicle.annual_mileage;
    const insuranceCostPerKm = vehicle.annual_insurance / vehicle.annual_mileage;
    const maintenanceCostPerKm = vehicle.annual_maintenance / vehicle.annual_mileage;
    const depreciationCostPerKm = (vehicle.purchase_value * (vehicle.depreciation_rate / 100)) / vehicle.annual_mileage;
    
    return fuelCostPerKm + ipvaCostPerKm + insuranceCostPerKm + maintenanceCostPerKm + depreciationCostPerKm;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-full mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum veículo encontrado</p>
        <p className="text-sm">Configure seu primeiro veículo para calcular custos operacionais.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Combustível</TableHead>
              <TableHead>Consumo</TableHead>
              <TableHead>Custo/KM</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{vehicle.brand} {vehicle.model}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.vehicle_type}</div>
                  </div>
                </TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>
                  {vehicle.license_plate ? (
                    <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                      {vehicle.license_plate}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{vehicle.fuel_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(vehicle.fuel_price)}/L
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {vehicle.fuel_consumption} km/L
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatCurrency(calculateCostPerKm(vehicle))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(vehicle.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VehicleSettingsList;