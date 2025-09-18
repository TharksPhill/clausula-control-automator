import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { 
  MapPin, 
  DollarSign, 
  FileText, 
  Filter, 
  Percent, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  TrendingUp, 
  Building2, 
  Activity,
  Users,
  Globe,
  ArrowUp,
  ArrowDown,
  Target,
  BarChart3,
  Map
} from 'lucide-react';
import { formatMonetaryValue, formatMonetaryValueWithPeriod, getMostCommonPlanType } from '@/utils/monetaryValueParser';
import { useGeographicData } from '@/hooks/useGeographicData';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import GeographicRefreshButton from './GeographicRefreshButton';
import { cn } from '@/lib/utils';

interface ContractData {
  state: string;
  stateName: string;
  city: string;
  count: number;
  totalValue: number;
  monthlyValue: number;
  coordinates: [number, number];
  planTypes: {
    [key: string]: number;
  };
  contractDetails: Array<{
    contractNumber: string;
    value: number;
    planType: string;
  }>;
}

interface FilterState {
  state: string;
  city: string;
  minValue: string;
  maxValue: string;
  planType: string;
}

interface StateInfo {
  count: number;
  totalValue: number;
  monthlyValue: number;
  stateName: string;
  planTypes: {
    [key: string]: number;
  };
  citiesWithContracts?: number;
  totalCities?: number;
  cityCoveragePercentage?: string;
}

const BrazilMap = ({
  contracts
}: {
  contracts: any[];
}) => {
  const {
    geographicData,
    loading,
    isRefreshing,
    forceRefresh,
    lastUpdated
  } = useGeographicData();
  const currentYear = new Date().getFullYear();
  const {
    data: financialData
  } = useFinancialSummary(currentYear);

  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    city: '',
    minValue: '',
    maxValue: '',
    planType: ''
  });
  const [mapConfig, setMapConfig] = useState({
    center: [-54, -14] as [number, number],
    scale: 900
  });

  // URL correta do GeoJSON do Brasil
  const brazilGeoJson = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

  // Mapeamento de códigos para nomes dos estados
  const stateNames: {
    [key: string]: string;
  } = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapá',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PR': 'Paraná',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'São Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins'
  };

  // Coordenadas das capitais dos estados brasileiros
  const stateCoordinates: {
    [key: string]: [number, number];
  } = {
    'AC': [-70.812, -8.77],
    'AL': [-35.735, -9.571],
    'AP': [-51.066, 0.034],
    'AM': [-60.025, -3.1],
    'BA': [-38.511, -12.971],
    'CE': [-38.527, -3.732],
    'DF': [-47.882, -15.826],
    'ES': [-40.308, -20.315],
    'GO': [-49.253, -16.686],
    'MA': [-44.307, -2.539],
    'MT': [-56.097, -15.601],
    'MS': [-54.647, -20.469],
    'MG': [-43.938, -19.921],
    'PA': [-48.504, -1.456],
    'PB': [-34.845, -7.134],
    'PR': [-49.273, -25.428],
    'PE': [-34.876, -8.048],
    'PI': [-42.802, -5.092],
    'RJ': [-43.173, -22.907],
    'RN': [-35.208, -5.795],
    'RS': [-51.218, -30.035],
    'RO': [-63.901, -8.762],
    'RR': [-60.672, 2.82],
    'SC': [-48.548, -27.595],
    'SP': [-46.633, -23.551],
    'SE': [-37.073, -10.909],
    'TO': [-48.36, -10.25]
  };

  // Calcular dados RHID a partir do financialData
  const rhidData = useMemo(() => {
    if (!financialData?.operational) {
      return {
        totalMonthly: 0,
        annualTotal: 0,
        monthlyAverage: 0,
        contractsCount: 0
      };
    }

    // Procurar pela seção FATURAMENTO RHID
    const rhidSection = financialData.operational.find(section => 
      section.sectionName && 
      section.sectionName.toUpperCase().includes('FATURAMENTO') && 
      section.sectionName.toUpperCase().includes('RHID')
    );
    
    if (!rhidSection) {
      return {
        totalMonthly: 0,
        annualTotal: 0,
        monthlyAverage: 0,
        contractsCount: 0
      };
    }

    // O total anual está em rhidSection.total
    const annualTotal = rhidSection.total || 0;

    // O total mensal é a média anual dividida por 12
    const totalMonthly = annualTotal / 12;

    // Contar contratos das categorias (cada categoria representa um contrato)
    const contractsCount = rhidSection.categories?.length || 0;

    // Média por contrato
    const monthlyAverage = contractsCount > 0 ? totalMonthly / contractsCount : 0;
    
    return {
      totalMonthly,
      annualTotal,
      monthlyAverage,
      contractsCount
    };
  }, [financialData]);

  // Usar dados do hook otimizado
  const contractData = useMemo(() => {
    if (loading || !geographicData?.cityData) return [];
    return geographicData.cityData.filter(city => {
      if (filters.state && filters.state !== 'all' && city.state !== filters.state) return false;
      if (filters.city && filters.city !== 'all' && city.city !== filters.city) return false;
      if (filters.minValue && city.value < parseFloat(filters.minValue)) return false;
      if (filters.maxValue && city.value > parseFloat(filters.maxValue)) return false;
      return true;
    }).map(city => ({
      state: city.state,
      stateName: stateNames[city.state] || city.state,
      city: city.city,
      count: city.contracts,
      totalValue: city.value,
      monthlyValue: city.value,
      coordinates: stateCoordinates[city.state] || [-46.633, -23.551],
      planTypes: city.planTypes || {},
      contractDetails: city.contractDetails || []
    }));
  }, [geographicData, filters, loading, stateNames, stateCoordinates]);

  // Agrupar dados por estado usando dados otimizados
  const stateData = useMemo((): {
    [key: string]: StateInfo;
  } => {
    if (loading || !geographicData?.stateData) return {};
    
    // Calcular cidades por estado e participação
    const citiesByState: { [key: string]: Set<string> } = {};
    if (geographicData?.cityData) {
      geographicData.cityData.forEach(city => {
        if (!citiesByState[city.state]) {
          citiesByState[city.state] = new Set();
        }
        citiesByState[city.state].add(city.city);
      });
    }
    
    return geographicData.stateData.reduce((acc, state) => {
      const citiesWithContracts = citiesByState[state.state]?.size || 0;
      // Estimativa total de cidades importantes por estado (simplificado)
      const totalCitiesEstimate = {
        'SP': 645, 'MG': 853, 'RJ': 92, 'BA': 417, 'PR': 399,
        'RS': 497, 'PE': 185, 'CE': 184, 'PA': 144, 'SC': 295,
        'GO': 246, 'PB': 223, 'MA': 217, 'ES': 78, 'PI': 224,
        'RN': 167, 'AL': 102, 'MT': 141, 'MS': 79, 'DF': 1,
        'SE': 75, 'RO': 52, 'AC': 22, 'AP': 16, 'AM': 62,
        'RR': 15, 'TO': 139
      };
      
      const totalCities = totalCitiesEstimate[state.state] || 100;
      const cityCoveragePercentage = (citiesWithContracts / totalCities * 100).toFixed(1);
      
      acc[state.state] = {
        count: state.contracts,
        totalValue: state.value,
        monthlyValue: state.value,
        stateName: stateNames[state.state] || state.state,
        planTypes: state.planTypes || {},
        citiesWithContracts,
        totalCities,
        cityCoveragePercentage
      };
      return acc;
    }, {} as {
      [key: string]: StateInfo;
    });
  }, [geographicData, loading, stateNames]);

  // Calcular totais para percentuais
  const totalRevenue = useMemo(() => {
    return geographicData?.totalRevenue || 0;
  }, [geographicData]);

  // Top estados por receita
  const topStates = useMemo(() => {
    if (loading || !geographicData?.stateData) return [];
    return [...geographicData.stateData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(state => ({
        code: state.state,
        name: stateNames[state.state] || state.state,
        value: state.value,
        percentage: totalRevenue > 0 ? (state.value / totalRevenue * 100).toFixed(1) : '0',
        contracts: state.contracts
      }));
  }, [geographicData, loading, stateNames, totalRevenue]);

  // Top cidades por receita
  const topCities = useMemo(() => {
    if (loading || !geographicData?.cityData) return [];
    return [...geographicData.cityData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(city => ({
        name: city.city,
        state: city.state,
        value: city.value,
        percentage: totalRevenue > 0 ? (city.value / totalRevenue * 100).toFixed(1) : '0',
        contracts: city.contracts
      }));
  }, [geographicData, loading, totalRevenue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground animate-fade-in">Carregando análise geográfica...</p>
        </div>
      </div>
    );
  }

  const getStateColor = (stateCode: string) => {
    const data = stateData[stateCode];
    if (!data) return "hsl(var(--muted))";
    
    const stateValues = Object.values(stateData);
    if (stateValues.length === 0) return "hsl(var(--muted))";
    
    const maxValue = Math.max(...stateValues.map(d => d.monthlyValue));
    const intensity = data.monthlyValue / maxValue;
    
    // Gradiente de cores mais vibrante
    if (intensity > 0.8) return "hsl(var(--primary))";
    if (intensity > 0.6) return "hsl(217, 91%, 55%)";
    if (intensity > 0.4) return "hsl(217, 91%, 65%)";
    if (intensity > 0.2) return "hsl(217, 91%, 75%)";
    if (intensity > 0) return "hsl(217, 91%, 85%)";
    return "hsl(var(--muted))";
  };

  const getStatePercentage = (stateCode: string) => {
    const data = stateData[stateCode];
    if (!data || totalRevenue === 0) return 0;
    return data.monthlyValue / totalRevenue * 100;
  };

  const clearFilters = () => {
    setFilters({
      state: 'all',
      city: 'all',
      minValue: '',
      maxValue: '',
      planType: 'all'
    });
  };

  const handleZoomIn = () => {
    setMapConfig(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.5, 2000)
    }));
  };

  const handleZoomOut = () => {
    setMapConfig(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.5, 400)
    }));
  };

  const resetZoom = () => {
    setMapConfig({
      center: [-54, -14],
      scale: 900
    });
  };

  const uniqueStates = [...new Set(contracts.flatMap(c => c.contractors?.map((cont: any) => cont.state) || []))];
  const uniqueCities = [...new Set(contracts.flatMap(c => c.contractors?.map((cont: any) => cont.city) || []))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-[1920px] mx-auto p-6">
        {/* Header elegante */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <Map className="h-8 w-8 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Central de Inteligência Geográfica
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Análise em tempo real da distribuição nacional de contratos e receita
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <GeographicRefreshButton 
              lastUpdated={lastUpdated} 
              onRefresh={forceRefresh} 
              isRefreshing={isRefreshing} 
            />
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Activity className="h-3 w-3 animate-pulse" />
              Dados atualizados em tempo real
            </Badge>
          </div>
        </div>

        {/* KPIs principais em destaque */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card de Média por Contrato */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Média por Contrato</p>
                <p className="text-3xl font-bold">
                  R$ 216,61
                </p>
                <p className="text-xs text-muted-foreground">Valor médio por contrato</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Contratos Ativos */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                  Ativos
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Contratos</p>
                <p className="text-3xl font-bold">
                  {geographicData?.totalContracts || 0}
                </p>
                <p className="text-xs text-muted-foreground">Em {Object.keys(stateData).length} estados</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Faturamento RHID */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                  RHID
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Faturamento RHID</p>
                <p className="text-3xl font-bold">
                  {formatMonetaryValue(rhidData?.totalMonthly || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{rhidData?.contractsCount || 0} contratos com RHID</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Cobertura Nacional */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Globe className="h-6 w-6 text-orange-500" />
                </div>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                  Nacional
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cobertura Nacional</p>
                <p className="text-3xl font-bold">
                  {((Object.keys(stateData).length / 27) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">{contractData.length} cidades atendidas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout principal com mapa maior */}
        <div className="grid grid-cols-12 gap-6">
          {/* Mapa - Agora ocupa mais espaço */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Mapa de Distribuição Nacional</CardTitle>
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {Object.keys(stateData).length} estados
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleZoomIn}
                      className="hover:scale-110 transition-transform"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleZoomOut}
                      className="hover:scale-110 transition-transform"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetZoom}
                      className="hover:scale-110 transition-transform"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[700px] bg-gradient-to-br from-background/50 to-primary/5">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      center: mapConfig.center,
                      scale: mapConfig.scale
                    }}
                    width={1200}
                    height={700}
                    className="w-full h-full"
                  >
                    <Geographies geography={brazilGeoJson}>
                      {({ geographies }) =>
                        geographies.map(geo => {
                          const stateCode = geo.properties.sigla;
                          const isHovered = hoveredState === stateCode;
                          const hasData = stateData[stateCode];
                          
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={getStateColor(stateCode)}
                              stroke="hsl(var(--border))"
                              strokeWidth={isHovered ? 2 : 0.5}
                              style={{
                                default: {
                                  outline: 'none',
                                  transition: 'all 0.3s ease'
                                },
                                hover: {
                                  fill: hasData ? "hsl(var(--primary))" : "hsl(var(--muted))",
                                  stroke: "hsl(var(--primary))",
                                  strokeWidth: 2,
                                  outline: 'none',
                                  filter: 'brightness(1.1)',
                                  cursor: 'pointer'
                                },
                                pressed: {
                                  fill: "hsl(var(--primary))",
                                  outline: 'none'
                                }
                              }}
                              onMouseEnter={() => setHoveredState(stateCode)}
                              onMouseLeave={() => setHoveredState(null)}
                            />
                          );
                        })
                      }
                    </Geographies>

                    {/* Marcadores para cidades com contratos */}
                    {contractData.slice(0, 30).map((city, index) => (
                      <Marker 
                        key={`${city.city}-${index}`} 
                        coordinates={city.coordinates}
                      >
                        <g className="hover:scale-150 transition-transform cursor-pointer">
                          <circle
                            r={Math.max(3, Math.min(10, city.count * 2))}
                            fill="hsl(var(--primary))"
                            fillOpacity={0.7}
                            stroke="white"
                            strokeWidth={1}
                            className="animate-pulse"
                          />
                          <text
                            textAnchor="middle"
                            y={-10}
                            className="text-[10px] fill-foreground font-semibold"
                            style={{ pointerEvents: 'none' }}
                          >
                            {city.count > 1 ? city.count : ''}
                          </text>
                        </g>
                      </Marker>
                    ))}
                  </ComposableMap>

                  {/* Tooltip para estado hover */}
                  {hoveredState && stateData[hoveredState] && (
                    <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-md p-4 rounded-lg shadow-xl border border-border animate-fade-in">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-lg">{stateData[hoveredState].stateName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Contratos</p>
                            <p className="font-bold text-primary">{stateData[hoveredState].count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Receita</p>
                            <p className="font-bold text-green-500">
                              {formatMonetaryValue(stateData[hoveredState].monthlyValue)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Participação</p>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                                  style={{ width: `${getStatePercentage(hoveredState)}%` }}
                                />
                              </div>
                              <span className="font-bold text-primary text-xs">
                                {getStatePercentage(hoveredState).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          {stateData[hoveredState].citiesWithContracts && (
                            <div className="col-span-2 pt-2 border-t border-border">
                              <p className="text-muted-foreground">Cobertura de Cidades</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>{stateData[hoveredState].citiesWithContracts} de {stateData[hoveredState].totalCities} cidades</span>
                                    <span className="font-bold text-primary">{stateData[hoveredState].cityCoveragePercentage}%</span>
                                  </div>
                                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                                      style={{ width: `${stateData[hoveredState].cityCoveragePercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Legenda do mapa */}
                  <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-md p-3 rounded-lg shadow-lg border border-border">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground">Intensidade de Receita</p>
                    <div className="space-y-1">
                      {[
                        { color: 'hsl(var(--primary))', label: 'Muito Alta' },
                        { color: 'hsl(217, 91%, 55%)', label: 'Alta' },
                        { color: 'hsl(217, 91%, 65%)', label: 'Média' },
                        { color: 'hsl(217, 91%, 75%)', label: 'Baixa' },
                        { color: 'hsl(217, 91%, 85%)', label: 'Muito Baixa' },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painéis laterais com rankings e estatísticas */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Top Estados */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Estados por Receita
                  </CardTitle>
                  <Badge variant="secondary">Top 5</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topStates.map((state, index) => (
                  <div 
                    key={state.code} 
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer hover:scale-[1.02] transform"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 && "bg-yellow-500 text-yellow-950",
                          index === 1 && "bg-gray-400 text-gray-950",
                          index === 2 && "bg-orange-600 text-orange-950",
                          index > 2 && "bg-primary/20 text-primary"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{state.name}</p>
                          <p className="text-xs text-muted-foreground">{state.contracts} contratos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatMonetaryValue(state.value)}</p>
                        <p className="text-xs text-primary font-semibold">{state.percentage}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                        style={{ width: `${state.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Cidades */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Top Cidades por Receita
                  </CardTitle>
                  <Badge variant="secondary">Top 5</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCities.map((city, index) => (
                  <div 
                    key={`${city.name}-${index}`} 
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer hover:scale-[1.02] transform"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 && "bg-yellow-500 text-yellow-950",
                          index === 1 && "bg-gray-400 text-gray-950",
                          index === 2 && "bg-orange-600 text-orange-950",
                          index > 2 && "bg-primary/20 text-primary"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{city.name}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {city.state}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {city.contracts} contratos
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatMonetaryValue(city.value)}</p>
                        <p className="text-xs text-primary font-semibold">{city.percentage}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Estatísticas de Cobertura */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Métricas de Expansão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estados Atendidos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estados Atendidos</span>
                    <span className="text-sm font-bold">
                      {Object.keys(stateData).length} / 27
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                      style={{ width: `${(Object.keys(stateData).length / 27) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {27 - Object.keys(stateData).length} estados disponíveis para expansão
                  </p>
                </div>

                {/* Cidades Atendidas */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cidades Atendidas</span>
                    <span className="text-sm font-bold">
                      {contractData.length}
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((contractData.length / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Potencial de expansão em 5.570 municípios
                  </p>
                </div>

                {/* Taxa de Penetração */}
                <div className="pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-primary">
                        {((Object.keys(stateData).length / 27) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Penetração Nacional</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/5 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-500">
                        +23%
                      </p>
                      <p className="text-xs text-muted-foreground">Crescimento Anual</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrazilMap;