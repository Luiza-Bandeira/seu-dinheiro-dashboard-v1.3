import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExpensesByCategoryProps {
  userId: string;
  refreshKey?: number;
}

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--brand-magenta))",
  "hsl(var(--brand-pink))",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

export function ExpensesByCategory({ userId, refreshKey }: ExpensesByCategoryProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [userId, refreshKey]);

  const loadExpenses = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from("finances")
      .select("category, value, type")
      .eq("user_id", userId)
      .in("type", ["fixed_expense", "variable_expense"])
      .gte("date", startOfMonth.toISOString().split("T")[0])
      .lte("date", endOfMonth.toISOString().split("T")[0]);

    if (error) {
      console.error("Erro ao carregar despesas:", error);
      setLoading(false);
      return;
    }

    // Agrupar por categoria
    const grouped: Record<string, number> = {};
    let total = 0;

    (data || []).forEach((item) => {
      const value = Number(item.value);
      grouped[item.category] = (grouped[item.category] || 0) + value;
      total += value;
    });

    // Converter para array com percentuais
    const categoryArray: CategoryData[] = Object.entries(grouped)
      .map(([category, totalValue]) => ({
        category,
        total: totalValue,
        percentage: total > 0 ? (totalValue / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    setCategoryData(categoryArray);
    setTotalExpenses(total);
    setLoading(false);
  };

  const currentMonth = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Despesas por Categoria</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-blue">Despesas por Categoria</CardTitle>
        <CardDescription className="capitalize">{currentMonth}</CardDescription>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma despesa registrada este mês</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {totalExpenses.toFixed(2)}
              </p>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="category"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Valor"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {categoryData.map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">R$ {item.total.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
