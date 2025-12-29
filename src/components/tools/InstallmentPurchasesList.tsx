import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, Pencil, CreditCard, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface InstallmentPurchasesListProps {
  userId: string;
  onUpdate?: () => void;
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

export function InstallmentPurchasesList({ userId, onUpdate }: InstallmentPurchasesListProps) {
  const [purchases, setPurchases] = useState<InstallmentPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<InstallmentPurchase | null>(null);

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
    } else {
      setPurchases(data || []);
    }
    setLoading(false);
  };

  const calculateInstallmentAmount = (total: number, installments: number) => {
    if (installments <= 0) return 0;
    return total / installments;
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
      toast({ title: "Compra atualizada!" });
      setEditingPurchase(null);
      await loadPurchases();
      onUpdate?.();
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
      onUpdate?.();
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
      toast({ title: "Compra removida!" });
      await loadPurchases();
      onUpdate?.();
    }
  };

  const calculateMonthlyTotal = () => {
    return purchases
      .filter(p => p.is_active)
      .reduce((total, purchase) => total + purchase.installment_amount, 0);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                      paid_installments: Math.min(parseInt(e.target.value) || 0, editingPurchase.total_installments) 
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
            <Button variant="outline" onClick={() => setEditingPurchase(null)}>Cancelar</Button>
            <Button onClick={handleUpdatePurchase} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-blue flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Compras Parceladas
              </CardTitle>
              <CardDescription>
                Total mensal: <span className="font-semibold text-primary">R$ {calculateMonthlyTotal().toFixed(2)}</span>
              </CardDescription>
            </div>
            <Badge variant="outline">{purchases.filter(p => p.is_active).length} em andamento</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nenhuma compra parcelada cadastrada.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {purchases.map((purchase) => {
                const progress = (purchase.paid_installments / purchase.total_installments) * 100;
                const remainingInstallments = purchase.total_installments - purchase.paid_installments;

                return (
                  <div
                    key={purchase.id}
                    className={`p-3 rounded-xl border transition-all ${
                      purchase.is_active 
                        ? "bg-card border-border" 
                        : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{purchase.category}</p>
                          {!purchase.is_active && (
                            <Badge className="bg-green-600 text-xs">Quitada</Badge>
                          )}
                        </div>
                        {purchase.description && (
                          <p className="text-xs text-muted-foreground truncate">{purchase.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-primary whitespace-nowrap ml-2">
                        R$ {Number(purchase.installment_amount).toFixed(2)}/mês
                      </p>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{purchase.paid_installments}/{purchase.total_installments} pagas</span>
                        <span>Restam: R$ {(purchase.installment_amount * remainingInstallments).toFixed(2)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-end gap-1">
                      {purchase.is_active && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => handlePayInstallment(purchase)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Pagar Parcela
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingPurchase(purchase)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeletePurchase(purchase.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
