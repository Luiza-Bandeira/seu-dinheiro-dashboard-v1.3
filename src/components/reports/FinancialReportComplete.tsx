import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, Receipt, PiggyBank } from "lucide-react";
import { exportToPDF, exportToCSV, formatCurrency } from "@/utils/exportUtils";
import { motion } from "framer-motion";

interface FinancialReportCompleteProps {
  userId: string;
}

interface FinanceEntry {
  id: string;
  type: string;
  category: string;
  value: number;
  date: string;
  description: string | null;
}

const COLORS = ["#0B2860", "#ef137c", "#f7acb3", "#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899"];

export function FinancialReportComplete({ userId }: FinancialReportCompleteProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(selectedMonth + "-28");
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate.toISOString().slice(0, 10))
      .order("date", { ascending: true });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const calculateTotals = () => {
    const income = entries
      .filter(e => e.type === "income")
      .reduce((sum, e) => sum + Number(e.value), 0);
    
    const fixedExpenses = entries
      .filter(e => e.type === "fixed_expense")
      .reduce((sum, e) => sum + Number(e.value), 0);

    const variableExpenses = entries
      .filter(e => e.type === "variable_expense")
      .reduce((sum, e) => sum + Number(e.value), 0);

    const debts = entries
      .filter(e => e.type === "debt")
      .reduce((sum, e) => sum + Number(e.value), 0);

    const receivables = entries
      .filter(e => e.type === "receivable")
      .reduce((sum, e) => sum + Number(e.value), 0);

    const totalExpenses = fixedExpenses + variableExpenses + debts;
    const balance = income + receivables - totalExpenses;

    return { income, fixedExpenses, variableExpenses, debts, receivables, totalExpenses, balance };
  };

  const getExpenseDistribution = () => {
    const distribution: { [key: string]: number } = {};
    
    entries
      .filter(e => e.type !== "income" && e.type !== "receivable")
      .forEach(entry => {
        if (!distribution[entry.category]) {
          distribution[entry.category] = 0;
        }
        distribution[entry.category] += Number(entry.value);
      });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const [monthlyEvolution, setMonthlyEvolution] = useState<{ month: string; receitas: number; despesas: number }[]>([]);

  useEffect(() => {
    loadMonthlyEvolution();
  }, [userId]);

  const loadMonthlyEvolution = async () => {
    // Calculate date range for last 6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);

    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().slice(0, 10))
      .lte("date", endDate.toISOString().slice(0, 10))
      .order("date", { ascending: true });

    if (error || !data) {
      console.error("Erro ao carregar evolução mensal:", error);
      return;
    }

    // Initialize months
    const months: { [key: string]: { receitas: number; despesas: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      months[monthKey] = { receitas: 0, despesas: 0 };
    }

    // Aggregate data by month
    data.forEach((entry: FinanceEntry) => {
      const monthKey = entry.date.slice(0, 7);
      if (months[monthKey]) {
        if (entry.type === "income" || entry.type === "receivable") {
          months[monthKey].receitas += Number(entry.value);
        } else {
          months[monthKey].despesas += Number(entry.value);
        }
      }
    });

    const evolutionData = Object.entries(months).map(([month, values]) => {
      const date = new Date(month + "-01");
      return {
        month: date.toLocaleDateString("pt-BR", { month: "short" }),
        ...values,
      };
    });

    setMonthlyEvolution(evolutionData);
  };

  const handleExportPDF = () => {
    const totals = calculateTotals();
    const distribution = getExpenseDistribution();

    exportToPDF({
      title: "Relatório Financeiro Completo",
      subtitle: `Mês: ${new Date(selectedMonth + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
      headers: ["Categoria", "Tipo", "Valor", "Data", "Descrição"],
      rows: entries.map(e => [
        e.category,
        e.type === "income" ? "Receita" : e.type === "fixed_expense" ? "Despesa Fixa" : e.type === "variable_expense" ? "Despesa Variável" : e.type === "debt" ? "Dívida" : "A Receber",
        formatCurrency(Number(e.value)),
        new Date(e.date).toLocaleDateString("pt-BR"),
        e.description || "-",
      ]),
      summary: [
        { label: "Receitas", value: formatCurrency(totals.income) },
        { label: "Desp. Fixas", value: formatCurrency(totals.fixedExpenses) },
        { label: "Desp. Variáveis", value: formatCurrency(totals.variableExpenses) },
        { label: "Dívidas", value: formatCurrency(totals.debts) },
        { label: "A Receber", value: formatCurrency(totals.receivables) },
        { label: "Saldo", value: formatCurrency(totals.balance) },
      ],
    }, `relatorio-financeiro-${selectedMonth}`);
  };

  const handleExportCSV = () => {
    exportToCSV({
      title: "Relatório Financeiro",
      headers: ["Categoria", "Tipo", "Valor", "Data", "Descrição"],
      rows: entries.map(e => [
        e.category,
        e.type,
        Number(e.value),
        e.date,
        e.description || "",
      ]),
    }, `relatorio-financeiro-${selectedMonth}`);
  };

  const totals = calculateTotals();
  const expenseDistribution = getExpenseDistribution();

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Carregando relatório...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header com seletor e exportação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">Relatório Financeiro Completo</h2>
          <p className="text-muted-foreground">Visão detalhada das suas finanças</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">{formatCurrency(totals.income)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Desp. Fixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-700">{formatCurrency(totals.fixedExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Desp. Variáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-700">{formatCurrency(totals.variableExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Dívidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-700">{formatCurrency(totals.debts)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700">{formatCurrency(totals.receivables)}</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${totals.balance >= 0 ? "from-emerald-50 to-emerald-100 border-emerald-200" : "from-rose-50 to-rose-100 border-rose-200"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${totals.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              <PiggyBank className="h-4 w-4" />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${totals.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(totals.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Distribuição de Despesas</CardTitle>
            <CardDescription>Gastos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {expenseDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma despesa registrada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Evolução Mensal</CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#22c55e" />
                <Bar dataKey="despesas" name="Despesas" fill="#ef137c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseDistribution.map((cat, idx) => {
              const percentage = totals.totalExpenses > 0 
                ? (cat.value / totals.totalExpenses) * 100 
                : 0;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{cat.name}</span>
                    <div className="text-right">
                      <span className="font-bold">{formatCurrency(cat.value)}</span>
                      <span className="text-sm text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {expenseDistribution.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhuma categoria encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
