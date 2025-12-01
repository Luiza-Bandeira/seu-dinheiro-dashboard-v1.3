import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyReportProps {
  userId: string;
}

interface FinanceEntry {
  id: string;
  type: string;
  category: string;
  value: number;
  date: string;
}

export function MonthlyReport({ userId }: MonthlyReportProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [previousMonthData, setPreviousMonthData] = useState({ income: 0, expenses: 0 });

  useEffect(() => {
    loadMonthData();
  }, [userId, selectedMonth]);

  const loadMonthData = async () => {
    // Carregar dados do mês atual
    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(selectedMonth + "-28").toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (!error && data) {
      setEntries(data);
    }

    // Carregar dados do mês anterior para comparação
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 7);
    const prevStartDate = `${prevMonthStr}-01`;
    const prevEndDate = new Date(prevMonthStr + "-28").toISOString().slice(0, 10);

    const { data: prevData } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", prevStartDate)
      .lte("date", prevEndDate);

    if (prevData) {
      const prevIncome = prevData
        .filter(e => e.type === "income" || e.type === "receivable")
        .reduce((sum, e) => sum + Number(e.value), 0);
      const prevExpenses = prevData
        .filter(e => e.type !== "income" && e.type !== "receivable")
        .reduce((sum, e) => sum + Number(e.value), 0);
      setPreviousMonthData({ income: prevIncome, expenses: prevExpenses });
    }
  };

  const calculateTotals = () => {
    const income = entries
      .filter(e => e.type === "income" || e.type === "receivable")
      .reduce((sum, e) => sum + Number(e.value), 0);
    
    const expenses = entries
      .filter(e => e.type !== "income" && e.type !== "receivable")
      .reduce((sum, e) => sum + Number(e.value), 0);

    return { income, expenses, balance: income - expenses };
  };

  const getWeeklyData = () => {
    const weeks: { [key: string]: number } = { "Semana 1": 0, "Semana 2": 0, "Semana 3": 0, "Semana 4": 0 };
    
    entries.forEach(entry => {
      if (entry.type !== "income" && entry.type !== "receivable") {
        const day = new Date(entry.date).getDate();
        const weekNum = Math.ceil(day / 7);
        weeks[`Semana ${weekNum}`] += Number(entry.value);
      }
    });

    return Object.entries(weeks).map(([name, value]) => ({ name, value }));
  };

  const getCategoryData = () => {
    const categories: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      if (entry.type !== "income" && entry.type !== "receivable") {
        if (!categories[entry.category]) {
          categories[entry.category] = 0;
        }
        categories[entry.category] += Number(entry.value);
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const totals = calculateTotals();
  const weeklyData = getWeeklyData();
  const categoryData = getCategoryData();

  const incomeVariation = previousMonthData.income > 0 
    ? ((totals.income - previousMonthData.income) / previousMonthData.income * 100).toFixed(1)
    : 0;
  
  const expensesVariation = previousMonthData.expenses > 0
    ? ((totals.expenses - previousMonthData.expenses) / previousMonthData.expenses * 100).toFixed(1)
    : 0;

  const COLORS = ["#0B2860", "#ef137c", "#f7acb3", "#6366f1", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-blue">Relatório Mensal</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = date.toISOString().slice(0, 7);
              const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
              return (
                <SelectItem key={value} value={value}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-blue">R$ {totals.income.toFixed(2)}</div>
            {Number(incomeVariation) !== 0 && (
              <div className={`flex items-center gap-1 text-sm mt-2 ${Number(incomeVariation) > 0 ? "text-green-600" : "text-red-600"}`}>
                {Number(incomeVariation) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(Number(incomeVariation))}% vs mês anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ {totals.expenses.toFixed(2)}</div>
            {Number(expensesVariation) !== 0 && (
              <div className={`flex items-center gap-1 text-sm mt-2 ${Number(expensesVariation) < 0 ? "text-green-600" : "text-red-600"}`}>
                {Number(expensesVariation) > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(Number(expensesVariation))}% vs mês anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {totals.balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Distribuição por Categoria</CardTitle>
            <CardDescription>Gastos por categoria no mês</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / totals.expenses) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Gastos por Semana</CardTitle>
            <CardDescription>Evolução semanal dos gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Bar dataKey="value" fill="#ef137c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Análise Detalhada por Categoria</CardTitle>
          <CardDescription>Ranking de gastos do maior para o menor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData.map((cat, idx) => {
              const percentage = ((cat.value / totals.expenses) * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{cat.name}</span>
                    <div className="text-right">
                      <span className="font-bold">R$ {cat.value.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categoryData.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Nenhuma categoria encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
