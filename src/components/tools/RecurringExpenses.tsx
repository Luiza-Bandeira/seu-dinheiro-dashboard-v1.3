import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Pause, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecurringExpensesProps {
  userId: string;
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

export function RecurringExpenses({ userId }: RecurringExpensesProps) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: 0,
    frequency: "monthly",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

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
      toast({
        title: "Erro",
        description: "Não foi possível carregar as despesas recorrentes.",
        variant: "destructive",
      });
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const handleAddExpense = async () => {
    if (saving) return;

    if (!newExpense.category || newExpense.amount <= 0) {
      toast({
        title: "Erro",
        description: "Preencha categoria e valor.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("recurring_expenses").insert([{
      user_id: userId,
      category: newExpense.category,
      description: newExpense.description || null,
      amount: newExpense.amount,
      frequency: newExpense.frequency,
      start_date: newExpense.start_date,
      end_date: newExpense.end_date || null,
      next_due_date: newExpense.start_date,
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
        title: "Despesa recorrente adicionada!",
        description: `${newExpense.category} será cobrada ${getFrequencyLabel(newExpense.frequency).toLowerCase()}.`,
      });
      setNewExpense({
        category: "",
        description: "",
        amount: 0,
        frequency: "monthly",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
      });
      await loadExpenses();
    }

    setSaving(false);
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
      toast({
        title: "Despesa atualizada!",
      });
      setEditingExpense(null);
      await loadExpenses();
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
      toast({
        title: expense.is_active ? "Despesa pausada" : "Despesa reativada",
      });
      await loadExpenses();
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
      toast({
        title: "Despesa removida!",
      });
      await loadExpenses();
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
          case "daily":
            return total + expense.amount * 30;
          case "weekly":
            return total + expense.amount * 4;
          case "monthly":
            return total + expense.amount;
          case "yearly":
            return total + expense.amount / 12;
          default:
            return total;
        }
      }, 0);
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

  return (
    <div className="space-y-6">
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
                  <Label>Data Fim (opcional)</Label>
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
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateExpense} disabled={saving}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Adicionar Despesa Recorrente
          </CardTitle>
          <CardDescription>
            Registre despesas que se repetem automaticamente (aluguel, streaming, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Input
                placeholder="Ex: Aluguel, Netflix, Academia"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={newExpense.amount || ""}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              placeholder="Descrição opcional"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select
                value={newExpense.frequency}
                onValueChange={(value) => setNewExpense({ ...newExpense, frequency: value })}
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
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={newExpense.start_date}
                onChange={(e) => setNewExpense({ ...newExpense, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim (opcional)</Label>
              <Input
                type="date"
                value={newExpense.end_date}
                onChange={(e) => setNewExpense({ ...newExpense, end_date: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleAddExpense} disabled={saving} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Despesa Recorrente
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-brand-blue">Despesas Recorrentes Ativas</CardTitle>
                <CardDescription>
                  Total mensal estimado: <span className="font-semibold text-primary">R$ {calculateMonthlyTotal().toFixed(2)}</span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit">
                {expenses.filter(e => e.is_active).length} ativas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                    expense.is_active 
                      ? "bg-card border-border" 
                      : "bg-muted/50 border-muted opacity-60"
                  }`}
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{expense.category}</p>
                      <Badge variant={expense.is_active ? "default" : "secondary"} className="text-xs">
                        {getFrequencyLabel(expense.frequency)}
                      </Badge>
                      {!expense.is_active && (
                        <Badge variant="outline" className="text-xs">Pausada</Badge>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Próximo vencimento: {new Date(expense.next_due_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-primary mr-2">
                      R$ {Number(expense.amount).toFixed(2)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleActive(expense)}
                      title={expense.is_active ? "Pausar" : "Reativar"}
                    >
                      {expense.is_active ? (
                        <Pause className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Play className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
