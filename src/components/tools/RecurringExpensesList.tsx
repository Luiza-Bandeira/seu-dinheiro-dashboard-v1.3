import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, Pencil, Pause, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecurringExpensesListProps {
  userId: string;
  onUpdate?: () => void;
}

interface RecurringExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  next_due_date: string;
}

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

export function RecurringExpensesList({ userId, onUpdate }: RecurringExpensesListProps) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  useEffect(() => {
    loadExpenses();
  }, [userId]);

  const loadExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar despesas recorrentes:", error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || saving) return;

    setSaving(true);

    const { error } = await supabase
      .from("recurring_expenses")
      .update({
        category: editingExpense.category,
        description: editingExpense.description,
        amount: editingExpense.amount,
        frequency: editingExpense.frequency,
        start_date: editingExpense.start_date,
        end_date: editingExpense.end_date,
        next_due_date: editingExpense.next_due_date,
      })
      .eq("id", editingExpense.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Despesa atualizada!" });
      setEditingExpense(null);
      await loadExpenses();
      onUpdate?.();
    }

    setSaving(false);
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    const { error } = await supabase
      .from("recurring_expenses")
      .update({ is_active: !expense.is_active })
      .eq("id", expense.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: expense.is_active ? "Despesa pausada" : "Despesa reativada" });
      await loadExpenses();
      onUpdate?.();
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Despesa removida!" });
      await loadExpenses();
      onUpdate?.();
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label || frequency;
  };

  const calculateMonthlyTotal = () => {
    return expenses
      .filter(e => e.is_active)
      .reduce((total, expense) => {
        switch (expense.frequency) {
          case "daily": return total + expense.amount * 30;
          case "weekly": return total + expense.amount * 4;
          case "monthly": return total + expense.amount;
          case "yearly": return total + expense.amount / 12;
          default: return total;
        }
      }, 0);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Despesa Recorrente
            </DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingExpense.description || ""}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editingExpense.amount || ""}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={editingExpense.frequency}
                  onValueChange={(value) => setEditingExpense({ ...editingExpense, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={editingExpense.start_date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={editingExpense.end_date || ""}
                    onChange={(e) => setEditingExpense({ ...editingExpense, end_date: e.target.value || null })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>Cancelar</Button>
            <Button onClick={handleUpdateExpense} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-blue flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Despesas Recorrentes
              </CardTitle>
              <CardDescription>
                Total mensal: <span className="font-semibold text-primary">R$ {calculateMonthlyTotal().toFixed(2)}</span>
              </CardDescription>
            </div>
            <Badge variant="outline">{expenses.filter(e => e.is_active).length} ativas</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nenhuma despesa recorrente cadastrada.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    expense.is_active 
                      ? "bg-card border-border" 
                      : "bg-muted/50 border-muted opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{expense.category}</p>
                      <Badge variant={expense.is_active ? "default" : "secondary"} className="text-xs">
                        {getFrequencyLabel(expense.frequency)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Próximo: {new Date(expense.next_due_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <p className="font-bold text-primary whitespace-nowrap mr-1">
                      R$ {Number(expense.amount).toFixed(2)}
                    </p>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleActive(expense)}>
                      {expense.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-green-600" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingExpense(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
