import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";
import { useContractorSegments } from "@/hooks/useContractorSegments";
import { segmentConfig, segmentDescriptions } from "@/utils/cnaeClassification";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";

const MarketSegmentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("market-segmentation");
  const { 
    contractorsWithSegments,
    segmentStats,
    isLoading,
    refetch,
    updateCNAEs,
    isUpdatingCNAEs
  } = useContractorSegments();

  // Filtrar segmentos baseado na busca
  const filteredSegments = useMemo(() => {
    if (!searchTerm) return segmentStats;
    
    return segmentStats.filter(segment => {
      const searchLower = searchTerm.toLowerCase();
      return (
        segment.name.toLowerCase().includes(searchLower) ||
        segment.contractors.some(c => 
          c.name?.toLowerCase().includes(searchLower) ||
          c.cnpj?.includes(searchTerm) ||
          c.cnae_principal?.includes(searchTerm)
        )
      );
    });
  }, [segmentStats, searchTerm]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalContracts = contractorsWithSegments?.length || 0;
    const totalRevenue = segmentStats.reduce((acc, seg) => acc + seg.totalRevenue, 0);
    const activeSegments = segmentStats.filter(seg => seg.count > 0).length;
    const averageTicket = totalContracts > 0 ? totalRevenue / totalContracts : 0;
    const withCNAE = contractorsWithSegments?.filter(c => c.cnae_principal).length || 0;
    const withoutCNAE = totalContracts - withCNAE;
    
    return {
      totalContracts,
      totalRevenue,
      activeSegments,
      averageTicket,
      withCNAE,
      withoutCNAE,
      cnaePercentage: totalContracts > 0 ? (withCNAE / totalContracts) * 100 : 0
    };
  }, [contractorsWithSegments, segmentStats]);

  // Exportar dados para CSV
  const exportData = () => {
    const csvHeader = "Empresa,CNPJ,CNAE,Descrição CNAE,Segmento,Cidade,Estado,Contrato,Valor Mensal\n";
    const csvContent = contractorsWithSegments?.map(contractor => 
      `"${contractor.name || ''}","${contractor.cnpj || ''}","${contractor.cnae_principal || ''}","${contractor.cnae_descricao || ''}","${contractor.segmento || 'Outros'}","${contractor.city || ''}","${contractor.state || ''}","${contractor.contract_number}","${contractor.monthly_value}"`
    ).join("\n") || "";
    
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `segmentacao_mercado_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação concluída",
      description: "Os dados de segmentação foram exportados com sucesso.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar 
          activeView={activeView}
          onViewChange={setActiveView}
          onNewContract={() => {}}
        />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Segmentação de Mercado</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell onViewAll={() => {}} />
                <ThemeToggle />
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold">Segmentação de Mercado</h2>
                  <p className="text-muted-foreground mt-1">
                    Análise automática baseada em CNAE (Classificação Nacional de Atividades Econômicas)
                  </p>
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => updateCNAEs()}
                          disabled={isUpdatingCNAEs}
                        >
                          {isUpdatingCNAEs ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Atualizar CNAEs
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Buscar CNAEs faltantes na Receita Federal</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* Status de CNAE */}
              {stats.withoutCNAE > 0 && (
                <Card className="border-warning bg-warning/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">Dados incompletos</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stats.withoutCNAE} empresa(s) sem CNAE identificado. 
                          Clique em "Atualizar CNAEs" para buscar automaticamente.
                        </p>
                        <Progress 
                          value={stats.cnaePercentage} 
                          className="mt-2 h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.cnaePercentage.toFixed(1)}% com CNAE identificado
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Empresas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{stats.totalContracts}</span>
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span className="text-xs text-muted-foreground">
                        {stats.withCNAE} com CNAE
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Receita Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatMonetaryValue(stats.totalRevenue)}
                      </span>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Segmentos Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{stats.activeSegments}</span>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ticket Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatMonetaryValue(stats.averageTicket)}
                      </span>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Busca e Filtros */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por empresa, CNPJ, CNAE ou segmento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Lista de Segmentos */}
              <div className="grid grid-cols-1 gap-4">
                {filteredSegments.map((segment) => {
                  const config = segmentConfig[segment.name] || segmentConfig['Outros'];
                  const description = segmentDescriptions[segment.name] || '';
                  const isExpanded = selectedSegment === segment.name;
                  
                  return (
                    <Card key={segment.name} className="overflow-hidden">
                      <CardHeader 
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${config.bgColor}`}
                        onClick={() => setSelectedSegment(isExpanded ? null : segment.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                              <CardTitle className={`text-lg ${config.color}`}>
                                {segment.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold">{segment.count}</p>
                              <p className="text-xs text-muted-foreground">empresas</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                {formatMonetaryValue(segment.totalRevenue)}
                              </p>
                              <p className="text-xs text-muted-foreground">receita total</p>
                            </div>
                            <Button variant="ghost" size="icon">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-sm text-muted-foreground">
                                Ticket médio: {formatMonetaryValue(segment.averageTicket)}
                              </p>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2 text-sm">Empresa</th>
                                    <th className="text-left p-2 text-sm">CNPJ</th>
                                    <th className="text-left p-2 text-sm">CNAE</th>
                                    <th className="text-left p-2 text-sm">Segmento</th>
                                    <th className="text-left p-2 text-sm">Descrição CNAE</th>
                                    <th className="text-left p-2 text-sm">Cidade/UF</th>
                                    <th className="text-left p-2 text-sm">Contrato</th>
                                    <th className="text-right p-2 text-sm">Valor Mensal</th>
                                    <th className="text-center p-2 text-sm">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {segment.contractors.map((contractor, idx) => (
                                    <tr key={idx} className="border-b hover:bg-muted/50">
                                      <td className="p-2 text-sm font-medium">
                                        {contractor.name || "N/A"}
                                      </td>
                                      <td className="p-2 text-sm text-muted-foreground">
                                        {contractor.cnpj || "N/A"}
                                      </td>
                                      <td className="p-2 text-sm">
                                        {contractor.cnae_principal ? (
                                          <Badge variant="outline" className="text-xs">
                                            {contractor.cnae_principal}
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">
                                            Sem CNAE
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="p-2 text-sm">
                                        <Badge 
                                          className={`text-xs ${config.bgColor} ${config.color}`}
                                          variant="outline"
                                        >
                                          {contractor.segmento || segment.name}
                                        </Badge>
                                      </td>
                                      <td className="p-2 text-sm text-muted-foreground max-w-xs truncate" title={contractor.cnae_descricao || ''}>
                                        {contractor.cnae_descricao || '-'}
                                      </td>
                                      <td className="p-2 text-sm text-muted-foreground">
                                        {contractor.city || "N/A"}, {contractor.state || "N/A"}
                                      </td>
                                      <td className="p-2 text-sm">
                                        {contractor.contract_number}
                                      </td>
                                      <td className="p-2 text-sm text-right font-semibold">
                                        {formatMonetaryValue(parseFloat(contractor.monthly_value) || 0)}
                                      </td>
                                      <td className="p-2 text-center">
                                        <Badge 
                                          variant={contractor.status === "Ativo" ? "default" : "secondary"}
                                          className="text-xs"
                                        >
                                          {contractor.status}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {filteredSegments.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum segmento encontrado para sua busca.
                  </p>
                </Card>
              )}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MarketSegmentation;