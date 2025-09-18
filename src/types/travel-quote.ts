export interface TravelQuoteData {
  // Dados da empresa
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  companyLogo?: string;
  responsibleName: string;

  // Dados do cliente
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientPhone?: string;
  clientAddress?: string;

  // Informações da viagem
  origin: string;
  destinations: Array<{
    label: string;
    address: string;
    services: string[];
    distance: number;
    duration: number;
    tollCost: number;
  }>;
  roundTrip: boolean;
  travelDate?: string;
  
  // Custos calculados
  costs: {
    totalDistance: number;
    totalDuration: number;
    totalTolls: number;
    fuelCost: number;
    vehicleCost: number;
    employeeCost: number;
    serviceCost: number;
    totalCost: number;
  };

  // Configurações
  validityDays: number;
  notes?: string;
}

export interface TravelCostBreakdown {
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  category: 'distance' | 'time' | 'service' | 'vehicle' | 'employee' | 'other';
}