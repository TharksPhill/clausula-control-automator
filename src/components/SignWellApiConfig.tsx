
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Eye, EyeOff, TestTube, Trash2, Save, ExternalLink, AlertCircle, Bug } from "lucide-react";
import { useSignWellConfig } from "@/hooks/useSignWellConfig";
import { useSignWellIntegration } from "@/hooks/useSignWellIntegration";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SignWellApiConfig = () => {
  const { config, isConfigured, loading, saveConfig, deleteConfig } = useSignWellConfig();
  const { testApiKey, loading: testLoading } = useSignWellIntegration();
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    apiKey: "",
  });

  // Sincronizar formData com config quando config for carregado
  useEffect(() => {
    if (config?.apiKey) {
      console.log('🔄 [FORM] Sincronizando formulário com configuração salva:', config.apiKey);
      setFormData({ apiKey: config.apiKey });
    }
  }, [config]);

  const handleSave = async () => {
    if (!formData.apiKey.trim()) {
      toast({
        title: "API Key obrigatória",
        description: "Por favor, insira sua API Key do SignWell.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveConfig({
        apiKey: formData.apiKey.trim(),
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleTest = async () => {
    try {
      setLastTestResult(null);
      const result = await testApiKey();
      setLastTestResult({ success: result, timestamp: new Date() });
    } catch (error: any) {
      console.error("Erro ao testar:", error);
      setLastTestResult({ 
        success: false, 
        error: error.message,
        timestamp: new Date() 
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja remover a configuração do SignWell?")) {
      await deleteConfig();
      setFormData({ apiKey: "" });
      setLastTestResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Configuração da API SignWell</span>
              {isConfigured ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Não configurado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure sua API Key do SignWell para habilitar assinaturas digitais
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://www.signwell.com/api/', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentação
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Digite sua API Key do SignWell"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Você pode obter sua API Key no painel do SignWell em Settings → API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.apiKey.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>

          {isConfigured && (
            <>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={loading || testLoading}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {testLoading ? "Testando..." : "Testar API Key"}
              </Button>

              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            </>
          )}
        </div>

        {/* Resultado do último teste */}
        {lastTestResult && (
          <Alert className={lastTestResult.success ? "border-green-500/20 bg-green-500/10" : "border-destructive/20 bg-destructive/10"}>
            <div className="flex items-start gap-2">
              {lastTestResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${lastTestResult.success ? 'text-green-700' : 'text-destructive'}`}>
                  {lastTestResult.success ? 'Teste Bem-sucedido!' : 'Erro no Teste'}
                </p>
                <p className={`text-sm ${lastTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {lastTestResult.success 
                    ? 'A API Key está funcionando corretamente.' 
                    : `Erro: ${lastTestResult.error}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Testado em: {lastTestResult.timestamp.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </Alert>
        )}

        {isConfigured && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  SignWell Configurado
                </p>
                <p className="text-sm text-green-600">
                  Sua integração com SignWell está ativa. Use o botão "Testar API Key" para verificar a conectividade.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Bug className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Problemas de Conectividade?</h4>
              <ul className="text-sm text-primary/80 space-y-1">
                <li>• Verifique se a API Key está correta e ativa</li>
                <li>• Teste a conectividade usando o botão "Testar API Key"</li>
                <li>• Verifique se sua conta SignWell tem permissões adequadas</li>
                <li>• Em caso de erro persistente, contate o suporte</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 border border-border rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">Como obter sua API Key:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Acesse sua conta no SignWell</li>
            <li>Vá para Settings → API</li>
            <li>Gere uma nova API Key ou copie uma existente</li>
            <li>Cole a API Key no campo acima</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignWellApiConfig;
