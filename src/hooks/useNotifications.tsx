import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Notification {
  id: string;
  user_id: string;
  contract_id: string | null;
  type: "contract_expiry" | "trial_expiry" | "new_contract" | "contract_signed" | "plan_change" | "contract_revised" | "revision_approved" | "revision_rejected" | "revision_pending";
  title: string;
  message: string;
  is_read: boolean;
  expires_at: string | null;
  created_at: string;
  contract?: any;
}

interface NotificationSettings {
  id: string;
  user_id: string;
  contract_expiry_days: number;
  trial_expiry_days: number;
  email_notifications: boolean;
  contract_expiry_email: boolean;
  trial_expiry_email: boolean;
  new_contract_email: boolean;
  contract_signed_email: boolean;
  plan_change_email: boolean;
  custom_email: string | null;
  contract_expiry_subject: string | null;
  trial_expiry_subject: string | null;
  new_contract_subject: string | null;
  contract_signed_subject: string | null;
  plan_change_subject: string | null;
  email_days_of_week: string[] | null;
  email_send_time: string | null;
  check_frequency_hours: number | null;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select(`
          *,
          contracts (
            contract_number,
            renewal_date,
            start_date,
            trial_days,
            status
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match our Notification interface
      const transformedData: Notification[] = (notificationsData || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        contract_id: item.contract_id,
        type: item.type as "contract_expiry" | "trial_expiry" | "new_contract" | "contract_signed" | "plan_change" | "contract_revised" | "revision_approved" | "revision_rejected" | "revision_pending",
        title: item.title,
        message: item.message,
        is_read: item.is_read,
        expires_at: item.expires_at,
        created_at: item.created_at,
        contract: item.contracts
      }));

      setNotifications(transformedData);
      console.log("✅ Notificações carregadas:", transformedData.length);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notificações",
        variant: "destructive",
      });
    }
  };

  const fetchSettings = async () => {
    if (!user) return;

    try {
      console.log("🔍 Buscando configurações para usuário:", user.id);
      
      // Buscar todas as configurações do usuário e pegar a mais recente
      const { data: settingsData, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (settingsData && settingsData.length > 0) {
        setSettings(settingsData[0]);
        console.log("⚙️ Configurações carregadas:", settingsData[0]);
      } else {
        console.log("📝 Criando configurações padrão para usuário:", user.id);
        
        // Criar configurações padrão
        const { data: newSettings, error: createError } = await supabase
          .from("notification_settings")
          .insert({
            user_id: user.id,
            contract_expiry_days: 30,
            trial_expiry_days: 7,
            email_notifications: true,
            contract_expiry_email: true,
            trial_expiry_email: true,
            new_contract_email: true,
            contract_signed_email: true,
            plan_change_email: true,
            custom_email: null,
            contract_expiry_subject: "⚠️ Contrato {contract_number} próximo do vencimento",
            trial_expiry_subject: "⏰ Período de teste terminando - Contrato {contract_number}",
            new_contract_subject: "✅ Novo contrato criado - {contract_number}",
            contract_signed_subject: "✅ Contrato {contract_number} foi assinado",
            plan_change_subject: "📋 Mudança de plano no contrato {contract_number}",
            email_days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            email_send_time: "09:00",
            check_frequency_hours: 24,
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
        console.log("⚙️ Configurações criadas:", newSettings);
      }
    } catch (error) {
      console.error("Erro ao buscar/criar configurações:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user || !settings) {
      console.error("❌ Não é possível atualizar: usuário ou configurações não encontrados");
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("💾 Atualizando configurações:", {
        settingsId: settings.id,
        userId: user.id,
        newSettings
      });

      const { data, error } = await supabase
        .from("notification_settings")
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro no banco de dados:", error);
        throw error;
      }

      if (!data) {
        console.error("❌ Nenhum dado retornado após atualização");
        throw new Error("Nenhum dado retornado após atualização");
      }

      setSettings(data);
      console.log("✅ Configurações atualizadas com sucesso:", data);
      
      toast({
        title: "Sucesso!",
        description: "Configurações de notificação salvas com sucesso",
      });
      
      return data;
    } catch (error) {
      console.error("❌ Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const shouldSendEmailToday = () => {
    if (!settings?.email_days_of_week || settings.email_days_of_week.length === 0) {
      return true;
    }

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    
    return settings.email_days_of_week.includes(todayName);
  };

  const getCustomSubject = (type: string, contractNumber?: string) => {
    if (!settings) return "";

    let template = "";
    switch (type) {
      case 'contract_expiry':
        template = settings.contract_expiry_subject || "⚠️ Contrato {contract_number} próximo do vencimento";
        break;
      case 'trial_expiry':
        template = settings.trial_expiry_subject || "⏰ Período de teste terminando - Contrato {contract_number}";
        break;
      case 'new_contract':
        template = settings.new_contract_subject || "✅ Novo contrato criado - {contract_number}";
        break;
      case 'contract_signed':
        template = settings.contract_signed_subject || "✅ Contrato {contract_number} foi assinado";
        break;
      case 'plan_change':
        template = settings.plan_change_subject || "📋 Mudança de plano no contrato {contract_number}";
        break;
      case 'revision_approved':
        template = settings.contract_expiry_subject || "✅ Revisão aprovada - Contrato {contract_number}";
        break;
      case 'revision_rejected':
        template = settings.contract_expiry_subject || "❌ Revisão rejeitada - Contrato {contract_number}";
        break;
      case 'revision_pending':
        template = settings.contract_expiry_subject || "Nova revisão recebida - Contrato {contract_number}";
        break;
      default:
        return "";
    }

    return template.replace('{contract_number}', contractNumber || '');
  };

  const sendEmailNotification = async (notification: Notification) => {
    if (!user || !settings) return;

    try {
      const shouldSendEmail = () => {
        switch (notification.type) {
          case 'contract_expiry':
            return settings.contract_expiry_email;
          case 'trial_expiry':
            return settings.trial_expiry_email;
          case 'new_contract':
            return settings.new_contract_email;
          case 'contract_signed':
            return settings.contract_signed_email;
          case 'plan_change':
            return settings.plan_change_email;
          case 'revision_approved':
            return settings.contract_expiry_email;
          case 'revision_rejected':
            return settings.contract_expiry_email;
          case 'revision_pending':
            return settings.contract_expiry_email;
          default:
            return false;
        }
      };

      if (!settings.email_notifications || !shouldSendEmail()) {
        console.log(`📧 Email não enviado para ${notification.type} - configuração desabilitada`);
        return;
      }

      if (!shouldSendEmailToday()) {
        console.log(`📧 Email não enviado para ${notification.type} - dia da semana não configurado`);
        return;
      }

      const { data: companyData } = await supabase
        .from("companies")
        .select("name")
        .eq("user_id", user.id)
        .single();

      const customSubject = getCustomSubject(notification.type, notification.contract?.contract_number);

      console.log(`📧 Enviando email de notificação para ${settings.custom_email || user.email}...`);

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          user_email: settings.custom_email || user.email,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          contract_number: notification.contract?.contract_number,
          company_name: companyData?.name,
          custom_subject: customSubject,
        }
      });

      if (error) {
        console.error("❌ Erro ao enviar email:", error);
        throw error;
      }

      console.log("✅ Email de notificação enviado com sucesso:", data);
      
      toast({
        title: "Email enviado!",
        description: `Notificação enviada para ${settings.custom_email || user.email}`,
      });
    } catch (error) {
      console.error("Erro ao enviar email de notificação:", error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar o email de notificação",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast({
        title: "Sucesso!",
        description: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      toast({
        title: "Sucesso!",
        description: "Notificação excluída",
      });
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  const generateRevisionNotifications = async () => {
    if (!user) return;

    try {
      console.log("🔄 Generating revision notifications...");
      
      // Check for pending revisions that need company review
      const { data: pendingRevisions, error: revisionsError } = await supabase
        .from("contract_revisions")
        .select(`
          *,
          contracts!inner (
            id,
            contract_number,
            user_id
          )
        `)
        .eq("contracts.user_id", user.id)
        .eq("status", "pending")
        .eq("created_by_type", "contractor");

      if (revisionsError) throw revisionsError;

      // Create notifications for pending contractor revisions
      for (const revision of pendingRevisions || []) {
        const existingNotification = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("contract_id", revision.contract_id)
          .eq("type", "revision_pending")
          .single();

        if (!existingNotification.data) {
          await supabase
            .from("notifications")
            .insert({
              user_id: user.id,
              contract_id: revision.contract_id,
              type: "revision_pending",
              title: "Nova revisão recebida",
              message: `O contrato ${revision.contracts.contract_number} recebeu uma nova proposta de revisão do contratante.`
            });
        }
      }

      console.log("✅ Revision notifications generated");
    } catch (error) {
      console.error("❌ Error generating revision notifications:", error);
    }
  };

  const generateNotifications = async () => {
    if (!user || isGenerating) return;

    setIsGenerating(true);
    
    try {
      console.log("🔄 Gerando notificações manualmente...");
      
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id);

      console.log(`📋 Notificações antes: ${existingNotifications?.length || 0}`);

      // Generate standard contract notifications
      const { data: rpcData, error } = await supabase.rpc("generate_contract_notifications");

      if (error) {
        console.error("❌ ERRO NA FUNÇÃO RPC:", error);
        throw error;
      }

      // Generate revision notifications
      await generateRevisionNotifications();

      console.log("✅ Função RPC executada com sucesso!");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data: newNotifications } = await supabase
        .from("notifications")
        .select(`
          *,
          contracts (
            contract_number,
            renewal_date,
            start_date,
            trial_days,
            status
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const newCount = (newNotifications?.length || 0) - (existingNotifications?.length || 0);
      console.log(`📋 Notificações após: ${newNotifications?.length || 0} (${newCount >= 0 ? '+' : ''}${newCount})`);
      
      await fetchNotifications();
      
      toast({
        title: "Sucesso!",
        description: newCount > 0 
          ? `${newCount} novas notificações criadas. Os emails serão enviados automaticamente nos horários configurados.` 
          : "Notificações atualizadas. Nenhuma nova notificação necessária.",
      });
    } catch (error) {
      console.error("❌ Erro ao gerar notificações:", error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar notificações: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  const getExpiringContracts = () => {
    return notifications.filter(n => 
      n.type === "contract_expiry" && !n.is_read
    ).map(n => n.contract);
  };

  const getTrialExpiringContracts = () => {
    return notifications.filter(n => 
      n.type === "trial_expiry" && !n.is_read
    ).map(n => n.contract);
  };

  const getRecentContracts = () => {
    return notifications.filter(n => 
      n.type === "new_contract"
    ).map(n => n.contract);
  };

  const getSignedContracts = () => {
    return notifications.filter(n => 
      n.type === "contract_signed" && !n.is_read
    ).map(n => n.contract);
  };

  const getPlanChanges = () => {
    return notifications.filter(n => 
      n.type === "plan_change" && !n.is_read
    ).map(n => n.contract);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchNotifications(),
        fetchSettings()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Set up real-time subscription for contract revisions
  useEffect(() => {
    if (!user) return;

    const revisionChannel = supabase
      .channel('contract-revisions-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contract_revisions'
        },
        async (payload) => {
          console.log("🔔 Revision change detected:", payload);
          
          // Auto-generate notifications for revision events
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            await generateRevisionNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(revisionChannel);
    };
  }, [user]);

  return {
    notifications,
    settings,
    loading,
    isGenerating,
    unreadCount: getUnreadCount(),
    updateSettings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    generateNotifications,
    generateRevisionNotifications,
    getUnreadCount,
    getExpiringContracts,
    getTrialExpiringContracts,
    getRecentContracts,
    getSignedContracts,
    getPlanChanges,
    refetch: fetchNotifications,
    loadNotifications: fetchNotifications,
    sendEmailNotification,
  };
};
