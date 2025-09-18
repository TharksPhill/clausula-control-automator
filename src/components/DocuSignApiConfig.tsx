
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDocuSignConfig, type DocuSignConfig } from '@/hooks/useDocuSignConfig';
import { 
  Settings, 
  Key, 
  Shield, 
  CheckCircle,
  AlertCircle,
  TestTube,
  Trash2,
  Loader2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface DocuSignApiConfigProps {
  onConfigured?: (config: DocuSignConfig) => void;
}

const DocuSignApiConfig: React.FC<DocuSignApiConfigProps> = ({ onConfigured }) => {
  const { toast } = useToast();
  const { config, isConfigured, loading, saveConfig, testConnection, deleteConfig } = useDocuSignConfig();
  const [formData, setFormData] = useState<Omit<DocuSignConfig, 'id' | 'isActive'>>({
    integrationKey: config?.integrationKey || '',
    userId: config?.userId || '',
    accountId: config?.accountId || '',
    rsaPrivateKey: config?.rsaPrivateKey || '',
    baseUrl: config?.baseUrl || 'https://na1.docusign.net',
    authServer: config?.authServer || 'https://account.docusign.com'
  });
  const [isEditing, setIsEditing] = useState(!isConfigured);
  const [isTesting, setIsTesting] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{ isValid: boolean; message: string } | null>(null);

  React.useEffect(() => {
    if (config) {
      setFormData({
        integrationKey: config.integrationKey,
        userId: config.userId,
        accountId: config.accountId,
        rsaPrivateKey: config.rsaPrivateKey,
        baseUrl: config.baseUrl,
        authServer: config.authServer
      });
    }
  }, [config]);

  const validatePrivateKey = (key: string) => {
    const trimmedKey = key.trim();
    
    if (!trimmedKey) {
      setKeyValidation({ isValid: false, message: 'Chave privada é obrigatória' });
      return false;
    }
    
    // Verificar se tem os delimitadores
    const hasBegin = trimmedKey.includes('-----BEGIN');
    const hasEnd = trimmedKey.includes('-----END');
    
    if (!hasBegin || !hasEnd) {
      setKeyValidation({ 
        isValid: false, 
        message: 'Chave deve conter -----BEGIN e -----END' 
      });
      return false;
    }
    
    // Verificar o tipo de chave
    const isPKCS1 = trimmedKey.includes('BEGIN RSA PRIVATE KEY');
    const isPKCS8 = trimmedKey.includes('BEGIN PRIVATE KEY');
    
    if (!isPKCS1 && !isPKCS8) {
      setKeyValidation({ 
        isValid: false, 
        message: 'Tipo de chave não reconhecido. Use PKCS#8 (BEGIN PRIVATE KEY) ou PKCS#1 (BEGIN RSA PRIVATE KEY)' 
      });
      return false;
    }
    
    // Verificar se tem conteúdo base64 válido entre os delimitadores
    const keyContent = trimmedKey
      .replace(/-----BEGIN.*?-----/g, '')
      .replace(/-----END.*?-----/g, '')
      .replace(/\s/g, '');
    
    if (keyContent.length < 50) {
      setKeyValidation({ 
        isValid: false, 
        message: 'Chave parece estar incompleta' 
      });
      return false;
    }
    
    setKeyValidation({ 
      isValid: true, 
      message: isPKCS8 ? 'Chave PKCS#8 válida' : 'Chave PKCS#1 válida' 
    });
    return true;
  };

  const handleSave = async () => {
    if (!formData.integrationKey || !formData.userId || !formData.accountId || !formData.rsaPrivateKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos marcados com * são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar chave privada antes de salvar
    if (!validatePrivateKey(formData.rsaPrivateKey)) {
      toast({
        title: "Chave privada inválida",
        description: keyValidation?.message || "Verifique o formato da chave privada",
        variant: "destructive",
      });
      return;
    }

    try {
      const savedConfig = await saveConfig(formData);
      setIsEditing(false);
      onConfigured?.(savedConfig);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja remover a configuração do DocuSign?')) {
      await deleteConfig();
      setIsEditing(true);
      setFormData({
        integrationKey: '',
        userId: '',
        accountId: '',
        rsaPrivateKey: '',
        baseUrl: 'https://demo.docusign.net',
        authServer: 'https://account-d.docusign.com'
      });
      setKeyValidation(null);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validar chave privada em tempo real
    if (field === 'rsaPrivateKey') {
      if (value.trim()) {
        validatePrivateKey(value);
      } else {
        setKeyValidation(null);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando configuração...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConfigured && !isEditing) {
    return (
      <Card className="border-green-500/20 bg-green-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            DocuSign Configurado (PRODUÇÃO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-primary/20 bg-primary/10">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-primary">
              <strong>Modo Produção Ativo:</strong> Você está usando a API real do DocuSign. 
              Todas as assinaturas serão legalmente válidas e os documentos serão enviados por email real.
            </AlertDescription>
          </Alert>
          
          <p className="text-green-700 mb-4">
            A integração com DocuSign foi configurada com sucesso no modo de produção. 
            Agora você pode enviar contratos para assinatura digital real.
          </p>
          
          <div className="mt-4 p-3 bg-white rounded border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <strong>Environment:</strong> 
                <span className="text-green-600 font-semibold">PRODUÇÃO</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config?.baseUrl || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <strong>Integration Key:</strong> {config?.integrationKey?.substring(0, 8)}...
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config?.integrationKey || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <strong>User ID:</strong> {config?.userId?.substring(0, 8)}...
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config?.userId || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <strong>Account ID:</strong> {config?.accountId?.substring(0, 8)}...
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config?.accountId || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleTest} disabled={isTesting} variant="outline">
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>
            
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Editar
            </Button>
            
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          Configurar API DocuSign (PRODUÇÃO)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-500/20 bg-orange-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-orange-700">
            <strong>Atenção:</strong> Você está configurando o DocuSign em modo de PRODUÇÃO. 
            Todos os documentos enviados serão reais e legalmente válidos. Certifique-se de que 
            suas credenciais são de uma conta de produção do DocuSign.
          </AlertDescription>
        </Alert>

        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            Para usar a integração de produção do DocuSign, você precisa configurar suas 
            credenciais de API de uma conta de produção. Acesse{' '}
            <a 
              href="https://developers.docusign.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              developers.docusign.com
            </a> e certifique-se de usar credenciais de produção.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="integrationKey">Integration Key *</Label>
            <Input
              id="integrationKey"
              value={formData.integrationKey}
              onChange={(e) => handleInputChange('integrationKey', e.target.value)}
              placeholder="Sua Integration Key de PRODUÇÃO do DocuSign"
            />
          </div>

          <div>
            <Label htmlFor="userId">User ID *</Label>
            <Input
              id="userId"
              value={formData.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              placeholder="Seu User ID de PRODUÇÃO do DocuSign"
            />
          </div>

          <div>
            <Label htmlFor="accountId">Account ID *</Label>
            <Input
              id="accountId"
              value={formData.accountId}
              onChange={(e) => handleInputChange('accountId', e.target.value)}
              placeholder="ID da sua conta de PRODUÇÃO DocuSign"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rsaPrivateKey">RSA Private Key *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
              >
                {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <textarea
              id="rsaPrivateKey"
              className="w-full p-2 border rounded min-h-[120px] font-mono text-xs"
              value={formData.rsaPrivateKey}
              onChange={(e) => handleInputChange('rsaPrivateKey', e.target.value)}
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
              style={{ 
                filter: showPrivateKey ? 'none' : 'blur(3px)',
                fontFamily: 'monospace'
              }}
            />
            {keyValidation && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                keyValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {keyValidation.isValid ? 
                  <CheckCircle className="h-3 w-3" /> : 
                  <AlertCircle className="h-3 w-3" />
                }
                {keyValidation.message}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Cole aqui sua chave privada RSA completa de PRODUÇÃO (PKCS#8 ou PKCS#1)
            </p>
          </div>

          <div>
            <Label htmlFor="baseUrl">Environment</Label>
            <select 
              className="w-full p-2 border rounded"
              value={formData.baseUrl}
              onChange={(e) => handleInputChange('baseUrl', e.target.value)}
            >
              <option value="https://na1.docusign.net">Production (NA1) - Recomendado</option>
              <option value="https://na2.docusign.net">Production (NA2)</option>
              <option value="https://na3.docusign.net">Production (NA3)</option>
              <option value="https://eu1.docusign.net">Production (EU1)</option>
              <option value="https://demo.docusign.net">Demo (Apenas Teste)</option>
            </select>
            <p className="text-xs text-orange-600 mt-1">
              <strong>Importante:</strong> Selecione o ambiente de produção correto para sua conta DocuSign.
            </p>
          </div>

          <div>
            <Label htmlFor="authServer">Auth Server</Label>
            <select 
              className="w-full p-2 border rounded"
              value={formData.authServer}
              onChange={(e) => handleInputChange('authServer', e.target.value)}
            >
              <option value="https://account.docusign.com">Production Auth - Recomendado</option>
              <option value="https://account-d.docusign.com">Demo Auth (Apenas Teste)</option>
            </select>
          </div>
        </div>

        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
          <h4 className="font-medium text-green-700 mb-2">✅ Configuração de Produção:</h4>
          <ol className="text-sm text-green-600 space-y-1 list-decimal list-inside">
            <li>Acesse <a href="https://developers.docusign.com/" className="underline">developers.docusign.com</a></li>
            <li>Faça login em sua conta de PRODUÇÃO do DocuSign</li>
            <li>Crie uma aplicação de produção (não demo)</li>
            <li>Configure o Grant Type para "JWT Bearer Token"</li>
            <li>Gere e baixe a chave privada RSA de produção</li>
            <li>Copie as credenciais de PRODUÇÃO: Integration Key, User ID e Account ID</li>
            <li>Certifique-se de que sua aplicação foi aprovada para produção</li>
          </ol>
        </div>

        <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <h4 className="font-medium text-destructive mb-2">⚠️ Importante sobre Produção:</h4>
          <ul className="text-sm text-destructive/80 space-y-1">
            <li>• Todos os documentos enviados serão REAIS e legalmente válidos</li>
            <li>• Os contratantes receberão emails reais de assinatura</li>
            <li>• Pode haver custos associados por documento/assinatura</li>
            <li>• Teste primeiro em ambiente demo antes de usar produção</li>
            <li>• Sua aplicação deve estar aprovada pela DocuSign para produção</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={loading || (keyValidation && !keyValidation.isValid)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Salvar Configuração de Produção
              </>
            )}
          </Button>
          
          {isEditing && isConfigured && (
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocuSignApiConfig;
