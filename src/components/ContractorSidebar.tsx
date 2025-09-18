
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  PenTool, 
  Clock, 
  Download, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Menu
} from 'lucide-react';

interface ContractorSidebarProps {
  contractData: any;
  contractorData: any;
  onNavigate: (section: string) => void;
  currentSection: string;
  linkExpiresAt: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ContractorSidebar: React.FC<ContractorSidebarProps> = ({
  contractData,
  contractorData,
  onNavigate,
  currentSection,
  linkExpiresAt,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const timeUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(linkExpiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours <= 0) return "Expirado";
    if (hours < 24) return `${hours}h restantes`;
    
    const days = Math.floor(hours / 24);
    return `${days} dias restantes`;
  };

  const menuItems = [
    { id: 'contract', label: 'Contrato Principal', icon: FileText },
    { id: 'signature', label: 'Assinatura', icon: PenTool },
    { id: 'plan-changes', label: 'Mudanças do Plano', icon: Settings },
    { id: 'downloads', label: 'Downloads', icon: Download },
  ];

  const isActive = (view: string) => currentSection === view;

  const menuItemClass = (view: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start
    ${isCollapsed ? 'px-2' : ''}
    ${isActive(view) 
      ? "bg-blue-700 text-white shadow-lg border-l-4 border-blue-300" 
      : "text-white hover:text-blue-100"
    }
  `;

  return (
    <div className={`bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 border-r border-blue-600 h-full min-h-screen flex flex-col overflow-y-auto transition-all duration-300 relative ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header seguindo o padrão do AppSidebar */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0 shadow-lg flex-shrink-0">
        <div className="p-4">
          <div className={`flex items-center gap-3 w-full text-left hover:bg-white/20 rounded-lg p-3 transition-all duration-200 backdrop-blur-sm ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <div className="w-10 h-10 bg-white/25 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-lg">
                <FileText className="size-6 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-lg text-white">ContractPRO</span>
                <span className="truncate text-xs text-blue-100">Gestão de Contratos</span>
              </div>
            )}
            
            {/* Menu toggle button - sempre visível */}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className={`w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content area seguindo o padrão do AppSidebar */}
      <div className="bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 p-3 flex-1 flex flex-col">
        {/* Contract info section */}
        {!isCollapsed && (
          <div className="px-2 py-2 mb-4">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Informações do Contrato</p>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 shadow-lg">
              <h3 className="text-sm font-semibold text-white mb-1">
                Contrato #{contractData?.contract_number}
              </h3>
              <p className="text-xs text-blue-100 mb-3">{contractorData?.name}</p>
              
              {/* Expiration info */}
              <div className="flex items-center gap-2 p-3 bg-orange-500/20 rounded-lg border border-orange-400/30 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-orange-200" />
                <div>
                  <p className="text-xs font-medium text-orange-100">Link de Acesso</p>
                  <p className="text-xs text-orange-200">Expira em: {timeUntilExpiry()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        {!isCollapsed && (
          <div className="px-2 py-2">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Menu Principal</p>
          </div>
        )}
        
        <div className="px-1 flex-1">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={menuItemClass(item.id)}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-left flex-1">{item.label}</span>}
              </Button>
            ))}
          </div>
        </div>

        {/* Contract Status seguindo o novo padrão */}
        {!isCollapsed && (
          <>
            <div className="px-2 py-2 mt-6">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Status do Contrato</p>
            </div>

            <div className="px-1">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-100">Valor Mensal</span>
                  <span className="font-semibold text-green-300">R$ {contractData?.monthly_value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-100">Tipo de Plano</span>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-100 border-blue-300/50">
                    {contractData?.plan_type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-100">Status</span>
                  <Badge className="bg-green-500/20 text-green-100 border-green-300/50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-3 mt-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-400/30">
                    <AlertTriangle className="h-4 w-4 text-blue-200" />
                  </div>
                  <span className="text-sm font-semibold text-blue-100">Importante</span>
                </div>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Complete todas as assinaturas pendentes antes que o link expire.
                  Após a assinatura, você poderá fazer download dos documentos.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer seguindo o padrão do AppSidebar */}
      <div className="bg-gradient-to-b from-blue-800 to-blue-900 border-t border-blue-600 flex-shrink-0">
        <div className="p-4 text-center">
          {!isCollapsed ? (
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-200 justify-center mb-1">
                <Calendar className="h-3 w-3" />
                <span>Acesso seguro via link temporário</span>
              </div>
              <p className="text-xs text-blue-200">
                &copy; {new Date().getFullYear()} - Todos os direitos reservados
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Calendar className="h-3 w-3 text-blue-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorSidebar;
