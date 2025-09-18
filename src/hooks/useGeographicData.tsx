
import { useState, useEffect, useMemo, useCallback } from "react";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { getLatestContractValue, convertToMonthlyEquivalent } from "@/utils/monetaryValueParser";

export const useGeographicData = () => {
  const { contracts, loading, refetchContracts } = useContracts();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Forçar atualização com feedback visual
  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    console.log("🔄 Forçando atualização dos dados geográficos...");
    
    try {
      await refetchContracts();
      toast({
        title: "Dados atualizados",
        description: "Distribuição geográfica sincronizada com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao atualizar dados:", error);
      toast({
        title: "Erro na atualização",
        description: "Falha ao sincronizar os dados",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchContracts, toast]);

  // Processar dados geográficos mantendo os valores originais por período
  const geographicData = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return {
        processedAt: new Date().toISOString(),
        regionalData: [],
        stateData: [],
        cityData: [],
        totalRevenue: 0,
        totalContracts: 0
      };
    }

    console.log(`[GEO_DATA] 🌍 Processando ${contracts.length} contratos (${new Date().toLocaleTimeString()})`);

    const regionsMap = new Map();
    const statesMap = new Map();
    const citiesMap = new Map();
    let totalRevenue = 0;
    let totalContracts = 0;

    // Definição das regiões
    const REGIONS = {
      Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
      Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
      CentroOeste: ['DF', 'GO', 'MT', 'MS'],
      Sudeste: ['ES', 'MG', 'RJ', 'SP'],
      Sul: ['PR', 'RS', 'SC']
    };

    contracts.forEach(contract => {
      if (!contract.contractors || contract.contractors.length === 0) return;

      // Processar o contrato apenas uma vez, independente do número de contratantes
      const originalValue = getLatestContractValue(contract);
      const planType = contract.plan_type || 'mensal';
      
      // Converter valor para equivalente mensal
      const monthlyValue = convertToMonthlyEquivalent(originalValue, planType);
      
      totalRevenue += monthlyValue;
      totalContracts++;

      console.log(`[GEO_DATA] 📋 Contrato ${contract.contract_number}: R$ ${originalValue} (${planType}) → R$ ${monthlyValue}/mês (${contract.contractors.length} contratantes)`);

      // Para cada contratante, apenas contabilizar a presença geográfica, não o valor
      contract.contractors.forEach((contractor: any, index: number) => {
        const state = contractor.state;
        const city = contractor.city;
        
        if (!state || !city) return;

        // Buscar região do estado
        const region = Object.keys(REGIONS).find(r => 
          REGIONS[r as keyof typeof REGIONS].includes(state)
        );

        if (!region) return;

        // Para o primeiro contratante, adicionar o valor completo do contrato
        // Para os demais, apenas incrementar contador de contratos sem adicionar valor
        const shouldAddValue = index === 0;
        const valueToAdd = shouldAddValue ? monthlyValue : 0;  // Usar valor mensal normalizado
        const contractsToAdd = shouldAddValue ? 1 : 0;

        console.log(`[GEO_DATA] 👤 Contratante ${index + 1}/${contract.contractors.length} em ${city}/${state}: ${shouldAddValue ? `R$ ${monthlyValue}/mês` : 'sem valor adicional'}`);

        // Dados por região
        const regionData = regionsMap.get(region) || {
          region,
          contracts: 0,
          value: 0,
          activeContracts: 0,
          cities: new Set(),
          planTypes: new Map()
        };
        regionData.contracts += contractsToAdd;
        regionData.value += valueToAdd;
        if (contract.status === 'Ativo' && shouldAddValue) regionData.activeContracts++;
        regionData.cities.add(city);
        
        if (shouldAddValue) {
          const currentCount = regionData.planTypes.get(planType) || 0;
          regionData.planTypes.set(planType, currentCount + 1);
        }
        
        regionsMap.set(region, regionData);

        // Dados por estado
        const stateData = statesMap.get(state) || {
          state,
          contracts: 0,
          value: 0,
          activeContracts: 0,
          cities: new Set(),
          planTypes: new Map()
        };
        stateData.contracts += contractsToAdd;
        stateData.value += valueToAdd;
        if (contract.status === 'Ativo' && shouldAddValue) stateData.activeContracts++;
        stateData.cities.add(city);
        
        if (shouldAddValue) {
          const stateCurrentCount = stateData.planTypes.get(planType) || 0;
          stateData.planTypes.set(planType, stateCurrentCount + 1);
        }
        
        statesMap.set(state, stateData);

        // Dados por cidade - sempre incrementar contratos, mas valor apenas uma vez por contrato
        const cityKey = `${city}-${state}`;
        const cityData = citiesMap.get(cityKey) || {
          city,
          state,
          contracts: 0,
          value: 0,
          activeContracts: 0,
          planTypes: new Map(),
          contractDetails: []
        };
        
        // Se é o primeiro contratante do contrato nesta cidade, adicionar valor
        // Senão, apenas verificar se já existe este contrato nos detalhes
        const existingContract = cityData.contractDetails.find(
          detail => detail.contractNumber === contract.contract_number
        );
        
        if (!existingContract) {
          cityData.contracts++;
          cityData.value += monthlyValue;  // Usar valor mensal normalizado
          if (contract.status === 'Ativo') cityData.activeContracts++;
          
          const cityCurrentCount = cityData.planTypes.get(planType) || 0;
          cityData.planTypes.set(planType, cityCurrentCount + 1);
          
          // Adicionar detalhes do contrato para referência
          cityData.contractDetails.push({
            contractNumber: contract.contract_number,
            value: monthlyValue,  // Usar valor mensal normalizado
            planType: planType
          });
          
          console.log(`[GEO_DATA] 🏙️ Novo contrato adicionado em ${city}/${state}: R$ ${monthlyValue}/mês`);
        } else {
          console.log(`[GEO_DATA] 🔄 Contrato ${contract.contract_number} já existe em ${city}/${state}, pulando valor`);
        }
        
        citiesMap.set(cityKey, cityData);
      });
    });

    const result = {
      processedAt: new Date().toISOString(),
      regionalData: Array.from(regionsMap.values()).map(region => ({
        ...region,
        cities: region.cities.size,
        planTypes: Object.fromEntries(region.planTypes)
      })),
      stateData: Array.from(statesMap.values()).map(state => ({
        ...state,
        cities: state.cities.size,
        planTypes: Object.fromEntries(state.planTypes)
      })).sort((a, b) => b.value - a.value),
      cityData: Array.from(citiesMap.values()).map(city => ({
        ...city,
        planTypes: Object.fromEntries(city.planTypes)
      })).sort((a, b) => b.value - a.value),
      totalRevenue,
      totalContracts
    };

    console.log(`[GEO_DATA] ✅ Processamento concluído: ${totalContracts} contratos únicos, R$ ${totalRevenue.toFixed(2)} receita mensal total`);
    
    return result;
  }, [contracts]);

  // Auto-refresh quando há mudanças importantes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && contracts && contracts.length > 0) {
        console.log("🔍 Página visível novamente, verificando atualizações...");
        forceRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [forceRefresh, contracts]);

  return {
    geographicData,
    loading: loading || isRefreshing,
    isRefreshing,
    forceRefresh,
    lastUpdated: geographicData.processedAt
  };
};
