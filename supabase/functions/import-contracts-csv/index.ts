import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContractData {
  contract_number: string;
  contractor_cpf: string;
  contractor_cnpj: string;
  employee_count: string;
  cnpj_count: string;
  responsible_name: string;
  responsible_cpf: string;
  payment_date: string;
  start_date: string;
  contract_value: string;
  plan_type: string;
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
    
    // Tentar BrasilAPI primeiro
    try {
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (brasilApiResponse.ok) {
        const data = await brasilApiResponse.json();
        console.log('Dados recebidos da BrasilAPI:', data);
        
        return {
          nome: data.legal_name || data.company_name,
          fantasia: data.trade_name,
          logradouro: data.street,
          numero: data.number,
          municipio: data.city,
          uf: data.state,
          cep: data.zip_code,
          email: data.email
        };
      }
    } catch (error) {
      console.log('Erro na BrasilAPI, tentando ReceitaWS:', error);
    }
    
    // Fallback para ReceitaWS
    const receitaResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
    if (receitaResponse.ok) {
      const data = await receitaResponse.json();
      console.log('Dados recebidos da ReceitaWS:', data);
      
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

function validateDate(dateString: string): boolean {
  if (!dateString) return false;
  
  // Aceitar formatos DD/MM/YYYY ou YYYY-MM-DD
  const dateRegex = /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/;
  if (!dateRegex.test(dateString)) return false;
  
  try {
    let date: Date;
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(dateString);
    }
    
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

function formatDateForDB(dateString: string): string {
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString;
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

    const { contracts } = await req.json();
    console.log('Recebidos contratos para importação:', contracts?.length);

    if (!contracts || !Array.isArray(contracts)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Array de contratos é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const contractData of contracts) {
      const result = {
        contract_number: contractData.contract_number,
        success: false,
        message: '',
        data: null,
        isUpdate: false
      };

      try {
        // Não fazer validações - apenas campos básicos necessários
        if (!contractData.contract_number) {
          throw new Error('Número do contrato é obrigatório');
        }

        // Verificar se contrato já existe
        const { data: existingContract } = await supabase
          .from('contracts')
          .select('id')
          .eq('contract_number', contractData.contract_number)
          .eq('user_id', userId)
          .single();

        let contractId: string;

        // Se o contrato já existe, vamos atualizar
        if (existingContract) {
          contractId = existingContract.id;
          
          // Atualizar dados do contrato existente
          const { error: updateError } = await supabase
            .from('contracts')
            .update({
              employee_count: contractData.employee_count || undefined,
              cnpj_count: contractData.cnpj_count || undefined,
              trial_days: contractData.trial_days || undefined,
              start_date: contractData.start_date ? formatDateForDB(contractData.start_date) : undefined,
              monthly_value: contractData.contract_value || undefined,
              renewal_date: contractData.renewal_date || undefined,
              payment_start_date: contractData.payment_start_date || undefined,
              payment_day: contractData.payment_date || undefined,
              plan_type: contractData.plan_type || undefined,
              semestral_discount: contractData.semestral_discount || undefined,
              anual_discount: contractData.anual_discount || undefined
            })
            .eq('id', contractId)
            .eq('user_id', userId);

          if (updateError) {
            throw new Error(`Erro ao atualizar contrato: ${updateError.message}`);
          }

          // Buscar e atualizar contratante se já existe
          const { data: existingContractor } = await supabase
            .from('contractors')
            .select('*')
            .eq('contract_id', contractId)
            .single();

          if (existingContractor) {
            // Criar objeto de atualização apenas com campos fornecidos (não vazios)
            const updateData: any = {};
            
            // Se forneceu CNPJ, buscar dados atualizados
            if (contractData.contractor_cnpj) {
              const cnpjData = await fetchCNPJData(contractData.contractor_cnpj);
              
              // Atualizar CNPJ
              updateData.cnpj = contractData.contractor_cnpj;
              
              // Se conseguiu dados do CNPJ, usar, senão manter existente
              if (cnpjData) {
                if (cnpjData.nome) updateData.name = cnpjData.nome;
                if (cnpjData.logradouro || cnpjData.numero) {
                  updateData.address = `${cnpjData.logradouro || ''}, ${cnpjData.numero || ''}`.trim();
                }
                if (cnpjData.municipio) updateData.city = cnpjData.municipio;
                if (cnpjData.uf) updateData.state = cnpjData.uf;
                if (cnpjData.email) updateData.email = cnpjData.email;
              }
            }
            
            // Atualizar outros campos apenas se fornecidos
            if (contractData.contractor_name) updateData.name = contractData.contractor_name;
            if (contractData.responsible_name) updateData.responsible_name = contractData.responsible_name;
            if (contractData.responsible_cpf) updateData.responsible_cpf = contractData.responsible_cpf;
            if (contractData.responsible_rg) updateData.responsible_rg = contractData.responsible_rg;
            if (contractData.email) updateData.email = contractData.email;
            if (contractData.address) updateData.address = contractData.address;
            if (contractData.city) updateData.city = contractData.city;
            if (contractData.state) updateData.state = contractData.state;
            
            // Só atualizar se houver dados para atualizar
            if (Object.keys(updateData).length > 0) {
              const { error: contractorUpdateError } = await supabase
                .from('contractors')
                .update(updateData)
                .eq('id', existingContractor.id);

              if (contractorUpdateError) {
                throw new Error(`Erro ao atualizar contratante: ${contractorUpdateError.message}`);
              }
            }
          }

          // Processar ajustes/mudanças de plano após atualizar o contrato
          try {
            // Verificar se precisa criar/atualizar ajustes
            const monthlyValue = parseFloat(contractData.contract_value || '0');
            
            if (monthlyValue > 0) {
              // Verificar se já existe algum ajuste para este contrato
              const { data: existingAdjustments } = await supabase
                .from('contract_adjustments')
                .select('*')
                .eq('contract_id', contractId)
                .eq('user_id', userId)
                .order('effective_date', { ascending: false })
                .limit(1);
              
              // Se não há ajustes ou o valor mudou, criar novo ajuste
              if (!existingAdjustments || existingAdjustments.length === 0) {
                const adjustmentData = {
                  contract_id: contractId,
                  user_id: userId,
                  adjustment_type: 'value' as const,
                  adjustment_value: 0,
                  renewal_date: contractData.renewal_date || new Date().toISOString().split('T')[0],
                  previous_value: monthlyValue,
                  new_value: monthlyValue,
                  notes: 'Valor inicial do contrato (importação CSV)',
                  effective_date: contractData.start_date ? formatDateForDB(contractData.start_date) : new Date().toISOString().split('T')[0]
                };
                
                await supabase
                  .from('contract_adjustments')
                  .insert(adjustmentData);
                
                console.log(`Ajuste inicial criado para contrato ${contractId}`);
              } else if (existingAdjustments[0].new_value !== monthlyValue) {
                // Valor mudou, criar novo ajuste
                const adjustmentData = {
                  contract_id: contractId,
                  user_id: userId,
                  adjustment_type: 'value' as const,
                  adjustment_value: monthlyValue - existingAdjustments[0].new_value,
                  renewal_date: contractData.renewal_date || new Date().toISOString().split('T')[0],
                  previous_value: existingAdjustments[0].new_value,
                  new_value: monthlyValue,
                  notes: 'Atualização de valor via importação CSV',
                  effective_date: new Date().toISOString().split('T')[0]
                };
                
                await supabase
                  .from('contract_adjustments')
                  .insert(adjustmentData);
                
                console.log(`Ajuste de valor criado para contrato ${contractId}`);
              }
            }
          } catch (adjustmentError) {
            console.error('Erro ao processar ajustes:', adjustmentError);
          }

          result.success = true;
          result.message = 'Contrato atualizado com sucesso';
          result.data = { id: contractId };
          result.isUpdate = true;
          updatedCount++;

        } else {
          // Contrato não existe, criar novo
          
          // Verificar se empresa já existe pelo CNPJ
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('cnpj', contractData.contractor_cnpj)
            .eq('user_id', userId)
            .single();

          let companyId = existingCompany?.id;

          // Se empresa não existe, consultar CNPJ e criar
          if (!existingCompany) {
            console.log('Consultando dados do CNPJ:', contractData.contractor_cnpj);
            const cnpjData = await fetchCNPJData(contractData.contractor_cnpj);

            // Criar empresa com dados do CNPJ ou dados básicos do CSV
            const companyData = cnpjData ? {
              name: cnpjData.nome || contractData.contractor_name || 'Nome não encontrado',
              cnpj: contractData.contractor_cnpj,
              address: `${cnpjData.logradouro || ''}, ${cnpjData.numero || ''}`.trim() || '',
              phone: '',
              email: cnpjData.email || contractData.email || '',
              user_id: userId
            } : {
              // Se não conseguiu dados do CNPJ, usar dados do CSV
              name: contractData.contractor_name || 'Nome não encontrado',
              cnpj: contractData.contractor_cnpj,
              address: `${contractData.city || ''}, ${contractData.state || ''}`.trim(),
              phone: '',
              email: contractData.email || '',
              user_id: userId
            };

            // Criar empresa
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert(companyData)
              .select()
              .single();

            if (companyError) {
              throw new Error(`Erro ao criar empresa: ${companyError.message}`);
            }

            companyId = newCompany.id;
          } else {
            companyId = existingCompany.id;
          }

          // Criar contrato
          const { data: newContract, error: contractError } = await supabase
            .from('contracts')
            .insert({
              contract_number: contractData.contract_number,
              employee_count: contractData.employee_count || '0',
              cnpj_count: contractData.cnpj_count || '0',
              trial_days: contractData.trial_days || '0',
              start_date: contractData.start_date ? formatDateForDB(contractData.start_date) : '',
              monthly_value: contractData.contract_value || '0',
              renewal_date: contractData.renewal_date || '',
              payment_start_date: contractData.payment_start_date || '',
              payment_day: contractData.payment_date || '',
              plan_type: contractData.plan_type || 'mensal',
              semestral_discount: contractData.semestral_discount || '0',
              anual_discount: contractData.anual_discount || '0',
              status: 'Ativo',
              company_id: companyId,
              user_id: userId
            })
            .select()
            .single();

          if (contractError) {
            throw new Error(`Erro ao criar contrato: ${contractError.message}`);
          }

          contractId = newContract.id;

          // Criar ajuste inicial para o novo contrato
          try {
            const monthlyValue = parseFloat(contractData.contract_value || '0');
            
            if (monthlyValue > 0) {
              const adjustmentData = {
                contract_id: contractId,
                user_id: userId,
                adjustment_type: 'value' as const,
                adjustment_value: 0,
                renewal_date: contractData.renewal_date || new Date().toISOString().split('T')[0],
                previous_value: monthlyValue,
                new_value: monthlyValue,
                notes: 'Valor inicial do contrato (importação CSV)',
                effective_date: contractData.start_date ? formatDateForDB(contractData.start_date) : new Date().toISOString().split('T')[0]
              };
              
              await supabase
                .from('contract_adjustments')
                .insert(adjustmentData);
              
              console.log(`Ajuste inicial criado para novo contrato ${contractId}`);
            }
          } catch (adjustmentError) {
            console.error('Erro ao criar ajuste inicial:', adjustmentError);
          }

          // Criar contratante
          const cnpjData = await fetchCNPJData(contractData.contractor_cnpj);
          const { error: contractorError } = await supabase
            .from('contractors')
            .insert({
              contract_id: contractId,
              name: contractData.contractor_cpf ? 'Pessoa Física' : (cnpjData?.nome || contractData.contractor_name || 'Nome não encontrado'),
              cnpj: contractData.contractor_cnpj,
              address: cnpjData ? `${cnpjData.logradouro || ''}, ${cnpjData.numero || ''}`.trim() : contractData.address || '',
              city: cnpjData?.municipio || contractData.city || '',
              state: cnpjData?.uf || contractData.state || '',
              responsible_name: contractData.responsible_name || '',
              responsible_cpf: contractData.responsible_cpf || '',
              responsible_rg: contractData.responsible_rg || '',
              email: cnpjData?.email || contractData.email || ''
            });

          if (contractorError) {
            throw new Error(`Erro ao criar contratante: ${contractorError.message}`);
          }

          result.success = true;
          result.message = 'Contrato importado com sucesso';
          result.data = newContract;
          createdCount++;
        }

      } catch (error) {
        console.error('Erro ao processar contrato:', error);
        result.message = error.message;
      }

      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          errors: errorCount,
          created: createdCount,
          updated: updatedCount
        },
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na API de importação:', error);
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