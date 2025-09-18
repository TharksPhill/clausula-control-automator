import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useFinancialCategoriesBySection,
  useCreateFinancialCategory,
  useUpdateFinancialCategory,
  useDeleteFinancialCategory,
} from "@/hooks/useFinancialCategories";

interface SectionCategoryManagerProps {
  sectionId: string;
  sectionName: string;
  open: boolean;
  onClose: () => void;
}

export const SectionCategoryManager: React.FC<SectionCategoryManagerProps> = ({
  sectionId,
  sectionName,
  open,
  onClose,
}) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: categories, refetch } = useFinancialCategoriesBySection(sectionId);
  const createCategory = useCreateFinancialCategory();
  const updateCategory = useUpdateFinancialCategory();
  const deleteCategory = useDeleteFinancialCategory();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        type: "despesas", // Usar "despesas" como padrão para seções personalizadas
        sectionId, // Passar o ID da seção
      });
      setNewCategoryName("");
      refetch();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        updates: { name: editingCategory.name.trim() },
      });
      setEditingCategory(null);
      refetch();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja remover esta categoria?")) return;

    try {
      await deleteCategory.mutateAsync(categoryId);
      refetch();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Gerenciar Categorias - {sectionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar nova categoria */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <Label>Nova Categoria</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={`Nome da categoria para ${sectionName}`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateCategory();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || createCategory.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de categorias existentes */}
          <div className="space-y-2">
            <Label>Categorias Existentes</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      {editingCategory?.id === category.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateCategory();
                              } else if (e.key === "Escape") {
                                setEditingCategory(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleUpdateCategory}
                            disabled={updateCategory.isPending}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCategory(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{category.name}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditingCategory({
                                  id: category.id,
                                  name: category.name,
                                })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteCategory.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {!categories?.length && (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma categoria encontrada. Crie uma nova categoria acima.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};