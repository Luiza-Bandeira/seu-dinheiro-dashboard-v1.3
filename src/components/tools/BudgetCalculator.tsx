import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Plus, Trash2, Pencil, Receipt, RefreshCw, CreditCard } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { RecurringExpenses } from "./RecurringExpenses";
import { InstallmentPurchases } from "./InstallmentPurchases";

type FinanceType = Database["public"]["Enums"]["finance_type"];

interface BudgetCalculatorProps {
  userId: string;
}

interface FinanceEntry {
  id?: string;
  type: string;
  category: string;
  value: number;
  description: string;
  date: string;
}

interface RecurringExpense {
  id: string;
  amount: number;
  frequency: string;
  is_active: boolean;
}

interface InstallmentPurchase {
  id: string;
  installment_amount: number;
  is_active: boolean;
}

export function BudgetCalculator({ userId }: BudgetCalculatorProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [installmentPurchases, setInstallmentPurchases] = useState<InstallmentPurchase[]>([]);
  const [newEntry, setNewEntry] = useState<FinanceEntry>({
    type: "income",
    category: "",
    value: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    await Promise.all([
      loadEntries(),
      loadRecurringExpenses(),
      loadInstallmentPurchases(),
    ]);
  };

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar entradas:", error);
      return;
    }

    setEntries(data || []);
  };

  const loadRecurringExpenses = async () => {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("id, amount, frequency, is_active")
      .eq("user_id", userId);

    if (!error && data) {
      setRecurringExpenses(data);
    }
  };

  const loadInstallmentPurchases = async () => {
    const { data, error } = await supabase
      .from("installment_purchases")
      .select("id, installment_amount, is_active")
      .eq("user_id", userId);

    if (!error && data) {
      setInstallmentPurchases(data);
    }
  };

  const handleAddEntry = async () => {
    if (loading) return;

    if (!newEntry.category || newEntry.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("finances").insert([{
      user_id: userId,
      type: newEntry.type as FinanceType,
      category: newEntry.category,
      value: newEntry.value,
      description: newEntry.description,
      date: newEntry.date,
    }]);

    if (error) {
      toast({
        title: "Erro ao adicionar entrada",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Entrada adicionada!",
      description: "Sua entrada financeira foi registrada com sucesso.",
    });

    setNewEntry({
      type: "income",
      category: "",
      value: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    });

    await loadEntries();
    setLoading(false);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry?.id || loading) return;

    setLoading(true);

    const { error } = await supabase
      .from("finances")
      .update({
        type: editingEntry.type as FinanceType,
        category: editingEntry.category,
        value: editingEntry.value,
        description: editingEntry.description,
        date: editingEntry.date,
      })
      .eq("id", editingEntry.id);

    if (error) {
      toast({
        title: "Erro ao atualizar entrada",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Entrada atualizada!",
      description: "Sua entrada financeira foi atualizada com sucesso.",
    });

    setEditingEntry(null);
    await loadEntries();
    setLoading(false);
  };

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase.from("finances").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar entrada",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Entrada deletada!",
      description: "Sua entrada financeira foi removida.",
    });

    await loadEntries();
  };

  const calculateRecurringMonthlyTotal = () => {
    return recurringExpenses
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

  const calculateInstallmentsMonthlyTotal = () => {
    return installmentPurchases
      .filter(p => p.is_active)
      .reduce((total, purchase) => total + purchase.installment_amount, 0);
  };

  const calculateTotals = () => {
    let income = 0;
    let expenses = 0;

    entries.forEach((entry) => {
      if (entry.type === "income" || entry.type === "receivable") {
        income += Number(entry.value);
      } else {
        expenses += Number(entry.value);
      }
    });

    const recurringTotal = calculateRecurringMonthlyTotal();
    const installmentsTotal = calculateInstallmentsMonthlyTotal();

    return { 
      income, 
      expenses, 
      recurringTotal,
      installmentsTotal,
      totalExpenses: expenses + recurringTotal + installmentsTotal,
      balance: income - (expenses + recurringTotal + installmentsTotal)
    };
  };

  const totals = calculateTotals();

  const chartData = [
    { name: "Receitas", value: totals.income, color: "#0B2860" },
    { name: "Despesas Únicas", value: totals.expenses, color: "#ef137c" },
    { name: "Recorrentes", value: totals.recurringTotal, color: "#f7acb3" },
    { name: "Parceladas", value: totals.installmentsTotal, color: "#9333ea" },
  ].filter(item => item.value > 0);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Receita";
      case "fixed_expense":
        return "Despesa Fixa";
      case "variable_expense":
        return "Despesa Variável";
      case "receivable":
        return "A Receber";
      case "debt":
        return "Dívida";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Transação Única</span>
            <span className="sm:hidden">Única</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Despesa Recorrente</span>
            <span className="sm:hidden">Recorrente</span>
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Compra Parcelada</span>
            <span className="sm:hidden">Parcelada</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edit Entry Dialog */}
            <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pencil className="h-5 w-5" />
                    Editar Transação
                  </DialogTitle>
                </DialogHeader>
                {editingEntry && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={editingEntry.type}
                        onValueChange={(value) => setEditingEntry({ ...editingEntry, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="fixed_expense">Despesa Fixa</SelectItem>
                          <SelectItem value="variable_expense">Despesa Variável</SelectItem>
                          <SelectItem value="receivable">A Receber</SelectItem>
                          <SelectItem value="debt">Dívida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Input
                        value={editingEntry.category}
                        onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={editingEntry.value || ""}
                        onChange={(e) => setEditingEntry({ ...editingEntry, value: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={editingEntry.description || ""}
                        onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={editingEntry.date}
                        onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingEntry(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateEntry} disabled={loading}>
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle className="text-brand-blue">Adicionar Transação Única</CardTitle>
                <CardDescription>Registre suas receitas e despesas pontuais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newEntry.type}
                    onValueChange={(value) => setNewEntry({ ...newEntry, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="fixed_expense">Despesa Fixa</SelectItem>
                      <SelectItem value="variable_expense">Despesa Variável</SelectItem>
                      <SelectItem value="receivable">A Receber</SelectItem>
                      <SelectItem value="debt">Dívida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    placeholder="Ex: Salário, Aluguel, Alimentação"
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={newEntry.value || ""}
                    onChange={(e) => setNewEntry({ ...newEntry, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição opcional"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddEntry} disabled={loading} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Transação
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-brand-blue">Resumo do Orçamento</CardTitle>
                <CardDescription>Visão geral consolidada das suas finanças</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-accent/20">
                    <p className="text-sm text-muted-foreground mb-1">Receitas</p>
                    <p className="text-xl font-bold text-brand-blue">
                      R$ {totals.income.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Despesas Totais</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {totals.totalExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>

                {(totals.recurringTotal > 0 || totals.installmentsTotal > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {totals.recurringTotal > 0 && (
                      <div className="text-center p-3 rounded-lg bg-pink-100 dark:bg-pink-900/20">
                        <p className="text-xs text-muted-foreground mb-1">Recorrentes/mês</p>
                        <p className="text-lg font-semibold text-pink-600">
                          R$ {totals.recurringTotal.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {totals.installmentsTotal > 0 && (
                      <div className="text-center p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <p className="text-xs text-muted-foreground mb-1">Parcelas/mês</p>
                        <p className="text-lg font-semibold text-purple-600">
                          R$ {totals.installmentsTotal.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Saldo</p>
                  <p
                    className={`text-2xl font-bold ${
                      totals.balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    R$ {totals.balance.toFixed(2)}
                  </p>
                </div>

                {chartData.length > 1 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-sm text-brand-blue">Entradas Recentes</h4>
                  {entries.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded border border-border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{entry.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTypeLabel(entry.type)} • {entry.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">R$ {Number(entry.value).toFixed(2)}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingEntry(entry)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => entry.id && handleDeleteEntry(entry.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringExpenses userId={userId} />
        </TabsContent>

        <TabsContent value="installments">
          <InstallmentPurchases userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
