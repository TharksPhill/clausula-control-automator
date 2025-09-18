import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  supplier_cost: number;
  ipi_type: 'percentage' | 'fixed';
  ipi_value: number;
  shipping_cost: number;
  customer_shipping_cost: number;
  selling_price: number;
  payment_method: 'money' | 'boleto';
  individual_tax_percentage: number;
  installments?: number;
  sales_projection: number;
  quantity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductProfitAnalysis {
  id: string;
  product_id: string;
  user_id: string;
  total_cost: number;
  selling_price: number;
  gross_profit: number;
  tax_cost: number;
  boleto_cost: number;
  fixed_cost_allocation: number;
  net_profit: number;
  margin_percentage: number;
  created_at: string;
  updated_at: string;
  products?: Product;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productAnalysis, setProductAnalysis] = useState<ProductProfitAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductAnalysis = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('product_profit_analysis')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductAnalysis((data || []) as ProductProfitAnalysis[]);
    } catch (error) {
      console.error('Erro ao buscar análise de produtos:', error);
      toast({
        title: "Erro", 
        description: "Não foi possível carregar a análise de produtos.",
        variant: "destructive",
      });
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
      await fetchProductAnalysis();
      
      toast({
        title: "Sucesso",
        description: "Produto cadastrado com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o produto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchProducts();
      await fetchProductAnalysis();
      
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o produto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProducts();
      await fetchProductAnalysis();
      
      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchProductAnalysis();
    }
  }, [user]);

  return {
    products,
    productAnalysis,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: () => {
      fetchProducts();
      fetchProductAnalysis();
    }
  };
};