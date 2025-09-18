import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CNPJData {
  nome?: string;
  fantasia?: string;
  logradouro?: string;
  numero?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  email?: string;
}

async function fetchCNPJData(cnpj: string): Promise<CNPJData | null> {
  try {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    console.log('Consultando CNPJ:', cleanCNPJ);
    
    // Criar promessa com timeout
    const fetchWithTimeout = (url: string, timeout = 5000) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]) as Promise<Response>;
    };
    
    // Tentar BrasilAPI primeiro
    try {
      const brasilApiResponse = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (brasilApiResponse.ok) {
        const data = await brasilApiResponse.json();
        console.log('Dados recebidos da BrasilAPI');
        
        return {
          nome: data.razao_social || data.nome_fantasia,
          fantasia: data.nome_fantasia,
          logradouro: data.logradouro,
          numero: data.numero,
          municipio: data.municipio,
          uf: data.uf,
          cep: data.cep,
          email: data.email
        };
      }
    } catch (error) {
      console.log('Erro na BrasilAPI, tentando ReceitaWS:', error);
    }
    
    // Fallback para ReceitaWS
    const receitaResponse = await fetchWithTimeout(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
    if (receitaResponse.ok) {
      const data = await receitaResponse.json();
      console.log('Dados recebidos da ReceitaWS');
      
      if (data.status === 'ERROR') {
        console.log('CNPJ não encontrado na ReceitaWS');
        return null;
      }
      
      return {
        nome: data.nome,
        fantasia: data.fantasia,
        logradouro: data.logradouro,
        numero: data.numero,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        email: data.email
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Obter o user_id do header de autorização
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Usuário não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar todos os contratos do usuário com seus contratantes e addons
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id, 
        monthly_value,
        employee_count,
        cnpj_count,
        plan_type,
        contractors(id, cnpj, name, address, city, state),
        contract_addons(*)
      `)
      .eq('user_id', userId);

    if (contractsError) {
      throw new Error(`Erro ao buscar contratos: ${contractsError.message}`);
    }

    console.log(`Encontrados ${contracts?.length || 0} contratos para atualizar`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let adjustmentsProcessed = 0;

    // Processar cada contrato
    for (const contract of contracts || []) {
      // Primeiro processar dados do CNPJ do contratante
      for (const contractor of contract.contractors || []) {
        const result = {
          contractor_id: contractor.id,
          cnpj: contractor.cnpj,
          success: false,
          message: ''
        };

        try {
          const cnpjData = await fetchCNPJData(contractor.cnpj);
          
          if (!cnpjData) {
            result.message = 'Não foi possível obter dados do CNPJ';
            errorCount++;
          } else {
            // Preparar dados para atualização
            const updateData: any = {};
            
            // Sempre atualizar nome com dados do CNPJ
            if (cnpjData.nome) {
              updateData.name = cnpjData.nome;
            }
            
            // Sempre atualizar endereço
            if (cnpjData.logradouro || cnpjData.numero) {
              updateData.address = `${cnpjData.logradouro || ''}, ${cnpjData.numero || ''}`.trim();
            }
            
            // Sempre atualizar cidade
            if (cnpjData.municipio) {
              updateData.city = cnpjData.municipio;
            }
            
            // Sempre atualizar estado
            if (cnpjData.uf) {
              updateData.state = cnpjData.uf;
            }
            
            // Fazer update apenas se houver dados para atualizar
            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from('contractors')
                .update(updateData)
                .eq('id', contractor.id);
              
              if (updateError) {
                throw new Error(`Erro ao atualizar: ${updateError.message}`);
              }
              
              result.success = true;
              result.message = 'Dados atualizados com sucesso';
              successCount++;
            } else {
              result.message = 'Nenhum dado novo para atualizar';
              skippedCount++;
            }
          }
        } catch (error) {
          console.error('Erro ao processar contratante:', error);
          result.message = error.message;
          errorCount++;
        }

        results.push(result);
        
        // Delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Processar dados de mudanças de plano e reajustes
      try {
        // Verificar se o contrato tem mudanças de plano pendentes (addons do tipo plan_change)
        const planChanges = contract.contract_addons?.filter(addon => addon.addon_type === 'plan_change') || [];
        
        // Verificar se o contrato tem reajustes pendentes (addons do tipo adjustment)
        const adjustments = contract.contract_addons?.filter(addon => addon.addon_type === 'adjustment') || [];
        
        // Se não há mudanças nem ajustes processar ajustes baseados no valor do contrato
        if (planChanges.length === 0 && adjustments.length === 0) {
          // Verificar se precisa criar um ajuste inicial
          const { data: existingAdjustments } = await supabase
            .from('contract_adjustments')
            .select('*')
            .eq('contract_id', contract.id)
            .eq('user_id', userId);
          
          // Se não há ajustes ainda, criar um baseado no valor atual do contrato
          if (!existingAdjustments || existingAdjustments.length === 0) {
            const monthlyValue = parseFloat(contract.monthly_value || '0');
            
            if (monthlyValue > 0) {
              const adjustmentData = {
                contract_id: contract.id,
                user_id: userId,
                adjustment_type: 'value' as const,
                adjustment_value: 0,
                renewal_date: new Date().toISOString().split('T')[0],
                previous_value: monthlyValue,
                new_value: monthlyValue,
                notes: 'Valor inicial do contrato',
                effective_date: new Date().toISOString().split('T')[0]
              };
              
              const { error: adjustmentError } = await supabase
                .from('contract_adjustments')
                .insert(adjustmentData);
              
              if (!adjustmentError) {
                adjustmentsProcessed++;
                console.log(`Ajuste inicial criado para contrato ${contract.id}`);
              }
            }
          }
        }
        
        // Processar mudanças de plano existentes
        for (const planChange of planChanges) {
          // Verificar se já existe um ajuste correspondente
          const { data: existingAdjustment } = await supabase
            .from('contract_adjustments')
            .select('*')
            .eq('contract_id', contract.id)
            .eq('notes', `Mudança de plano automática: ${contract.employee_count} funcionários, ${contract.cnpj_count} CNPJs, plano ${contract.plan_type}`)
            .single();
          
          if (!existingAdjustment) {
            const newValue = parseFloat(planChange.new_value || '0');
            const previousValue = parseFloat(planChange.previous_value || contract.monthly_value || '0');
            
            const adjustmentData = {
              contract_id: contract.id,
              user_id: userId,
              adjustment_type: 'value' as const,
              adjustment_value: newValue - previousValue,
              renewal_date: planChange.request_date || new Date().toISOString().split('T')[0],
              previous_value: previousValue,
              new_value: newValue,
              notes: `Mudança de plano automática: ${contract.employee_count} funcionários, ${contract.cnpj_count} CNPJs, plano ${contract.plan_type}`,
              effective_date: planChange.effective_date || new Date().toISOString().split('T')[0]
            };
            
            const { error: adjustmentError } = await supabase
              .from('contract_adjustments')
              .insert(adjustmentData);
            
            if (!adjustmentError) {
              adjustmentsProcessed++;
              console.log(`Ajuste de mudança de plano criado para contrato ${contract.id}`);
            }
          }
        }
        
        // Processar reajustes existentes
        for (const adjustment of adjustments) {
          // Verificar se já existe um ajuste correspondente
          const { data: existingAdjustment } = await supabase
            .from('contract_adjustments')
            .select('*')
            .eq('contract_id', contract.id)
            .eq('effective_date', adjustment.effective_date || adjustment.request_date)
            .single();
          
          if (!existingAdjustment) {
            const newValue = parseFloat(adjustment.new_value || '0');
            const previousValue = parseFloat(adjustment.previous_value || contract.monthly_value || '0');
            
            const adjustmentData = {
              contract_id: contract.id,
              user_id: userId,
              adjustment_type: 'value' as const,
              adjustment_value: newValue - previousValue,
              renewal_date: adjustment.request_date || new Date().toISOString().split('T')[0],
              previous_value: previousValue,
              new_value: newValue,
              notes: adjustment.description || 'Reajuste de contrato',
              effective_date: adjustment.effective_date || new Date().toISOString().split('T')[0]
            };
            
            const { error: adjustmentError } = await supabase
              .from('contract_adjustments')
              .insert(adjustmentData);
            
            if (!adjustmentError) {
              adjustmentsProcessed++;
              console.log(`Reajuste criado para contrato ${contract.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao processar ajustes do contrato:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          errors: errorCount,
          skipped: skippedCount,
          adjustmentsProcessed: adjustmentsProcessed
        },
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na API de sincronização:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});