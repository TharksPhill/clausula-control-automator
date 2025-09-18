import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseMonetaryValue } from "@/utils/monetaryValueParser";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Se não há usuário autenticado, não buscar contratos
      if (!user) {
        console.log("ℹ️ Usuário não autenticado, não buscando contratos");
        setContracts([]);
        return;
      }

      console.log("✅ Usuário autenticado:", user.id);

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          company:companies(*),
          contractors(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar contratos:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar contratos",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Contratos carregados:", data?.length || 0);
      setContracts(data || []);
    } catch (error) {
      console.error("❌ Erro geral ao buscar contratos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contratos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refetchContracts = async () => {
    console.log("🔄 Refetching contracts...");
    await fetchContracts();
  };

  const deleteContract = async (contractId: string) => {
    try {
      console.log("🗑️ Iniciando exclusão do contrato:", contractId);

      // Excluir dependências na ordem correta para evitar violações de chave estrangeira
      
      // 1. Excluir ajustes de contrato (contract_adjustments)
      const { error: adjustmentsError } = await supabase
        .from("contract_adjustments")
        .delete()
        .eq("contract_id", contractId);

      if (adjustmentsError) {
        console.error("❌ Erro ao excluir ajustes:", adjustmentsError);
        throw adjustmentsError;
      }

      // 2. Excluir addons de contrato
      const { error: addonsError } = await supabase
        .from("contract_addons")
        .delete()
        .eq("contract_id", contractId);

      if (addonsError) {
        console.error("❌ Erro ao excluir addons:", addonsError);
        throw addonsError;
      }

      // 3. Excluir contratos assinados
      const { error: signedError } = await supabase
        .from("signed_contracts")
        .delete()
        .eq("contract_id", contractId);

      if (signedError) {
        console.error("❌ Erro ao excluir contratos assinados:", signedError);
        throw signedError;
      }

      // 4. Excluir assinaturas administrativas
      const { error: adminSigError } = await supabase
        .from("admin_contract_signatures")
        .delete()
        .eq("contract_id", contractId);

      if (adminSigError) {
        console.error("❌ Erro ao excluir assinaturas admin:", adminSigError);
        throw adminSigError;
      }

      // 5. Excluir tokens de acesso
      const { error: tokensError } = await supabase
        .from("contract_access_tokens")
        .delete()
        .eq("contract_id", contractId);

      if (tokensError) {
        console.error("❌ Erro ao excluir tokens:", tokensError);
        throw tokensError;
      }

      // 6. Excluir notificações
      const { error: notificationsError } = await supabase
        .from("notifications")
        .delete()
        .eq("contract_id", contractId);

      if (notificationsError) {
        console.error("❌ Erro ao excluir notificações:", notificationsError);
        throw notificationsError;
      }

      // 7. Excluir mensagens de chat
      const { error: messagesError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("contract_id", contractId);

      if (messagesError) {
        console.error("❌ Erro ao excluir mensagens:", messagesError);
        throw messagesError;
      }

      // 8. Excluir sessões de chat
      const { error: sessionsError } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("contract_id", contractId);

      if (sessionsError) {
        console.error("❌ Erro ao excluir sessões:", sessionsError);
        throw sessionsError;
      }

      // 9. Excluir envelopes DocuSign
      const { error: docusignError } = await supabase
        .from("contract_docusign_envelopes")
        .delete()
        .eq("contract_id", contractId);

      if (docusignError) {
        console.error("❌ Erro ao excluir envelopes DocuSign:", docusignError);
        throw docusignError;
      }

      // 10. Excluir revisões de contrato
      const { error: revisionsError } = await supabase
        .from("contract_revisions")
        .delete()
        .eq("contract_id", contractId);

      if (revisionsError) {
        console.error("❌ Erro ao excluir revisões:", revisionsError);
        throw revisionsError;
      }

      // 11. Excluir análises de lucro
      const { error: profitError } = await supabase
        .from("contract_profit_analysis")
        .delete()
        .eq("contract_id", contractId);

      if (profitError) {
        console.error("❌ Erro ao excluir análises de lucro:", profitError);
        throw profitError;
      }

      // 12. Excluir configurações de custo
      const { error: costConfigError } = await supabase
        .from("contract_cost_configurations")
        .delete()
        .eq("contract_id", contractId);

      if (costConfigError) {
        console.error("❌ Erro ao excluir configurações de custo:", costConfigError);
        throw costConfigError;
      }

      // 13. Excluir rejeições de contratante
      const { error: rejectionsError } = await supabase
        .from("contractor_rejections")
        .delete()
        .eq("contract_id", contractId);

      if (rejectionsError) {
        console.error("❌ Erro ao excluir rejeições:", rejectionsError);
        throw rejectionsError;
      }

      // 14. Excluir solicitações de mudança de plano
      const { error: planRequestsError } = await supabase
        .from("contractor_plan_requests")
        .delete()
        .eq("contract_id", contractId);

      if (planRequestsError) {
        console.error("❌ Erro ao excluir solicitações de plano:", planRequestsError);
        throw planRequestsError;
      }

      // 15. Excluir custos de boleto bancário
      const { error: bankSlipError } = await supabase
        .from("contract_bank_slip_costs")
        .delete()
        .eq("contract_id", contractId);

      if (bankSlipError) {
        console.error("❌ Erro ao excluir custos de boleto:", bankSlipError);
        throw bankSlipError;
      }

      // 16. Excluir contratantes
      const { error: contractorsError } = await supabase
        .from("contractors")
        .delete()
        .eq("contract_id", contractId);

      if (contractorsError) {
        console.error("❌ Erro ao excluir contratantes:", contractorsError);
        throw contractorsError;
      }

      // 17. Finalmente, excluir o contrato
      const { error: contractError } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contractId);

      if (contractError) {
        console.error("❌ Erro ao excluir contrato:", contractError);
        throw contractError;
      }

      console.log("✅ Contrato excluído com sucesso:", contractId);

      toast({
        title: "Sucesso",
        description: "Contrato excluído com sucesso",
      });

      await refetchContracts();
    } catch (error) {
      console.error("❌ Erro ao excluir contrato:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contrato",
        variant: "destructive",
      });
    }
  };

  const bulkDeleteContracts = async (contractIds: string[]) => {
    try {
      console.log("🗑️ Iniciando exclusão em massa de contratos:", contractIds);

      for (const contractId of contractIds) {
        await deleteContract(contractId);
      }

      toast({
        title: "Sucesso",
        description: `${contractIds.length} contrato(s) excluído(s) com sucesso`,
      });

      await refetchContracts();
    } catch (error) {
      console.error("❌ Erro ao excluir contratos:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contratos",
        variant: "destructive",
      });
    }
  };

  const inactivateContract = async (contractId: string, terminationDate: string) => {
    try {
      console.log("🔍 Encerrando contrato:", contractId, "Data de encerramento:", terminationDate);
      
      // Obter user_id do contrato
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("user_id")
        .eq("id", contractId)
        .single();

      if (contractError) throw contractError;

      // SEMPRE criar entrada de encerramento, pois pode haver múltiplos ciclos de inativação/reativação
      // Cada encerramento deve ser registrado individualmente
      console.log("📝 Salvando encerramento no histórico...");
      
      const { error: historyError } = await supabase
        .from("contract_status_history")
        .insert({
          contract_id: contractId,
          user_id: contractData.user_id,
          status: "Inativo",
          status_date: terminationDate,
          status_type: "termination",
          created_by: contractData.user_id,
          notes: `Contrato encerrado em ${new Date(terminationDate).toLocaleDateString('pt-BR')}`
        });

      if (historyError) {
        console.error("❌ Erro ao salvar histórico:", historyError);
        throw historyError;
      }
      
      console.log("✅ Entrada de encerramento criada no histórico");

      // Atualizar status do contrato
      const { error } = await supabase
        .from("contracts")
        .update({ 
          status: "Inativo",
          termination_date: terminationDate
        })
        .eq("id", contractId);

      if (error) {
        console.error("❌ Erro ao encerrar contrato:", error);
        throw error;
      }

      console.log("✅ Contrato encerrado com sucesso. Data de encerramento:", terminationDate);

      toast({
        title: "Sucesso",
        description: `Contrato encerrado com sucesso. Data de encerramento: ${new Date(terminationDate).toLocaleDateString('pt-BR')}`,
      });

      await refetchContracts();
      
      // Forçar atualização do histórico se estivermos no modal de detalhes
      window.dispatchEvent(new CustomEvent('contract-status-changed', { detail: { contractId } }));
    } catch (error: any) {
      console.error("❌ Erro ao encerrar contrato:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao encerrar contrato",
        variant: "destructive",
      });
    }
  };

  const activateContract = async (contractId: string, reactivationDate: string) => {
    try {
      console.log("🔍 [DEBUG] Iniciando ativação do contrato:", contractId, "Data de reativação:", reactivationDate);
      
      // Buscar o contrato atual para obter user_id e verificar status
      const { data: currentContract, error: fetchError } = await supabase
        .from("contracts")
        .select("user_id, termination_date, reactivation_date, status")
        .eq("id", contractId)
        .single();

      if (fetchError) {
        console.error("❌ [DEBUG] Erro ao buscar contrato:", fetchError);
        throw fetchError;
      }

      console.log("📋 [DEBUG] Contrato atual antes da ativação:", currentContract);

      // Verificar se o contrato já está ativo
      if (currentContract.status === "Ativo") {
        console.log("⚠️ [DEBUG] Contrato já está ativo, cancelando operação");
        toast({
          title: "Aviso",
          description: "Este contrato já está ativo",
          variant: "default",
        });
        return;
      }

      // Buscar todo o histórico existente para este contrato
      const { data: existingHistory, error: historyCheckError } = await supabase
        .from("contract_status_history")
        .select("*")
        .eq("contract_id", contractId)
        .order("status_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (historyCheckError && historyCheckError.code !== 'PGRST116') {
        console.error("❌ [DEBUG] Erro ao verificar histórico existente:", historyCheckError);
      }

      const lastEntry = existingHistory?.[0];
      console.log("📊 [DEBUG] Última entrada do histórico:", lastEntry);

      // Verificar se o último evento já é uma reativação
      if (lastEntry?.status_type === 'reactivation') {
        console.log("⚠️ [DEBUG] Última entrada já é uma reativação, pulando inserção duplicada");
        // Apenas atualizar o contrato sem adicionar nova entrada no histórico
      } else {
        // Se não há histórico ou o último não é reativação, adicionar entrada
        console.log("📝 [DEBUG] Salvando reativação no histórico");
        
        const historyData = {
          contract_id: contractId,
          user_id: currentContract.user_id,
          status: "Ativo",
          status_date: reactivationDate,
          status_type: "reactivation",
          created_by: currentContract.user_id,
          notes: `Contrato reativado em ${new Date(reactivationDate).toLocaleDateString('pt-BR')}`
        };
        
        console.log("📝 [DEBUG] Dados do histórico a serem inseridos:", historyData);
        
        const { data: insertedHistory, error: historyError } = await supabase
          .from("contract_status_history")
          .insert(historyData)
          .select();

        if (historyError) {
          // O trigger no banco impedirá duplicações
          if (historyError.message?.includes('status_type consecutivo duplicado')) {
            console.log("✅ [DEBUG] Duplicação prevenida pelo trigger do banco");
          } else {
            console.error("❌ [DEBUG] Erro ao salvar histórico:", historyError);
            throw historyError;
          }
        } else {
          console.log("✅ [DEBUG] Histórico inserido com sucesso:", insertedHistory);
        }
      }

      // Atualizar status do contrato
      const updateData: any = { 
        status: "Ativo",
        reactivation_date: reactivationDate
      };
      
      console.log("📝 [DEBUG] Atualizando contrato com dados:", updateData);

      const { data: updatedContract, error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", contractId)
        .select();

      if (error) {
        console.error("❌ [DEBUG] Erro ao ativar contrato:", error);
        throw error;
      }
      
      console.log("✅ [DEBUG] Contrato atualizado com sucesso:", updatedContract);

      toast({
        title: "Sucesso",
        description: `Contrato ativado com sucesso. Data de ativação: ${new Date(reactivationDate).toLocaleDateString('pt-BR')}`,
      });

      await refetchContracts();
      
      // Forçar atualização do histórico se estivermos no modal de detalhes
      console.log("📢 [DEBUG] Disparando evento contract-status-changed");
      window.dispatchEvent(new CustomEvent('contract-status-changed', { detail: { contractId } }));
    } catch (error: any) {
      console.error("❌ [DEBUG] Erro ao ativar contrato - detalhes completos:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao ativar contrato",
        variant: "destructive",
      });
    }
  };

  const saveContract = async (contractData: any, contractors: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não encontrado");

      // Get or create company
      let { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!company) {
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: "Empresa Padrão",
            email: "contato@empresa.com",
            phone: "(11) 99999-9999",
            address: "Endereço da empresa",
            user_id: user.id
          })
          .select()
          .single();

        if (companyError) throw companyError;
        company = newCompany;
      }

      // Map the contract data to match database column names
      // Calculate the actual monthly value to store in database
      const getMonthlyValueForDatabase = () => {
        if (!contractData.monthlyValue) return "0";
        
        const value = parseMonetaryValue(contractData.monthlyValue);
        const planType = contractData.planType || "mensal";
        
        console.log(`[SAVE] Valor original: "${contractData.monthlyValue}"`);
        console.log(`[SAVE] Valor parseado: ${value}`);
        console.log(`[SAVE] Tipo de plano: ${planType}`);
        
        // Para todos os tipos de plano, salvar o valor conforme digitado
        const savedValue = value.toFixed(2).replace('.', ',');
        console.log(`[SAVE] Valor a ser salvo: ${savedValue}`);
        return savedValue;
      };

      const contractPayload = {
        contract_number: contractData.contractNumber,
        employee_count: contractData.employeeCount || "0",
        cnpj_count: contractData.cnpjCount || "1",
        trial_days: contractData.trialDays || "0",
        start_date: contractData.startDate,
        monthly_value: getMonthlyValueForDatabase(),
        renewal_date: contractData.renewalDate,
        payment_start_date: contractData.paymentStartDate,
        payment_day: contractData.paymentDay || "1",
        plan_type: contractData.planType || "mensal",
        semestral_discount: contractData.semestralDiscount || "0",
        anual_discount: contractData.anualDiscount || "0",
        user_id: user.id,
        company_id: company.id,
        status: "Ativo"
      };

      console.log("📝 Contract payload being sent to database:", contractPayload);

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert(contractPayload)
        .select()
        .single();

      if (contractError) {
        console.error("❌ Contract insertion error:", contractError);
        throw contractError;
      }

      // Save contractors - agora incluindo o campo email
      if (contractors && contractors.length > 0) {
        const contractorsPayload = contractors.map(contractor => ({
          contract_id: contract.id,
          name: contractor.name,
          cnpj: contractor.cnpj,
          city: contractor.city,
          state: contractor.state,
          address: contractor.address,
          responsible_name: contractor.responsibleName,
          responsible_cpf: contractor.responsibleCpf,
          responsible_rg: contractor.responsibleRg || "",
          email: contractor.email || ""
        }));

        console.log("📧 Contractors payload with email:", contractorsPayload);

        const { error: contractorsError } = await supabase
          .from("contractors")
          .insert(contractorsPayload);

        if (contractorsError) {
          console.error("❌ Contractors insertion error:", contractorsError);
          throw contractorsError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Contrato criado com sucesso",
      });

      await refetchContracts();
      return contract;
    } catch (error) {
      console.error("❌ Erro ao salvar contrato:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar contrato: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContract = async (contractId: string, contractData: any, contractors: any[]) => {
    try {
      // Map the contract data to match database column names
      // Calculate the actual monthly value to store in database
      const getMonthlyValueForDatabase = () => {
        if (!contractData.monthlyValue) return "0";
        
        const value = parseMonetaryValue(contractData.monthlyValue);
        const planType = contractData.planType || "mensal";
        
        console.log(`[UPDATE] Valor original: "${contractData.monthlyValue}"`);
        console.log(`[UPDATE] Valor parseado: ${value}`);
        console.log(`[UPDATE] Tipo de plano: ${planType}`);
        
        // Para todos os tipos de plano, salvar o valor conforme digitado
        const savedValue = value.toFixed(2).replace('.', ',');
        console.log(`[UPDATE] Valor a ser salvo: ${savedValue}`);
        return savedValue;
      };

      const contractPayload = {
        contract_number: contractData.contractNumber,
        employee_count: contractData.employeeCount || "0",
        cnpj_count: contractData.cnpjCount || "1", 
        trial_days: contractData.trialDays || "0",
        start_date: contractData.startDate,
        monthly_value: getMonthlyValueForDatabase(),
        renewal_date: contractData.renewalDate,
        payment_start_date: contractData.paymentStartDate,
        payment_day: contractData.paymentDay || "1",
        plan_type: contractData.planType || "mensal",
        semestral_discount: contractData.semestralDiscount || "0",
        anual_discount: contractData.anualDiscount || "0"
      };

      console.log("📝 Contract update payload being sent to database:", contractPayload);

      const { error: contractError } = await supabase
        .from("contracts")
        .update(contractPayload)
        .eq("id", contractId);

      if (contractError) {
        console.error("❌ Contract update error:", contractError);
        throw contractError;
      }

      // Update contractors - delete old ones and insert new ones, agora incluindo o campo email
      await supabase
        .from("contractors")
        .delete()
        .eq("contract_id", contractId);

      if (contractors && contractors.length > 0) {
        const contractorsPayload = contractors.map(contractor => ({
          contract_id: contractId,
          name: contractor.name,
          cnpj: contractor.cnpj,
          city: contractor.city,
          state: contractor.state,
          address: contractor.address,
          responsible_name: contractor.responsibleName,
          responsible_cpf: contractor.responsibleCpf,
          responsible_rg: contractor.responsibleRg || "",
          email: contractor.email || ""
        }));

        console.log("📧 Updated contractors payload with email:", contractorsPayload);

        const { error: contractorsError } = await supabase
          .from("contractors")
          .insert(contractorsPayload);

        if (contractorsError) {
          console.error("❌ Contractors update error:", contractorsError);
          throw contractorsError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Contrato atualizado com sucesso",
      });

      await refetchContracts();
      return { success: true };
    } catch (error) {
      console.error("❌ Erro ao atualizar contrato:", error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar contrato: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const generateNextContractNumber = async () => {
    try {
      // Buscar diretamente no banco todos os números de contrato existentes
      const { data: existingContracts, error } = await supabase
        .from('contracts')
        .select('contract_number')
        .order('contract_number', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contratos existentes:', error);
        // Fallback: usar timestamp se falhar
        const timestamp = Date.now().toString().slice(-3);
        return timestamp.padStart(3, '0');
      }

      // Extrair números válidos e ordenar
      const numbers = (existingContracts || [])
        .map(contract => parseInt(contract.contract_number))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a);

      console.log('📊 Números existentes:', numbers);

      // Encontrar o próximo número na sequência
      let nextNumber = 1;
      if (numbers.length > 0) {
        // Verificar se há lacunas na sequência
        const maxNumber = numbers[0];
        for (let i = 1; i <= maxNumber + 1; i++) {
          if (!numbers.includes(i)) {
            nextNumber = i;
            break;
          }
        }
        // Se não há lacunas, pegar o próximo após o maior
        if (nextNumber === 1) {
          nextNumber = maxNumber + 1;
        }
      }

      const formattedNumber = nextNumber.toString().padStart(3, '0');
      console.log('🔢 Próximo número gerado:', formattedNumber);
      
      return formattedNumber;
    } catch (error) {
      console.error('Erro ao gerar número do contrato:', error);
      // Fallback: usar timestamp
      const timestamp = Date.now().toString().slice(-3);
      return timestamp.padStart(3, '0');
    }
  };

  const saveCompanyProfile = async (companyData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não encontrado");

      console.log("📤 Dados recebidos para salvar:", companyData);

      // Incluir todos os campos necessários para a tabela companies
      const validCompanyData = {
        name: companyData.name || '',
        cnpj: companyData.cnpj || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
        website: companyData.website || null,
        logo: companyData.logo || null,
        admin_name: companyData.adminName || '',
        responsible_name: companyData.responsibleName || '',
        user_id: user.id
      };

      console.log("📤 Dados filtrados para enviar ao Supabase:", validCompanyData);

      const { error } = await supabase
        .from("companies")
        .upsert(validCompanyData);

      if (error) {
        console.error("❌ Erro no Supabase:", error);
        throw error;
      }

      console.log("✅ Perfil da empresa salvo com sucesso");
      
      toast({
        title: "Sucesso",
        description: "Perfil da empresa salvo com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro ao salvar perfil da empresa:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar perfil da empresa: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("❌ Erro ao buscar dados da empresa:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ Erro ao buscar dados da empresa:", error);
      return null;
    }
  };

  useEffect(() => {
    // Só buscar contratos quando não estiver carregando a autenticação
    if (!authLoading) {
      fetchContracts();
    }
  }, [user, authLoading]);

  return {
    contracts,
    loading: loading || authLoading,
    deleteContract,
    bulkDeleteContracts,
    inactivateContract,
    activateContract,
    refetchContracts,
    fetchContracts,
    saveContract,
    updateContract,
    generateNextContractNumber,
    saveCompanyProfile,
    fetchCompanyData
  };
};
