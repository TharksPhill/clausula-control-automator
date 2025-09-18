import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento simplificado de CNAE para segmentos
const cnaeToSegment: Record<string, string> = {
  // Alimentação
  '5611': 'Alimentação',
  '5612': 'Alimentação',
  '5620': 'Alimentação',
  '4721': 'Alimentação',
  '4722': 'Alimentação',
  
  // Construção
  '4120': 'Construção',
  '4211': 'Construção',
  '4212': 'Construção',
  '4213': 'Construção',
  '4299': 'Construção',
  '4311': 'Construção',
  '4312': 'Construção',
  '4313': 'Construção',
  '4319': 'Construção',
  '4321': 'Construção',
  '4322': 'Construção',
  '4329': 'Construção',
  '4330': 'Construção',
  '4391': 'Construção',
  '4399': 'Construção',
  
  // Comércio
  '4711': 'Comércio',
  '4712': 'Comércio',
  '4713': 'Comércio',
  '4723': 'Comércio',
  '4724': 'Comércio',
  '4729': 'Comércio',
  '4731': 'Comércio',
  '4732': 'Comércio',
  '4741': 'Comércio',
  '4742': 'Comércio',
  '4743': 'Comércio',
  '4744': 'Comércio',
  '4751': 'Comércio',
  '4752': 'Comércio',
  '4753': 'Comércio',
  '4754': 'Comércio',
  '4755': 'Comércio',
  '4757': 'Comércio',
  '4759': 'Comércio',
  '4761': 'Comércio',
  '4762': 'Comércio',
  '4763': 'Comércio',
  '4771': 'Comércio',
  '4772': 'Comércio',
  '4773': 'Comércio',
  '4774': 'Comércio',
  '4781': 'Comércio',
  '4782': 'Comércio',
  '4783': 'Comércio',
  '4784': 'Comércio',
  '4785': 'Comércio',
  '4789': 'Comércio',
  
  // Saúde
  '8610': 'Saúde',
  '8620': 'Saúde',
  '8621': 'Saúde',
  '8622': 'Saúde',
  '8630': 'Saúde',
  '8640': 'Saúde',
  '8650': 'Saúde',
  '8660': 'Saúde',
  '8690': 'Saúde',
  
  // Educação
  '8511': 'Educação',
  '8512': 'Educação',
  '8513': 'Educação',
  '8520': 'Educação',
  '8531': 'Educação',
  '8532': 'Educação',
  '8533': 'Educação',
  '8541': 'Educação',
  '8542': 'Educação',
  '8550': 'Educação',
  '8591': 'Educação',
  '8592': 'Educação',
  '8593': 'Educação',
  '8599': 'Educação',
  
  // Tecnologia
  '6201': 'Tecnologia',
  '6202': 'Tecnologia',
  '6203': 'Tecnologia',
  '6204': 'Tecnologia',
  '6209': 'Tecnologia',
  '6311': 'Tecnologia',
  '6312': 'Tecnologia',
  '6319': 'Tecnologia',
  '6391': 'Tecnologia',
  '6399': 'Tecnologia',
  
  // Setor Público
  '8411': 'Setor Público',
  '8412': 'Setor Público',
  '8413': 'Setor Público',
  '8421': 'Setor Público',
  '8422': 'Setor Público',
  '8423': 'Setor Público',
  '8424': 'Setor Público',
  '8425': 'Setor Público',
  '8430': 'Setor Público',
};

function classifySegmentByCNAE(cnaePrincipal: string | null): string {
  if (!cnaePrincipal) return 'Outros';
  
  // Remove formatação e pega apenas os primeiros 4 dígitos
  const cnaePrefix = cnaePrincipal.replace(/[^\d]/g, '').substring(0, 4);
  
  // Tenta encontrar correspondência
  if (cnaeToSegment[cnaePrefix]) {
    return cnaeToSegment[cnaePrefix];
  }
  
  // Classificação genérica baseada no primeiro dígito
  const firstDigit = cnaePrincipal.charAt(0);
  switch (firstDigit) {
    case '0':
      return 'Agronegócio';
    case '1':
    case '2':
    case '3':
      return 'Indústria';
    case '4':
      return 'Comércio';
    case '5':
      return 'Alimentação';
    case '6':
      return 'Tecnologia';
    case '7':
      return 'Serviços';
    case '8':
      return 'Educação/Saúde';
    case '9':
      return 'Serviços';
    default:
      return 'Outros';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Buscar todos os contractors sem CNAE
    const { data: contractors, error: fetchError } = await supabase
      .from('contractors')
      .select('id, cnpj')
      .or('cnae_principal.is.null,segmento.is.null')
      .not('cnpj', 'is', null);
    
    if (fetchError) {
      console.error("Erro ao buscar contractors:", fetchError);
      throw fetchError;
    }
    
    console.log(`Encontrados ${contractors?.length || 0} contractors para atualizar`);
    
    const updates = [];
    const errors = [];
    
    // Para cada contractor, buscar dados na BrasilAPI
    for (const contractor of contractors || []) {
      if (!contractor.cnpj) continue;
      
      const cleanCnpj = contractor.cnpj.replace(/[^\d]/g, '');
      if (cleanCnpj.length !== 14) {
        console.log(`CNPJ inválido: ${contractor.cnpj}`);
        continue;
      }
      
      try {
        console.log(`Buscando CNAE para CNPJ: ${cleanCnpj}`);
        
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        
        if (!response.ok) {
          console.error(`Erro ao buscar CNPJ ${cleanCnpj}: ${response.status}`);
          errors.push({ cnpj: cleanCnpj, error: `HTTP ${response.status}` });
          continue;
        }
        
        const data = await response.json();
        
        if (data.cnae_fiscal) {
          const segmento = classifySegmentByCNAE(data.cnae_fiscal);
          
          // Atualizar o contractor no banco
          const { error: updateError } = await supabase
            .from('contractors')
            .update({
              cnae_principal: data.cnae_fiscal || null,
              cnae_descricao: data.cnae_fiscal_descricao || null,
              segmento: segmento,
              cnaes_secundarios: data.cnaes_secundarios || []
            })
            .eq('id', contractor.id);
          
          if (updateError) {
            console.error(`Erro ao atualizar contractor ${contractor.id}:`, updateError);
            errors.push({ id: contractor.id, cnpj: cleanCnpj, error: updateError.message });
          } else {
            updates.push({
              id: contractor.id,
              cnpj: cleanCnpj,
              cnae: data.cnae_fiscal,
              segmento: segmento
            });
            console.log(`Contractor ${contractor.id} atualizado com sucesso`);
          }
        }
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Erro ao processar CNPJ ${cleanCnpj}:`, error);
        errors.push({ cnpj: cleanCnpj, error: error.message });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Atualização concluída`,
        updated: updates.length,
        errors: errors.length,
        details: {
          updates,
          errors
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Erro na função update-cnae-data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});