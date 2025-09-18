import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRHIDRevenue = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return useQuery({
    queryKey: ['rhid-revenue', user?.id, currentYear],
    queryFn: async () => {
      if (!user?.id) return null;

      // Buscar todas as seções financeiras de FATURAMENTO RHID
      const { data: sections, error: sectionError } = await supabase
        .from('financial_sections')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', '%FATURAMENTO%RHID%');

      if (sectionError || !sections || sections.length === 0) {
        console.log('Nenhuma seção FATURAMENTO RHID encontrada');
        return {
          monthlyAverage: 0,
          annualTotal: 0,
          contractsCount: 0,
          totalMonthly: 0
        };
      }

      // Pegar todos os IDs das seções RHID
      const sectionIds = sections.map(s => s.id);

      // Buscar categorias financeiras de todas as seções RHID
      const { data: categories, error: categoriesError } = await supabase
        .from('financial_categories')
        .select('id, name')
        .eq('user_id', user.id)
        .in('section_id', sectionIds);

      if (categoriesError || !categories || categories.length === 0) {
        console.log('Nenhuma categoria encontrada para FATURAMENTO RHID');
        return {
          monthlyAverage: 0,
          annualTotal: 0,
          contractsCount: 0,
          totalMonthly: 0
        };
      }

      const categoryIds = categories.map(c => c.id);

      // Buscar valores mensais do ano atual
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_financial_costs')
        .select('month, value, category_id')
        .eq('user_id', user.id)
        .in('category_id', categoryIds)
        .eq('year', currentYear)
        .order('month', { ascending: true });

      if (monthlyError) {
        console.error('Erro ao buscar custos mensais:', monthlyError);
      }

      // Agrupar valores por mês
      const monthlyTotals: { [key: number]: number } = {};
      let totalAnual = 0;

      if (monthlyData && monthlyData.length > 0) {
        monthlyData.forEach(item => {
          const value = typeof item.value === 'string' ? parseFloat(item.value) : (item.value || 0);
          const month = item.month;
          
          if (!monthlyTotals[month]) {
            monthlyTotals[month] = 0;
          }
          monthlyTotals[month] += value;
        });

        // Calcular total anual
        Object.values(monthlyTotals).forEach(monthValue => {
          totalAnual += monthValue;
        });
      }

      // Pegar o valor do mês atual ou do último mês disponível
      const currentMonthValue = monthlyTotals[currentMonth] || 
                               monthlyTotals[currentMonth - 1] || 
                               Object.values(monthlyTotals)[Object.values(monthlyTotals).length - 1] || 
                               0;

      // Número de contratos é o número de categorias (cada categoria representa um contrato)
      const contractsCount = categories.length;

      // Média por contrato baseada no valor mensal atual
      const monthlyAverage = contractsCount > 0 ? currentMonthValue / contractsCount : 0;

      console.log('🔍 [useRHIDRevenue] Dados RHID calculados:', {
        totalMonthly: currentMonthValue,
        annualTotal: totalAnual,
        contractsCount: contractsCount,
        monthlyAverage: monthlyAverage,
        monthlyTotals: monthlyTotals
      });

      return {
        monthlyAverage: monthlyAverage,
        annualTotal: totalAnual,
        contractsCount: contractsCount,
        totalMonthly: currentMonthValue
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });
};