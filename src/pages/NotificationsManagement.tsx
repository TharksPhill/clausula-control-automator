import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bell,
  BellRing,
  Settings,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  CheckCircle,
  RefreshCw,
  Calendar,
  Users,
  Building2,
  Loader2,
  Mail,
  AtSign,
  MessageSquare,
  PenTool
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageHeader from "@/components/PageHeader";

const NotificationsManagement = () => {
  const {
    notifications,
    settings,
    loading,
    isGenerating,
    updateSettings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    generateNotifications,
    getUnreadCount,
    getExpiringContracts,
    getTrialExpiringContracts,
    getRecentContracts,
    getSignedContracts,
    getPlanChanges,
  } = useNotifications();

  const [settingsForm, setSettingsForm] = useState({
    contract_expiry_days: 30,
    trial_expiry_days: 7,
    email_notifications: true,
    contract_expiry_email: true,
    trial_expiry_email: true,
    new_contract_email: true,
    contract_signed_email: true,
    plan_change_email: true,
    custom_email: "",
    contract_expiry_subject: "⚠️ Contrato {contract_number} próximo do vencimento",
    trial_expiry_subject: "⏰ Período de teste terminando - Contrato {contract_number}",
    new_contract_subject: "✅ Novo contrato criado - {contract_number}",
    contract_signed_subject: "✅ Contrato {contract_number} foi assinado",
    plan_change_subject: "📋 Mudança de plano no contrato {contract_number}",
    email_days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    email_send_time: "09:00",
    check_frequency_hours: 24,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Atualizar o form quando as configurações carregarem
  useEffect(() => {
    if (settings) {
      console.log("🔄 Atualizando formulário com configurações:", settings);
      setSettingsForm({
        contract_expiry_days: settings.contract_expiry_days,
        trial_expiry_days: settings.trial_expiry_days,
        email_notifications: settings.email_notifications,
        contract_expiry_email: settings.contract_expiry_email,
        trial_expiry_email: settings.trial_expiry_email,
        new_contract_email: settings.new_contract_email,
        contract_signed_email: settings.contract_signed_email || true,
        plan_change_email: settings.plan_change_email || true,
        custom_email: settings.custom_email || "",
        contract_expiry_subject: settings.contract_expiry_subject || "⚠️ Contrato {contract_number} próximo do vencimento",
        trial_expiry_subject: settings.trial_expiry_subject || "⏰ Período de teste terminando - Contrato {contract_number}",
        new_contract_subject: settings.new_contract_subject || "✅ Novo contrato criado - {contract_number}",
        contract_signed_subject: settings.contract_signed_subject || "✅ Contrato {contract_number} foi assinado",
        plan_change_subject: settings.plan_change_subject || "📋 Mudança de plano no contrato {contract_number}",
        email_days_of_week: settings.email_days_of_week || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        email_send_time: settings.email_send_time || "09:00",
        check_frequency_hours: settings.check_frequency_hours || 24,
      });
    }
  }, [settings]);

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    console.log("💾 Salvando configurações:", settingsForm);
    
    try {
      await updateSettings(settingsForm);
      console.log("✅ Configurações salvas com sucesso");
    } catch (error) {
      console.error("❌ Erro ao salvar configurações:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setSettingsForm({
        ...settingsForm,
        email_days_of_week: [...settingsForm.email_days_of_week, day]
      });
    } else {
      setSettingsForm({
        ...settingsForm,
        email_days_of_week: settingsForm.email_days_of_week.filter(d => d !== day)
      });
    }
  };

  const dayLabels = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira", 
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo"
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "contract_expiry":
        return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case "trial_expiry":
        return <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "new_contract":
        return <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case "contract_signed":
        return <PenTool className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case "plan_change":
        return <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case "contract_revised":
        return <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "contract_expiry":
        return <Badge variant="destructive">Vencimento</Badge>;
      case "trial_expiry":
        return <Badge variant="destructive">Teste</Badge>;
      case "new_contract":
        return <Badge variant="default">Novo</Badge>;
      case "contract_signed":
        return <Badge className="bg-purple-600">Assinado</Badge>;
      case "plan_change":
        return <Badge className="bg-indigo-600">Mudança</Badge>;
      default:
        return <Badge variant="secondary">Geral</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  const unreadCount = getUnreadCount();
  const expiringContracts = getExpiringContracts();
  const trialExpiringContracts = getTrialExpiringContracts();
  const recentContracts = getRecentContracts();
  const signedContracts = getSignedContracts();
  const planChanges = getPlanChanges();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader title="Gerenciamento de Notificações" showSidebarTrigger={false} />
      <div className="flex-1 p-6 space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <BellRing className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Notificações pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Vencendo</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiringContracts.length}</div>
            <p className="text-xs text-muted-foreground">Próximos do vencimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testes Vencendo</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{trialExpiringContracts.length}</div>
            <p className="text-xs text-muted-foreground">Períodos de teste acabando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Assinados</CardTitle>
            <PenTool className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{signedContracts.length}</div>
            <p className="text-xs text-muted-foreground">Recém assinados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mudanças de Plano</CardTitle>
            <Settings className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{planChanges.length}</div>
            <p className="text-xs text-muted-foreground">Alterações registradas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Contratos Vencendo
          </TabsTrigger>
          <TabsTrigger value="trials">
            <Clock className="w-4 h-4 mr-2" />
            Testes Expirando
          </TabsTrigger>
          <TabsTrigger value="signed">
            <PenTool className="w-4 h-4 mr-2" />
            Contratos Assinados
          </TabsTrigger>
          <TabsTrigger value="plan-changes">
            <Settings className="w-4 h-4 mr-2" />
            Mudanças de Plano
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Todas as Notificações</CardTitle>
                  <CardDescription>
                    Gerencie suas notificações de contratos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={generateNotifications}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? "Atualizando..." : "Atualizar"}
                  </Button>
                  {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Todas como Lidas
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhuma notificação
                  </h3>
                  <p className="text-muted-foreground">
                    Você não possui notificações no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.is_read
                          ? "bg-accent/50 border-border"
                          : "bg-primary/5 border-primary/20 dark:bg-primary/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">
                                {notification.title}
                              </h4>
                              {getNotificationBadge(notification.type)}
                              {!notification.is_read && (
                                <Badge variant="secondary" className="text-xs">
                                  Nova
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Contratos Próximos do Vencimento
              </CardTitle>
              <CardDescription>
                Contratos que vencem nos próximos {settings?.contract_expiry_days || 30} dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringContracts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Nenhum contrato vencendo
                  </h3>
                  <p className="text-gray-600">
                    Todos os contratos estão em dia.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringContracts.map((contract, index) => (
                    <div key={index} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Contrato {contract?.contract_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Vencimento: {contract?.renewal_date}
                          </p>
                        </div>
                        <Badge variant="destructive">Vencendo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Períodos de Teste Expirando
              </CardTitle>
              <CardDescription>
                Contratos com período de teste terminando nos próximos {settings?.trial_expiry_days || 7} dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialExpiringContracts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Nenhum teste expirando
                  </h3>
                  <p className="text-gray-600">
                    Nenhum período de teste próximo do fim.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trialExpiringContracts.map((contract, index) => (
                    <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Contrato {contract?.contract_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Início: {contract?.start_date} | Teste: {contract?.trial_days} dias
                          </p>
                        </div>
                        <Badge variant="destructive">Teste Expirando</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-purple-600" />
                Contratos Recém-Assinados
              </CardTitle>
              <CardDescription>
                Contratos que foram assinados recentemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signedContracts.length === 0 ? (
                <div className="text-center py-8">
                  <PenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Nenhum contrato assinado recentemente
                  </h3>
                  <p className="text-gray-600">
                    Nenhum contrato foi assinado nos últimos dias.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signedContracts.map((contract, index) => (
                    <div key={index} className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Contrato {contract?.contract_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Status: {contract?.status}
                          </p>
                        </div>
                        <Badge className="bg-purple-600">Assinado</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan-changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Mudanças de Plano
              </CardTitle>
              <CardDescription>
                Alterações de plano registradas nos contratos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {planChanges.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Nenhuma mudança de plano recente
                  </h3>
                  <p className="text-gray-600">
                    Nenhuma mudança de plano foi registrada recentemente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planChanges.map((contract, index) => (
                    <div key={index} className="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Contrato {contract?.contract_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Status: {contract?.status}
                          </p>
                        </div>
                        <Badge className="bg-indigo-600">Mudança</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Personalize quando e como receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contract_expiry_days">
                    Dias antes do vencimento do contrato
                  </Label>
                  <Input
                    id="contract_expiry_days"
                    type="number"
                    min="1"
                    max="365"
                    value={settingsForm.contract_expiry_days}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        contract_expiry_days: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    Receber notificação quando um contrato estiver próximo do vencimento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trial_expiry_days">
                    Dias antes do fim do período de teste
                  </Label>
                  <Input
                    id="trial_expiry_days"
                    type="number"
                    min="1"
                    max="30"
                    value={settingsForm.trial_expiry_days}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        trial_expiry_days: parseInt(e.target.value) || 7,
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    Receber notificação quando o período de teste estiver acabando
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check_frequency_hours">
                    Frequência de verificação (horas)
                  </Label>
                  <Input
                    id="check_frequency_hours"
                    type="number"
                    min="1"
                    max="168"
                    value={settingsForm.check_frequency_hours}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        check_frequency_hours: parseInt(e.target.value) || 24,
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    A cada quantas horas o sistema deve verificar por notificações
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Notificações por email (geral)
                    </Label>
                    <p className="text-sm text-gray-600">
                      Ativar ou desativar todas as notificações por email
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settingsForm.email_notifications}
                    onCheckedChange={(checked) =>
                      setSettingsForm({
                        ...settingsForm,
                        email_notifications: checked,
                      })
                    }
                  />
                </div>

                {settingsForm.email_notifications && (
                  <div className="ml-6 space-y-6 border-l-2 border-gray-200 pl-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom_email" className="flex items-center gap-2">
                        <AtSign className="w-4 h-4" />
                        Email personalizado (opcional)
                      </Label>
                      <Input
                        id="custom_email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={settingsForm.custom_email}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            custom_email: e.target.value,
                          })
                        }
                      />
                      <p className="text-sm text-gray-600">
                        Se não informado, será usado o email da sua conta
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Assuntos dos emails
                      </h4>
                      <p className="text-sm text-gray-600">
                        Personalize os assuntos dos emails. Use {"{contract_number}"} para incluir o número do contrato.
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="contract_expiry_subject">
                          Assunto para vencimento de contratos
                        </Label>
                        <Input
                          id="contract_expiry_subject"
                          value={settingsForm.contract_expiry_subject}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              contract_expiry_subject: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trial_expiry_subject">
                          Assunto para fim de período de teste
                        </Label>
                        <Input
                          id="trial_expiry_subject"
                          value={settingsForm.trial_expiry_subject}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              trial_expiry_subject: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new_contract_subject">
                          Assunto para novos contratos
                        </Label>
                        <Input
                          id="new_contract_subject"
                          value={settingsForm.new_contract_subject}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              new_contract_subject: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Dias da semana para envio
                      </h4>
                      <p className="text-sm text-gray-600">
                        Selecione em quais dias da semana deseja receber emails
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(dayLabels).map(([day, label]) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={settingsForm.email_days_of_week.includes(day)}
                              onCheckedChange={(checked) => handleDayToggle(day, !!checked)}
                            />
                            <Label htmlFor={day} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email_send_time" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Horário preferido para envio
                      </Label>
                      <Input
                        id="email_send_time"
                        type="time"
                        value={settingsForm.email_send_time}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            email_send_time: e.target.value,
                          })
                        }
                      />
                      <p className="text-sm text-gray-600">
                        Horário preferido para receber as notificações por email
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Tipos de notificação por email</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="contract_expiry_email">
                              Email para vencimento de contratos
                            </Label>
                            <p className="text-sm text-gray-600">
                              Receber email quando contratos estiverem próximos do vencimento
                            </p>
                          </div>
                          <Switch
                            id="contract_expiry_email"
                            checked={settingsForm.contract_expiry_email}
                            onCheckedChange={(checked) =>
                              setSettingsForm({
                                ...settingsForm,
                                contract_expiry_email: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="trial_expiry_email">
                              Email para fim de período de teste
                            </Label>
                            <p className="text-sm text-gray-600">
                              Receber email quando períodos de teste estiverem terminando
                            </p>
                          </div>
                          <Switch
                            id="trial_expiry_email"
                            checked={settingsForm.trial_expiry_email}
                            onCheckedChange={(checked) =>
                              setSettingsForm({
                                ...settingsForm,
                                trial_expiry_email: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="new_contract_email">
                              Email para novos contratos
                            </Label>
                            <p className="text-sm text-gray-600">
                              Receber email quando novos contratos forem criados
                            </p>
                          </div>
                          <Switch
                            id="new_contract_email"
                            checked={settingsForm.new_contract_email}
                            onCheckedChange={(checked) =>
                              setSettingsForm({
                                ...settingsForm,
                                new_contract_email: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="contract_signed_email">
                              Email para contratos assinados
                            </Label>
                            <p className="text-sm text-gray-600">
                              Receber email quando contratos forem assinados
                            </p>
                          </div>
                          <Switch
                            id="contract_signed_email"
                            checked={settingsForm.contract_signed_email}
                            onCheckedChange={(checked) =>
                              setSettingsForm({
                                ...settingsForm,
                                contract_signed_email: checked,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="plan_change_email">
                              Email para mudanças de plano
                            </Label>
                            <p className="text-sm text-gray-600">
                              Receber email quando houver mudanças de plano
                            </p>
                          </div>
                          <Switch
                            id="plan_change_email"
                            checked={settingsForm.plan_change_email}
                            onCheckedChange={(checked) =>
                              setSettingsForm({
                                ...settingsForm,
                                plan_change_email: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <Button 
                onClick={handleUpdateSettings} 
                className="w-full"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isUpdating ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default NotificationsManagement;
