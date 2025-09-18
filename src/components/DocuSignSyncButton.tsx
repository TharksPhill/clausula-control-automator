
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useDocuSignRealIntegration } from '@/hooks/useDocuSignRealIntegration';

interface DocuSignSyncButtonProps {
  onSyncComplete?: () => void;
}

const DocuSignSyncButton: React.FC<DocuSignSyncButtonProps> = ({ onSyncComplete }) => {
  const { loading, isConfigured } = useDocuSignRealIntegration();

  const handleSync = async () => {
    // Por enquanto, apenas simular sincronização
    console.log('🔄 Sincronizando status de assinaturas...');
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  if (!isConfigured()) {
    return null;
  }

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? 'Sincronizando...' : 'Sincronizar DocuSign'}
    </Button>
  );
};

export default DocuSignSyncButton;
