import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Package, DollarSign, Edit } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useBankSlipConfigurations } from "@/hooks/useBankSlipConfigurations";

const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  supplier_cost: z.number().min(0, "Custo do fornecedor deve ser positivo"),
  ipi_type: z.enum(["percentage", "fixed"]),
  ipi_value: z.number().min(0, "Valor do IPI deve ser positivo"),
  shipping_cost: z.number().min(0, "Custo do frete deve ser positivo"),
  customer_shipping_cost: z.number().min(0, "Custo do frete para cliente deve ser positivo"),
  selling_price: z.number().min(0, "Preço de venda deve ser positivo"),
  payment_method: z.enum(["money", "boleto"]),
  individual_tax_percentage: z.number().min(0, "Percentual de imposto deve ser positivo").max(100, "Percentual não pode exceder 100%"),
  installments: z.number().min(1, "Número de parcelas deve ser pelo menos 1").optional(),
  sales_projection: z.number().min(1, "Projeção de vendas deve ser pelo menos 1"),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductRegistration = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { configurations } = useBankSlipConfigurations();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      supplier_cost: 0,
      ipi_type: "percentage",
      ipi_value: 0,
      shipping_cost: 0,
      customer_shipping_cost: 0,
      selling_price: 0,
      payment_method: "money",
      individual_tax_percentage: 0,
      installments: 1,
      sales_projection: 1,
    },
  });

  const watchPaymentMethod = form.watch("payment_method");
  const activeBankSlipConfig = configurations.find(config => config.is_active);

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        supplier_cost: editingProduct.supplier_cost,
        ipi_type: editingProduct.ipi_type,
        ipi_value: editingProduct.ipi_value,
        shipping_cost: editingProduct.shipping_cost,
        customer_shipping_cost: editingProduct.customer_shipping_cost || 0,
        selling_price: editingProduct.selling_price,
        payment_method: editingProduct.payment_method,
        individual_tax_percentage: editingProduct.individual_tax_percentage,
        installments: editingProduct.installments || 1,
        sales_projection: editingProduct.sales_projection || 1,
      });
      setShowForm(true);
    }
  }, [editingProduct, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data as Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>);
      }
      
      form.reset();
      setEditingProduct(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDelete = async (product: Product) => {
    await deleteProduct(product.id);
  };

  const handleCancel = () => {
    form.reset();
    setEditingProduct(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Cadastro de Produtos</h1>
          <p className="text-muted-foreground mt-2">Gerencie o cadastro de produtos e seus custos</p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
          disabled={showForm}
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Cards de Projeção de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-transparent border-blue-500/50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projeção Total (Unidades/Mês)</p>
                <p className="text-2xl font-bold text-blue-300">
                  {products.reduce((sum, product) => sum + (product.sales_projection || 0), 0).toLocaleString('pt-BR')} unidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-green-500/50 border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Projetado (Mensal)</p>
                <p className="text-2xl font-bold text-green-300">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(products.reduce((sum, product) => sum + (product.selling_price * (product.sales_projection || 0)), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </CardTitle>
            <CardDescription>
              Preencha as informações do produto para calcular automaticamente os custos e lucros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo do Fornecedor</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ipi_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de IPI</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentual</SelectItem>
                            <SelectItem value="fixed">Valor Fixo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ipi_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Valor do IPI {form.watch("ipi_type") === "percentage" ? "(%)" : "(R$)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipping_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frete do Fornecedor</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_shipping_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frete para Cliente Final</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="money">Dinheiro/PIX/Cartão</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="individual_tax_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentual de Imposto Individual (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sales_projection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeção de Vendas (por mês)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchPaymentMethod === "boleto" && (
                    <FormField
                      control={form.control}
                      name="installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Parcelas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {watchPaymentMethod === "boleto" && activeBankSlipConfig && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">Configuração de Boleto</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Custo por boleto: <strong>{formatCurrency(activeBankSlipConfig.slip_value)}</strong>
                      {form.watch("installments") && form.watch("installments")! > 1 && (
                        <span> × {form.watch("installments")} parcelas = <strong>{formatCurrency(activeBankSlipConfig.slip_value * form.watch("installments")!)}</strong></span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <Button type="submit" className="flex-1">
                    {editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os produtos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
              <p className="text-gray-600 mb-4">Clique em "Novo Produto" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Custo Fornecedor</TableHead>
                  <TableHead>Preço de Venda</TableHead>
                  <TableHead>Frete Cliente</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Imposto</TableHead>
                  <TableHead>Projeção Vendas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatCurrency(product.supplier_cost)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell>{formatCurrency(product.customer_shipping_cost || 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.payment_method === 'money' ? 'Dinheiro/PIX/Cartão' : 'Boleto'}
                        {product.payment_method === 'boleto' && product.installments && product.installments > 1 && (
                          <span className="ml-1">({product.installments}x)</span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.individual_tax_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {product.sales_projection || 1}/mês
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(product)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductRegistration;