import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, CreditCard, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface InstallmentPurchasesProps {
  userId: string;
}

interface InstallmentPurchase {
  id: string;
  category: string;
  description: string | null;
  total_amount: number;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  start_date: string;
  is_active: boolean;
}

const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48];

export function InstallmentPurchases({ userId }: InstallmentPurchasesProps) {
  const [purchases, setPurchases] = useState<InstallmentPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<InstallmentPurchase | null>(null);
  const [newPurchase, setNewPurchase] = useState({
    category: "",
    description: "",
    total_amount: 0,
    total_installments: 12,
    start_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadPurchases();
  }, [userId]);

  const loadPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("installment_purchases")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar compras parceladas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as compras parceladas.",
        variant: "destructive",
      });
    } else {
      setPurchases(data || []);
    }
    setLoading(false);
  };

  const calculateInstallmentAmount = (total: number, installments: number) => {
    if (installments <= 0) return 0;
    return total / installments;
  };

  const handleAddPurchase = async () => {
    if (saving) return;

    if (!newPurchase.category || newPurchase.total_amount <= 0) {
      toast({
        title: "Erro",
        description: "Preencha categoria e valor total.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const installmentAmount = calculateInstallmentAmount(
      newPurchase.total_amount,
      newPurchase.total_installments
    );

    const { error } = await supabase.from("installment_purchases").insert([{
      user_id: userId,
      category: newPurchase.category,
      description: newPurchase.description || null,
      total_amount: newPurchase.total_amount,
      installment_amount: installmentAmount,
      total_installments: newPurchase.total_installments,
      paid_installments: 0,
      start_date: newPurchase.start_date,
      is_active: true,
    }]);

    if (error) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Compra parcelada adicionada!",
        description: `${newPurchase.category} em ${newPurchase.total_installments}x de R$ ${installmentAmount.toFixed(2)}.`,
      });
      setNewPurchase({
        category: "",
        description: "",
        total_amount: 0,
        total_installments: 12,
        start_date: new Date().toISOString().split("T")[0],
      });
      await loadPurchases();
    }

    setSaving(false);
  };

  const handleUpdatePurchase = async () => {
    if (!editingPurchase || saving) return;

    setSaving(true);

    const installmentAmount = calculateInstallmentAmount(
      editingPurchase.total_amount,
      editingPurchase.total_installments
    );

    const { error } = await supabase
      .from("installment_purchases")
      .update({
        category: editingPurchase.category,
        description: editingPurchase.description,
        total_amount: editingPurchase.total_amount,
        installment_amount: installmentAmount,
        total_installments: editingPurchase.total_installments,
        paid_installments: editingPurchase.paid_installments,
        start_date: editingPurchase.start_date,
      })
      .eq("id", editingPurchase.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Compra atualizada!",
      });
      setEditingPurchase(null);
      await loadPurchases();
    }

    setSaving(false);
  };

  const handlePayInstallment = async (purchase: InstallmentPurchase) => {
    if (purchase.paid_installments >= purchase.total_installments) return;

    const newPaidInstallments = purchase.paid_installments + 1;
    const isComplete = newPaidInstallments >= purchase.total_installments;

    const { error } = await supabase
      .from("installment_purchases")
      .update({
        paid_installments: newPaidInstallments,
        is_active: !isComplete,
      })
      .eq("id", purchase.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: isComplete ? "Compra quitada!" : "Parcela paga!",
        description: isComplete 
          ? `${purchase.category} foi totalmente quitada.`
          : `Parcela ${newPaidInstallments}/${purchase.total_installments} paga.`,
      });
      await loadPurchases();
    }
  };

  const handleDeletePurchase = async (id: string) => {
    const { error } = await supabase
      .from("installment_purchases")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Compra removida!",
      });
      await loadPurchases();
    }
  };

  const calculateMonthlyTotal = () => {
    return purchases
      .filter(p => p.is_active)
      .reduce((total, purchase) => total + purchase.installment_amount, 0);
  };

  const getNextInstallmentDate = (startDate: string, paidInstallments: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + paidInstallments);
    return date;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const previewInstallmentAmount = calculateInstallmentAmount(
    newPurchase.total_amount,
    newPurchase.total_installments
  );

  return (
    <div className="space-y-6">
      {/* Edit Dialog */}
      <Dialog open={!!editingPurchase} onOpenChange={(open) => !open && setEditingPurchase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Compra Parcelada
            </DialogTitle>
          </DialogHeader>
          {editingPurchase && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={editingPurchase.category}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingPurchase.description || ""}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingPurchase.total_amount || ""}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, total_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Select
                    value={String(editingPurchase.total_installments)}
                    onValueChange={(value) => setEditingPurchase({ ...editingPurchase, total_installments: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTALLMENT_OPTIONS.map(num => (
                        <SelectItem key={num} value={String(num)}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={editingPurchase.start_date}
                    onChange={(e) => setEditingPurchase({ ...editingPurchase, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parcelas Pagas</Label>
                  <Input
                    type="number"
                    min="0"
                    max={editingPurchase.total_installments}
                    value={editingPurchase.paid_installments}
                    onChange={(e) => setEditingPurchase({ 
                      ...editingPurchase, 
                      paid_installments: Math.min(
                        parseInt(e.target.value) || 0, 
                        editingPurchase.total_installments
                      ) 
                    })}
                  />
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Valor de cada parcela:{" "}
                  <span className="font-bold text-foreground">
                    R$ {calculateInstallmentAmount(editingPurchase.total_amount, editingPurchase.total_installments).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPurchase(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePurchase} disabled={saving}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Adicionar Compra Parcelada
          </CardTitle>
          <CardDescription>
            Registre compras divididas em parcelas para controlar seus pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Input
                placeholder="Ex: Eletrodomésticos, Móveis"
                value={newPurchase.category}
                onChange={(e) => setNewPurchase({ ...newPurchase, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={newPurchase.total_amount || ""}
                onChange={(e) => setNewPurchase({ ...newPurchase, total_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: TV Samsung 55 polegadas"
              value={newPurchase.description}
              onChange={(e) => setNewPurchase({ ...newPurchase, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Parcelas</Label>
              <Select
                value={String(newPurchase.total_installments)}
                onValueChange={(value) => setNewPurchase({ ...newPurchase, total_installments: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTALLMENT_OPTIONS.map(num => (
                    <SelectItem key={num} value={String(num)}>{num}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data da 1ª Parcela</Label>
              <Input
                type="date"
                value={newPurchase.start_date}
                onChange={(e) => setNewPurchase({ ...newPurchase, start_date: e.target.value })}
              />
            </div>
          </div>

          {newPurchase.total_amount > 0 && (
            <div className="p-4 bg-accent/20 rounded-xl border border-accent/30">
              <p className="text-sm text-muted-foreground mb-1">Valor de cada parcela:</p>
              <p className="text-2xl font-bold text-brand-blue">
                {newPurchase.total_installments}x de R$ {previewInstallmentAmount.toFixed(2)}
              </p>
            </div>
          )}

          <Button onClick={handleAddPurchase} disabled={saving} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Compra Parcelada
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {purchases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-brand-blue">Compras Parceladas em Andamento</CardTitle>
                <CardDescription>
                  Total mensal em parcelas: <span className="font-semibold text-primary">R$ {calculateMonthlyTotal().toFixed(2)}</span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit">
                {purchases.filter(p => p.is_active).length} em andamento
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchases.map((purchase) => {
                const progress = (purchase.paid_installments / purchase.total_installments) * 100;
                const remainingInstallments = purchase.total_installments - purchase.paid_installments;
                const remainingValue = purchase.installment_amount * remainingInstallments;
                const nextDate = getNextInstallmentDate(purchase.start_date, purchase.paid_installments);

                return (
                  <div
                    key={purchase.id}
                    className={`p-4 rounded-xl border transition-all ${
                      purchase.is_active 
                        ? "bg-card border-border" 
                        : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{purchase.category}</p>
                          {!purchase.is_active && (
                            <Badge className="bg-green-600 text-xs">Quitada</Badge>
                          )}
                        </div>
                        {purchase.description && (
                          <p className="text-sm text-muted-foreground">{purchase.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          R$ {Number(purchase.installment_amount).toFixed(2)}/mês
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: R$ {Number(purchase.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {purchase.paid_installments}/{purchase.total_installments} parcelas pagas
                        </span>
                        <span className="font-medium">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {purchase.is_active && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>
                          Próxima parcela: {nextDate.toLocaleDateString("pt-BR")}
                        </span>
                        <span>
                          Restante: R$ {remainingValue.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      {purchase.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayInstallment(purchase)}
                          className="flex-1 sm:flex-none"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Pagar Parcela
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingPurchase(purchase)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeletePurchase(purchase.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
