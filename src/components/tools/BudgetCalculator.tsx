import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Trash2, Pencil, RefreshCw, CreditCard, TrendingUp, TrendingDown, BarChart3, Plus, FileSpreadsheet } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { QuickTransactionForm } from "./QuickTransactionForm";
import { BatchTextImport } from "./BatchTextImport";
import { RecurringExpensesList } from "./RecurringExpensesList";
import { InstallmentPurchasesList } from "./InstallmentPurchasesList";
import { motion } from "framer-motion";

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
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState<"individual" | "batch">("individual");

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
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

      {/* Form Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={formMode === "individual" ? "default" : "outline"}
          onClick={() => setFormMode("individual")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Lançamento Individual
        </Button>
        <Button
          variant={formMode === "batch" ? "default" : "outline"}
          onClick={() => setFormMode("batch")}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Lançamento em Lote
        </Button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Form (Individual or Batch) */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
          key={formMode}
        >
          {formMode === "individual" ? (
            <QuickTransactionForm userId={userId} onSuccess={loadAllData} />
          ) : (
            <BatchTextImport userId={userId} onSuccess={loadAllData} />
          )}
        </motion.div>

        {/* Budget Summary */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="rounded-2xl h-full">
            <CardHeader>
              <CardTitle className="text-brand-blue flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo do Orçamento
              </CardTitle>
              <CardDescription>Visão geral consolidada das suas finanças</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 rounded-xl bg-accent/20">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-brand-blue" />
                  <p className="text-xs text-muted-foreground mb-1">Receitas</p>
                  <p className="text-lg font-bold text-brand-blue">
                    R$ {totals.income.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/10">
                  <TrendingDown className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground mb-1">Despesas Totais</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {totals.totalExpenses.toFixed(2)}
                  </p>
                </div>
              </div>

              {(totals.recurringTotal > 0 || totals.installmentsTotal > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {totals.recurringTotal > 0 && (
                    <div className="text-center p-3 rounded-xl bg-pink-100 dark:bg-pink-900/20">
                      <RefreshCw className="h-4 w-4 mx-auto mb-1 text-pink-600" />
                      <p className="text-xs text-muted-foreground mb-1">Recorrentes/mês</p>
                      <p className="text-base font-semibold text-pink-600">
                        R$ {totals.recurringTotal.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {totals.installmentsTotal > 0 && (
                    <div className="text-center p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                      <CreditCard className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <p className="text-xs text-muted-foreground mb-1">Parcelas/mês</p>
                      <p className="text-base font-semibold text-purple-600">
                        R$ {totals.installmentsTotal.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center p-4 rounded-xl bg-muted">
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
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Entries */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-brand-blue">Entradas Recentes</CardTitle>
            <CardDescription>Últimas transações registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação registrada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(entry.type)} • {new Date(entry.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <p className={`font-semibold whitespace-nowrap ${
                        entry.type === "income" || entry.type === "receivable" 
                          ? "text-green-600" 
                          : "text-primary"
                      }`}>
                        R$ {Number(entry.value).toFixed(2)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingEntry(entry)}
                        className="h-8 w-8 shrink-0"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => entry.id && handleDeleteEntry(entry.id)}
                        className="h-8 w-8 shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recurring Expenses and Installment Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <RecurringExpensesList userId={userId} onUpdate={loadRecurringExpenses} />
        </motion.div>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <InstallmentPurchasesList userId={userId} onUpdate={loadInstallmentPurchases} />
        </motion.div>
      </div>
    </div>
  );
}
