import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Plus, Trash2 } from "lucide-react";

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

export function BudgetCalculator({ userId }: BudgetCalculatorProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [newEntry, setNewEntry] = useState<FinanceEntry>({
    type: "income",
    category: "",
    value: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [userId]);

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

  const handleAddEntry = async () => {
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
      type: newEntry.type as any,
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

    return { income, expenses, balance: income - expenses };
  };

  const totals = calculateTotals();

  const chartData = [
    { name: "Receitas", value: totals.income, color: "#0B2860" },
    { name: "Despesas", value: totals.expenses, color: "#ef137c" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Adicionar Transação</CardTitle>
          <CardDescription>Registre suas receitas e despesas</CardDescription>
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
              placeholder="0.00"
              value={newEntry.value || ""}
              onChange={(e) => setNewEntry({ ...newEntry, value: parseFloat(e.target.value) })}
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
          <CardDescription>Visão geral das suas finanças</CardDescription>
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
              <p className="text-sm text-muted-foreground mb-1">Despesas</p>
              <p className="text-xl font-bold text-primary">
                R$ {totals.expenses.toFixed(2)}
              </p>
            </div>
          </div>

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

          {totals.income > 0 && totals.expenses > 0 && (
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
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded border border-border"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{entry.category}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">R$ {Number(entry.value).toFixed(2)}</p>
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
  );
}