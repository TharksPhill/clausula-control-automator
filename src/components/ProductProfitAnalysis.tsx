import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, TrendingUp, Package, DollarSign, Edit2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "@/hooks/use-toast";

const ProductProfitAnalysis = () => {
  const { productAnalysis, loading, updateProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [minimumMarginFilter, setMinimumMarginFilter] = useState("");
  
  // Estados para edição inline
  const [editingField, setEditingField] = useState<{productId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Estados para alternar entre R$ e %
  const [displayModes, setDisplayModes] = useState<Record<string, 'currency' | 'percentage'>>({
    supplier_cost: 'currency',
    ipi_cost: 'currency',
    shipping_cost: 'currency',
    selling_price: 'currency',
    fixed_cost_allocation: 'currency',
    tax_cost: 'currency',
    customer_shipping_cost: 'currency',
    boleto_cost: 'currency',
    gross_profit: 'currency',
    net_profit: 'currency',
    margin: 'percentage'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return "text-green-600 bg-green-50";
    if (margin >= 10) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const toggleDisplayMode = (column: string) => {
    setDisplayModes(prev => ({
      ...prev,
      [column]: prev[column] === 'currency' ? 'percentage' : 'currency'
    }));
  };

  const formatValue = (value: number, column: string, totalSellingPrice?: number) => {
    const mode = displayModes[column];
    if (mode === 'percentage' && totalSellingPrice && totalSellingPrice > 0) {
      const percentage = (value / totalSellingPrice) * 100;
      return formatPercentage(percentage);
    }
    return formatCurrency(value);
  };

  const startEditing = (productId: string, field: string, currentValue: number) => {
    setEditingField({ productId, field });
    setEditValue(currentValue.toString());
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingField) return;
    
    const numericValue = parseFloat(editValue);
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Erro",
        description: "Valor inválido. Digite um número positivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProduct(editingField.productId, {
        [editingField.field]: numericValue
      });
      
      toast({
        title: "Sucesso",
        description: "Valor atualizado com sucesso!",
      });
      
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor.",
        variant: "destructive",
      });
    }
  };

  const renderEditableCell = (
    value: number, 
    productId: string, 
    field: string, 
    column: string,
    totalSellingPrice?: number
  ) => {
    const isEditing = editingField?.productId === productId && editingField?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-20 h-8 text-xs"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-6 w-6 p-0">
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <span>{formatValue(value, column, totalSellingPrice)}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEditing(productId, field, value)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const renderColumnHeader = (title: string, column: string, canToggle: boolean = true) => {
    return (
      <TableHead className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span>{title}</span>
          {canToggle && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleDisplayMode(column)}
              className="h-6 w-6 p-0"
              title={`Alternar para ${displayModes[column] === 'currency' ? '%' : 'R$'}`}
            >
              {displayModes[column] === 'currency' ? 
                <ToggleLeft className="h-4 w-4" /> : 
                <ToggleRight className="h-4 w-4" />
              }
            </Button>
          )}
        </div>
      </TableHead>
    );
  };

  const filteredAnalysis = productAnalysis.filter((analysis) => {
    const product = analysis.products;
    if (!product) return false;

    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentMethod = paymentMethodFilter === "all" || product.payment_method === paymentMethodFilter;
    const matchesMinimumMargin = minimumMarginFilter === "" || analysis.margin_percentage >= parseFloat(minimumMarginFilter);

    return matchesSearch && matchesPaymentMethod && matchesMinimumMargin;
  });

  const totalProducts = filteredAnalysis.length;
  const totalRevenue = filteredAnalysis.reduce((sum, analysis) => sum + analysis.selling_price, 0);
  const totalProfit = filteredAnalysis.reduce((sum, analysis) => sum + analysis.net_profit, 0);
  const averageMargin = totalProducts > 0 ? filteredAnalysis.reduce((sum, analysis) => sum + analysis.margin_percentage, 0) / totalProducts : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Análise de Lucros de Produtos (DRE)</h1>
          <p className="text-muted-foreground mt-2">Demonstrativo de resultados detalhado por produto</p>
        </div>
      </div>

      {/* Métricas Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-transparent border-blue-500/50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold text-blue-300">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-green-500/50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-purple-500/50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido Total</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-300' : 'text-red-400'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-orange-500/50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem Média</p>
                <p className={`text-2xl font-bold ${averageMargin >= 0 ? 'text-green-300' : 'text-red-400'}`}>
                  {formatPercentage(averageMargin)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar Produto</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o nome do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment-method">Forma de Pagamento</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as formas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  <SelectItem value="money">Dinheiro/PIX/Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minimum-margin">Margem Mínima (%)</Label>
              <Input
                id="minimum-margin"
                type="number"
                step="0.01"
                placeholder="Ex: 10"
                value={minimumMarginFilter}
                onChange={(e) => setMinimumMarginFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setPaymentMethodFilter("all");
                setMinimumMarginFilter("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Análise */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Produto</CardTitle>
          <CardDescription>
            Demonstrativo financeiro completo de cada produto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {filteredAnalysis.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {productAnalysis.length === 0 ? "Nenhum produto encontrado" : "Nenhum produto corresponde aos filtros"}
              </h3>
              <p className="text-gray-600">
                {productAnalysis.length === 0 
                  ? "Cadastre produtos primeiro para ver a análise de lucros" 
                  : "Tente ajustar os filtros para ver mais resultados"
                }
              </p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    {renderColumnHeader("Custo Real do Produto", "supplier_cost")}
                    {renderColumnHeader("IPI sobre o Produto", "ipi_cost")}
                    {renderColumnHeader("Frete do Fornecedor", "shipping_cost")}
                    {renderColumnHeader("Preço de Venda", "selling_price")}
                    {renderColumnHeader("Rateio de Custo Fixo", "fixed_cost_allocation")}
                    {renderColumnHeader("Imposto de Venda", "tax_cost")}
                    {renderColumnHeader("Frete (Cliente Final)", "customer_shipping_cost")}
                    {renderColumnHeader("Custo do Boleto", "boleto_cost")}
                    {renderColumnHeader("Lucro Bruto", "gross_profit")}
                    {renderColumnHeader("Lucro Líquido", "net_profit")}
                    {renderColumnHeader("Margem (%)", "margin", false)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalysis.map((analysis) => {
                    const product = analysis.products;
                    if (!product) return null;
                    
                    // Calcular IPI
                    const ipiCost = product.ipi_type === 'percentage' 
                      ? product.supplier_cost * (product.ipi_value / 100)
                      : product.ipi_value;

                    return (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{product.name}</p>
                            <div className="flex flex-col gap-1 mt-1">
                              <Badge variant="outline">
                                {product.payment_method === 'money' ? 'Dinheiro/PIX/Cartão' : 'Boleto'}
                              </Badge>
                              {(!product.sales_projection || product.sales_projection <= 0) && (
                                <Badge variant="destructive" className="text-xs">
                                  ⚠️ Definir projeção de vendas
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-between group">
                            <span>{(product as any).quantity || 1} unidade{((product as any).quantity || 1) > 1 ? 's' : ''}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(product.id, 'quantity', (product as any).quantity || 1)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatValue(product.supplier_cost, 'supplier_cost', analysis.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatValue(ipiCost, 'ipi_cost', analysis.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderEditableCell(
                            product.shipping_cost, 
                            product.id, 
                            'shipping_cost', 
                            'shipping_cost',
                            analysis.selling_price
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatValue(analysis.selling_price, 'selling_price', analysis.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatValue(analysis.fixed_cost_allocation, 'fixed_cost_allocation', analysis.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatValue(analysis.tax_cost, 'tax_cost', analysis.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {renderEditableCell(
                            product.customer_shipping_cost, 
                            product.id, 
                            'customer_shipping_cost', 
                            'customer_shipping_cost',
                            analysis.selling_price
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatValue(analysis.boleto_cost, 'boleto_cost', analysis.selling_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={analysis.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatValue(analysis.gross_profit, 'gross_profit', analysis.selling_price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={analysis.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatValue(analysis.net_profit, 'net_profit', analysis.selling_price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={getMarginColor(analysis.margin_percentage)}>
                            {formatPercentage(analysis.margin_percentage)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductProfitAnalysis;