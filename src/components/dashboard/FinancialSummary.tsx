import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { cn } from "@/lib/utils";

interface FinancialSummaryProps {
  userId: string;
  refreshKey?: number;
}

export function FinancialSummary({ userId, refreshKey }: FinancialSummaryProps) {
  const [viewMode, setViewMode] = useState<"all" | "month">("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    goals: 0,
  });

  useEffect(() => {
    loadFinancialSummary();
  }, [userId, refreshKey, viewMode, selectedMonth]);

  const loadFinancialSummary = async () => {
    // Build query
    let query = supabase
      .from("finances")
      .select("type, value, date")
      .eq("user_id", userId);

    // Apply date filter if in month mode
    if (viewMode === "month") {
      const [year, month] = selectedMonth.split("-");
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      
      query = query.gte("date", startDate).lte("date", endDate);
    }

    const { data: finances } = await query;

    // Get goals
    const { data: goals } = await supabase
      .from("goals")
      .select("target_value, current_value")
      .eq("user_id", userId)
      .eq("status", "in_progress");

    let totalIncome = 0;
    let totalExpenses = 0;

    finances?.forEach((finance) => {
      if (finance.type === "income" || finance.type === "receivable") {
        totalIncome += Number(finance.value);
      } else {
        totalExpenses += Number(finance.value);
      }
    });

    const goalsTotal = goals?.reduce(
      (acc, goal) => acc + Number(goal.target_value) - Number(goal.current_value),
      0
    ) || 0;

    setSummary({
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      goals: goalsTotal,
    });
  };

  const chartData = [
    { name: "Receitas", value: summary.totalIncome, color: "#0B2860" },
    { name: "Despesas", value: summary.totalExpenses, color: "#ef137c" },
  ];

  const getSelectedMonthLabel = () => {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1, 12, 0, 0);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-brand-blue">Resumo Financeiro</CardTitle>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "month")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Geral</TabsTrigger>
              <TabsTrigger value="month">Por Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {viewMode === "month" && (
            <div className="flex flex-col gap-2">
              <MonthYearPicker 
                value={selectedMonth} 
                onChange={setSelectedMonth}
                className="justify-center"
              />
              <p className="text-xs text-muted-foreground text-center">
                Dados de {getSelectedMonthLabel()}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-accent/20">
              <p className="text-sm text-muted-foreground mb-1">Receitas</p>
              <p className="text-2xl font-bold text-brand-blue">
                R$ {summary.totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Despesas</p>
              <p className="text-2xl font-bold text-primary">
                R$ {summary.totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Saldo</p>
            <p
              className={cn(
                "text-2xl font-bold",
                summary.balance >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              R$ {summary.balance.toFixed(2)}
            </p>
          </div>

          {summary.totalIncome > 0 && summary.totalExpenses > 0 && (
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
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}