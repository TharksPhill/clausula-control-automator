
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMapsConfig } from "@/hooks/useGoogleMapsConfig";
import { MapPin, Key, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Info } from "lucide-react";

const GoogleMapsApiConfig = () => {
  const { config, hasValidConfig, saveConfig, isLoading, refetch } = useGoogleMapsConfig();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Função para validar API key no frontend
  const validateApiKey = (key: string) => {
    if (!key) return { valid: false, message: "API Key vazia" };
    if (key.length < 25) return { valid: false, message: "API Key muito curta" };
    if (key.includes('http')) return { valid: false, message: "Contém URL inválida" };
    if (key.includes('anydesk')) return { valid: false, message: "Contém texto inválido" };
    if (!key.startsWith('AIza')) return { valid: false, message: "Deve começar com 'AIza'" };
    if (!/^[A-Za-z0-9_-]+$/.test(key)) return { valid: false, message: "Caracteres inválidos" };
    
    return { valid: true, message: "API Key válida" };
  };

  const currentKeyValidation = config?.api_key ? validateApiKey(config.api_key) : null;

  useEffect(() => {
    console.log('🔧 GoogleMapsApiConfig - Estado atual:', {
      hasValidConfig,
      configExists: !!config,
      apiKeyMasked: config?.api_key ? config.api_key.substring(0, 15) + '...' : 'N/A',
      isLoading,
      validation: currentKeyValidation
    });
  }, [config, hasValidConfig, isLoading, currentKeyValidation]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma API Key válida.",
        variant: "destructive",
      });
      return;
    }

    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      toast({
        title: "API Key Inválida",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      console.log('🔄 Tentando salvar configuração...');
      const success = await saveConfig(apiKey);
      
      if (success) {
        setApiKey("");
        setTimeout(() => {
          refetch();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar configuração.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Atualizado",
        description: "Configuração atualizada com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando configuração...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Configuração Google Maps API
            {hasValidConfig && currentKeyValidation?.valid && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configurado
              </Badge>
            )}
            {(!hasValidConfig || !currentKeyValidation?.valid) && (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                Não configurado
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg">
          <h4 className="font-medium text-primary mb-2">Como obter uma API Key:</h4>
          <ol className="list-decimal list-inside text-sm text-primary/80 space-y-1">
            <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
            <li>Crie um novo projeto ou selecione um existente</li>
            <li>Ative as APIs "Distance Matrix API" e "Places API"</li>
            <li>Crie credenciais (API Key)</li>
            <li>Configure as restrições de uso (opcional)</li>
          </ol>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.open('https://console.cloud.google.com/apis/library/distancematrix.googleapis.com', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Google Cloud Console
          </Button>
        </div>

        {config?.api_key && (
          <div className={`p-3 rounded-lg border ${
            currentKeyValidation?.valid 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-destructive/10 border-destructive/20'
          }`}>
            <div className={`flex items-center gap-2 ${
              currentKeyValidation?.valid ? 'text-green-700' : 'text-destructive'
            }`}>
              {currentKeyValidation?.valid ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">
                API Key {currentKeyValidation?.valid ? 'Válida' : 'Inválida'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              currentKeyValidation?.valid ? 'text-green-600' : 'text-destructive/80'
            }`}>
              {currentKeyValidation?.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              API Key atual: {config.api_key.substring(0, 15)}...
            </p>
            <p className="text-xs text-muted-foreground">
              Comprimento: {config.api_key.length} caracteres
            </p>
            {config.updated_at && (
              <p className="text-xs text-muted-foreground">
                Última atualização: {new Date(config.updated_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-key">
            {hasValidConfig ? "Atualizar API Key" : "Google Maps API Key"}
          </Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Insira sua API Key do Google Maps (AIza...)"
            disabled={saving}
          />
          {apiKey && (
            <div className="text-xs">
              <span className={validateApiKey(apiKey).valid ? 'text-green-600' : 'text-destructive'}>
                <Info className="w-3 h-3 inline mr-1" />
                {validateApiKey(apiKey).message}
              </span> | Comprimento: {apiKey.length}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || !apiKey.trim()}
          className="w-full"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Key className="w-4 h-4 mr-2" />
              {hasValidConfig ? "Atualizar Configuração" : "Salvar Configuração"}
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>⚠️ <strong>Importante:</strong> Mantenha sua API Key segura e configure restrições de uso no Google Cloud Console.</p>
          <p>💡 <strong>Dica:</strong> Para melhor performance, ative tanto a Distance Matrix API quanto a Places API.</p>
          <p>🔍 <strong>Debug:</strong> Uma API Key válida deve começar com "AIza" e ter mais de 25 caracteres.</p>
        </div>

        {/* Debug info em modo desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-muted/50 rounded text-xs">
            <strong>Debug Info:</strong><br />
            Config exists: {config ? 'Sim' : 'Não'}<br />
            Has valid config: {hasValidConfig ? 'Sim' : 'Não'}<br />
            Is loading: {isLoading ? 'Sim' : 'Não'}<br />
            API Key length: {config?.api_key?.length || 0}<br />
            Key validation: {currentKeyValidation ? JSON.stringify(currentKeyValidation) : 'N/A'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleMapsApiConfig;
