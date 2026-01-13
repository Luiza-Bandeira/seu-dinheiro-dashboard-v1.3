import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyExpensesChartProps {
  userId: string;
  refreshKey?: number;
}

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function MonthlyExpensesChart({ userId, refreshKey }: MonthlyExpensesChartProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [trend, setTrend] = useState<{ value: number; isPositive: boolean }>({ value: 0, isPositive: true });

  useEffect(() => {
    loadMonthlyData();
  }, [userId, refreshKey]);

  const loadMonthlyData = async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data: finances, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", sixMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("Erro ao carregar dados mensais:", error);
      return;
    }

    const monthlyMap = new Map<string, { receitas: number; despesas: number }>();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      monthlyMap.set(monthKey, { receitas: 0, despesas: 0 });
    }

    // Aggregate data
    finances?.forEach((finance) => {
      const date = new Date(finance.date + "T12:00:00");
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      
      if (monthlyMap.has(monthKey)) {
        const current = monthlyMap.get(monthKey)!;
        if (finance.type === "income") {
          current.receitas += Number(finance.value);
        } else {
          current.despesas += Number(finance.value);
        }
      }
    });

    const chartData: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, values]) => ({
      month,
      receitas: values.receitas,
      despesas: values.despesas,
      saldo: values.receitas - values.despesas,
    }));

    setData(chartData);

    // Calculate trend (comparing last month with previous)
    if (chartData.length >= 2) {
      const lastMonth = chartData[chartData.length - 1];
      const prevMonth = chartData[chartData.length - 2];
      
      if (prevMonth.despesas > 0) {
        const changePercent = ((lastMonth.despesas - prevMonth.despesas) / prevMonth.despesas) * 100;
        setTrend({
          value: Math.abs(changePercent),
          isPositive: changePercent < 0, // Less spending is positive
        });
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-brand-blue">
              Gastos Mensais
            </CardTitle>
            {trend.value > 0 && (
              <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? "text-green-600" : "text-red-500"}`}>
                {trend.isPositive ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                <span>{trend.value.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "10px" }}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
                <Bar 
                  dataKey="receitas" 
                  name="Receitas" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="despesas" 
                  name="Despesas" 
                  fill="#ef137c" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
