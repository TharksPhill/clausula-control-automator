
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { X, Save } from "lucide-react";

interface PageActionsProps {
  onSave?: () => void;
  onCancel?: () => void;
  showSaveButton?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const PageActions = ({ 
  onSave, 
  onCancel,
  showSaveButton = true,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
  isLoading = false,
  disabled = false
}: PageActionsProps) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    console.log('🚀 Botão cancelar clicado - PageActions');
    if (onCancel) {
      console.log('🔄 Executando onCancel customizado');
      onCancel();
    } else {
      console.log('🏠 Navegando para dashboard');
      navigate("/dashboard");
      // Forçar reload da página para garantir que voltemos ao estado inicial
      window.location.reload();
    }
  };

  const handleSave = () => {
    console.log('💾 Botão salvar clicado - PageActions');
    if (onSave) {
      onSave();
    }
  };

  console.log('🎯 PageActions renderizando:', {
    showSaveButton,
    cancelLabel,
    saveLabel,
    position: 'fixed bottom'
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="flex items-center gap-3 justify-start max-w-7xl mx-auto">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="flex items-center gap-2 min-w-[120px]"
        >
          <X className="w-4 h-4" />
          {cancelLabel}
        </Button>
        
        {showSaveButton && onSave && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={disabled || isLoading}
            className="flex items-center gap-2 min-w-[120px]"
          >
            {isLoading ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saveLabel}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageActions;
