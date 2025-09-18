
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleRoutesConfig } from "@/hooks/useGoogleRoutesConfig";
import { AlertCircle, CheckCircle, Key, ExternalLink, Save } from "lucide-react";

const GoogleRoutesApiConfig = () => {
  const { config, isLoading, saveConfig, hasValidConfig } = useGoogleRoutesConfig();
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setIsSaving(true);
    const success = await saveConfig(apiKey.trim());
    
    if (success) {
      setApiKey("");
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          Configuração da Google Routes API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status atual */}
        <div className="flex items-center gap-2 p-3 rounded-lg border">
          {hasValidConfig ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">
                API Key configurada com sucesso
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-700 font-medium">
                API Key não configurada - usando valores simulados
              </span>
            </>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <h4 className="font-medium text-primary mb-2">Como obter sua API Key:</h4>
          <ol className="text-sm text-primary/80 space-y-1 list-decimal list-inside">
            <li>Acesse o <strong>Google Cloud Console</strong></li>
            <li>Crie um novo projeto ou selecione um existente</li>
            <li>Ative a <strong>Routes API</strong> no seu projeto</li>
            <li>Vá em "Credenciais" e crie uma nova <strong>API Key</strong></li>
            <li>Configure as restrições da API Key para usar apenas a Routes API</li>
            <li>Cole a API Key no campo abaixo</li>
          </ol>
          
          <div className="mt-3 pt-3 border-t border-primary/20">
            <a
              href="https://console.cloud.google.com/apis/library/routes.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Google Cloud Console
            </a>
          </div>
        </div>

        {/* Configuração da API Key */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Google Routes API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Sua API Key será armazenada de forma segura e criptografada
            </p>
          </div>

          <Button 
            onClick={handleSave}
            disabled={!apiKey.trim() || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>

        {/* Informações sobre custos */}
        <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
          <h4 className="font-medium text-yellow-700 mb-2">💡 Sobre os custos:</h4>
          <ul className="text-sm text-yellow-600 space-y-1">
            <li>• A Google Routes API cobra por requisição</li>
            <li>• Valores aproximados: $0.005 - $0.010 por requisição</li>
            <li>• Google oferece $200 de créditos grátis mensalmente</li>
            <li>• Monitore o uso no Google Cloud Console</li>
          </ul>
        </div>

        {/* Status da configuração atual */}
        {config && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-medium text-foreground mb-2">Configuração Atual:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>API Key:</strong> •••••••••••••{config.api_key.slice(-6)}</p>
              <p><strong>Configurada em:</strong> {new Date(config.created_at).toLocaleString('pt-BR')}</p>
              <p><strong>Status:</strong> {config.is_active ? '✅ Ativa' : '❌ Inativa'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleRoutesApiConfig;
