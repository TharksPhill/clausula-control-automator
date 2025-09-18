import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Mail, 
  Clock, 
  Calendar,
  Save,
  Bell,
  CheckCircle,
  FileText,
  PenTool,
  AlertTriangle
} from 'lucide-react';

const NotificationSettings = () => {
  const { settings, updateSettings, loading } = useNotifications();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    contract_expiry_days: 30,
    trial_expiry_days: 7,
    email_notifications: true,
    contract_expiry_email: true,
    trial_expiry_email: true,
    new_contract_email: true,
    contract_signed_email: true,
    plan_change_email: true,
    custom_email: '',
    contract_expiry_subject: '⚠️ Contrato {contract_number} próximo do vencimento',
    trial_expiry_subject: '⏰ Período de teste terminando - Contrato {contract_number}',
    new_contract_subject: '✅ Novo contrato criado - {contract_number}',
    contract_signed_subject: '✅ Contrato {contract_number} foi assinado',
    plan_change_subject: '📋 Mudança de plano no contrato {contract_number}',
    email_days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    email_send_time: '09:00',
    check_frequency_hours: 24,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        contract_expiry_days: settings.contract_expiry_days,
        trial_expiry_days: settings.trial_expiry_days,
        email_notifications: settings.email_notifications,
        contract_expiry_email: settings.contract_expiry_email,
        trial_expiry_email: settings.trial_expiry_email,
        new_contract_email: settings.new_contract_email,
        contract_signed_email: settings.contract_signed_email || true,
        plan_change_email: settings.plan_change_email || true,
        custom_email: settings.custom_email || '',
        contract_expiry_subject: settings.contract_expiry_subject || '⚠️ Contrato {contract_number} próximo do vencimento',
        trial_expiry_subject: settings.trial_expiry_subject || '⏰ Período de teste terminando - Contrato {contract_number}',
        new_contract_subject: settings.new_contract_subject || '✅ Novo contrato criado - {contract_number}',
        contract_signed_subject: settings.contract_signed_subject || '✅ Contrato {contract_number} foi assinado',
        plan_change_subject: settings.plan_change_subject || '📋 Mudança de plano no contrato {contract_number}',
        email_days_of_week: settings.email_days_of_week || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        email_send_time: settings.email_send_time || '09:00',
        check_frequency_hours: settings.check_frequency_hours || 24,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(formData);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      email_days_of_week: prev.email_days_of_week.includes(day)
        ? prev.email_days_of_week.filter(d => d !== day)
        : [...prev.email_days_of_week, day]
    }));
  };

  const dayLabels = {
    monday: 'Seg',
    tuesday: 'Ter',
    wednesday: 'Qua',
    thursday: 'Qui',
    friday: 'Sex',
    saturday: 'Sáb',
    sunday: 'Dom'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Configurações de Notificação</h2>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_expiry_days">Dias de antecedência - Vencimento de contrato</Label>
              <Input
                id="contract_expiry_days"
                type="number"
                value={formData.contract_expiry_days}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_expiry_days: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="trial_expiry_days">Dias de antecedência - Fim do período de teste</Label>
              <Input
                id="trial_expiry_days"
                type="number"
                value={formData.trial_expiry_days}
                onChange={(e) => setFormData(prev => ({ ...prev, trial_expiry_days: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="check_frequency_hours">Frequência de verificação (horas)</Label>
            <Input
              id="check_frequency_hours"
              type="number"
              value={formData.check_frequency_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, check_frequency_hours: parseInt(e.target.value) }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Notificações por email</Label>
              <p className="text-sm text-gray-600">Receber notificações por email</p>
            </div>
            <Switch
              id="email_notifications"
              checked={formData.email_notifications}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications: checked }))}
            />
          </div>

          <div>
            <Label htmlFor="custom_email">Email customizado (opcional)</Label>
            <Input
              id="custom_email"
              type="email"
              placeholder="seu-email@empresa.com"
              value={formData.custom_email}
              onChange={(e) => setFormData(prev => ({ ...prev, custom_email: e.target.value }))}
            />
            <p className="text-sm text-gray-600 mt-1">
              Se não informado, será usado o email da conta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email_send_time">Horário de envio</Label>
              <Input
                id="email_send_time"
                type="time"
                value={formData.email_send_time}
                onChange={(e) => setFormData(prev => ({ ...prev, email_send_time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Dias da semana para envio de emails</Label>
            <div className="flex gap-2 mt-2">
              {Object.entries(dayLabels).map(([day, label]) => (
                <Badge
                  key={day}
                  variant={formData.email_days_of_week.includes(day) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleDayToggle(day)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Tipos de Notificação por Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <Label>Vencimento de contrato</Label>
              </div>
              <Switch
                checked={formData.contract_expiry_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contract_expiry_email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <Label>Fim do período de teste</Label>
              </div>
              <Switch
                checked={formData.trial_expiry_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trial_expiry_email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <Label>Novo contrato criado</Label>
              </div>
              <Switch
                checked={formData.new_contract_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, new_contract_email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-purple-600" />
                <Label>Contrato assinado</Label>
              </div>
              <Switch
                checked={formData.contract_signed_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contract_signed_email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-600" />
                <Label>Mudança de plano</Label>
              </div>
              <Switch
                checked={formData.plan_change_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, plan_change_email: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assuntos Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Assuntos Personalizados dos Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Use <code>{'{contract_number}'}</code> para incluir o número do contrato no assunto
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="contract_expiry_subject">Vencimento de contrato</Label>
              <Input
                id="contract_expiry_subject"
                value={formData.contract_expiry_subject}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_expiry_subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="trial_expiry_subject">Fim do período de teste</Label>
              <Input
                id="trial_expiry_subject"
                value={formData.trial_expiry_subject}
                onChange={(e) => setFormData(prev => ({ ...prev, trial_expiry_subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="new_contract_subject">Novo contrato criado</Label>
              <Input
                id="new_contract_subject"
                value={formData.new_contract_subject}
                onChange={(e) => setFormData(prev => ({ ...prev, new_contract_subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="contract_signed_subject">Contrato assinado</Label>
              <Input
                id="contract_signed_subject"
                value={formData.contract_signed_subject}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_signed_subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="plan_change_subject">Mudança de plano</Label>
              <Input
                id="plan_change_subject"
                value={formData.plan_change_subject}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_change_subject: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
