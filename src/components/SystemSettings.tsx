import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Save, Download, Upload, Trash2, FileSignature, PenTool, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DocuSignApiConfig from "@/components/DocuSignApiConfig";
import SignWellApiConfig from "@/components/SignWellApiConfig";
import GoogleMapsApiConfig from "@/components/GoogleMapsApiConfig";
import GoogleRoutesApiConfig from "./GoogleRoutesApiConfig";

const SystemSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    systemName: "ContractPro",
    systemVersion: "1.0.0",
    maxContractsPerUser: 50,
    enableNotifications: true,
    enableEmailAlerts: true,
    autoBackup: true,
    backupFrequency: "daily",
    sessionTimeout: 120,
    maintenanceMode: false
  });

  const handleSaveSettings = () => {
    // Simular salvamento das configurações
    toast({
      title: "Configurações Salvas",
      description: "As configurações do sistema foram atualizadas com sucesso.",
      variant: "default"
    });
  };

  const handleBackupDownload = () => {
    toast({
      title: "Backup Iniciado",
      description: "O download do backup será iniciado em breve.",
      variant: "default"
    });
  };

  const handleDataReset = () => {
    toast({
      title: "Atenção",
      description: "Esta ação irá apagar todos os dados. Por favor, confirme antes de prosseguir.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configure as preferências básicas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings({...settings, systemName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemVersion">Versão</Label>
              <Input
                id="systemVersion"
                value={settings.systemVersion}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxContracts">Máximo de Contratos por Usuário</Label>
              <Input
                id="maxContracts"
                type="number"
                value={settings.maxContractsPerUser}
                onChange={(e) => setSettings({...settings, maxContractsPerUser: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DocuSign Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-blue-600" />
            Integração DocuSign
          </CardTitle>
          <CardDescription>
            Configure a integração com DocuSign para assinaturas digitais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocuSignApiConfig />
        </CardContent>
      </Card>

      {/* SignWell Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-purple-600" />
            Integração SignWell
          </CardTitle>
          <CardDescription>
            Configure a integração com SignWell para assinaturas digitais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignWellApiConfig />
        </CardContent>
      </Card>

      {/* Google Maps Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Integração Google Maps
          </CardTitle>
          <CardDescription>
            Configure a API do Google Maps para cálculos precisos de distância
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleMapsApiConfig />
        </CardContent>
      </Card>

      {/* Google Routes API Configuration */}
      <GoogleRoutesApiConfig />

      {/* Configurações de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Configure as preferências de notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Permite que o sistema envie notificações aos usuários
              </p>
            </div>
            <Switch
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas por Email</Label>
              <p className="text-sm text-muted-foreground">
                Enviar alertas importantes por email
              </p>
            </div>
            <Switch
              checked={settings.enableEmailAlerts}
              onCheckedChange={(checked) => setSettings({...settings, enableEmailAlerts: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup e Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Backup e Segurança</CardTitle>
          <CardDescription>
            Configure as opções de backup e segurança dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Criar backups automáticos dos dados
              </p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="backupFreq">Frequência do Backup</Label>
            <select 
              className="w-full p-2 border border-border rounded-md bg-background"
              value={settings.backupFrequency}
              onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleBackupDownload} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Baixar Backup
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Restaurar Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Manutenção
          </CardTitle>
          <CardDescription>
            Configurações de manutenção e operações críticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Bloquear acesso de usuários durante manutenção
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
              {settings.maintenanceMode && (
                <Badge variant="destructive">Ativo</Badge>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="font-semibold text-destructive mb-2">Zona de Perigo</h4>
            <p className="text-sm text-destructive/80 mb-3">
              As ações abaixo são irreversíveis e podem causar perda de dados.
            </p>
            <Button 
              onClick={handleDataReset}
              variant="destructive" 
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Resetar Todos os Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
