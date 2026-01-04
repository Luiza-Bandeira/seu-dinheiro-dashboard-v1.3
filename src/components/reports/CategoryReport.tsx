import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Calendar, Hash, LayoutGrid } from "lucide-react";
import { formatCurrency } from "@/utils/exportUtils";

interface CategoryReportProps {
  userId: string;
}

interface FinanceEntry {
  id: string;
  category: string;
  value: number;
  date: string;
  type: string;
}

interface CategorySummary {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = ["#0B2860", "#ef137c", "#f7acb3", "#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];

export function CategoryReport({ userId }: CategoryReportProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);

    // Carregar últimos 3 meses de dados
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startDate = threeMonthsAgo.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .order("date", { ascending: true });

    if (!error && data) {
      setEntries(data);
      
      // Extrair categorias únicas
      const uniqueCategories = Array.from(new Set(data.map(e => e.category))).sort();
      setCategories(uniqueCategories);
      
      if (uniqueCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCategories[0]);
      }
    }

    setLoading(false);
  };

  // Obter resumo de todas as categorias (apenas despesas)
  const getAllCategoriesSummary = (): CategorySummary[] => {
    const categoryTotals: { [key: string]: number } = {};
    
    entries
      .filter(e => e.type !== "income" && e.type !== "receivable")
      .forEach((entry) => {
        if (!categoryTotals[entry.category]) {
          categoryTotals[entry.category] = 0;
        }
        categoryTotals[entry.category] += Number(entry.value);
      });

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getCategoryData = () => {
    if (!selectedCategory) return null;

    const categoryEntries = entries.filter(e => e.category === selectedCategory);
    
    // Total do mês atual
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTotal = categoryEntries
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + Number(e.value), 0);

    // Calcular média semanal
    const weeklyTotals: { [key: string]: number } = {};
    categoryEntries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weeklyTotals[weekKey]) {
        weeklyTotals[weekKey] = 0;
      }
      weeklyTotals[weekKey] += Number(entry.value);
    });

    const weeklyValues = Object.values(weeklyTotals);
    const weeklyAverage = weeklyValues.length > 0 
      ? weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length 
      : 0;

    // Maior gasto semanal
    const maxWeekly = Math.max(...weeklyValues, 0);

    // Número de transações
    const transactionCount = categoryEntries.length;

    // Evolução mensal (últimos 3 meses)
    const monthlyData: { [key: string]: number } = {};
    categoryEntries.forEach(entry => {
      const monthKey = entry.date.slice(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += Number(entry.value);
    });

    const evolutionData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => {
        const date = new Date(month + "-01");
        return {
          month: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          value
        };
      });

    return {
      monthlyTotal,
      weeklyAverage,
      maxWeekly,
      transactionCount,
      evolutionData
    };
  };

  const categorySummary = getAllCategoriesSummary();
  const data = getCategoryData();
  const totalExpenses = categorySummary.reduce((sum, cat) => sum + cat.value, 0);

  if (loading) {
    return <div className="text-center py-10">Carregando relatórios...</div>;
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-muted-foreground">
            Nenhuma categoria encontrada. Comece a registrar suas transações!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-blue">Relatório por Categoria</h2>
        <p className="text-muted-foreground">Visão geral e análise detalhada por categoria</p>
      </div>

      {/* Seção 1: Visão Geral de Todas as Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Visão Geral por Categoria
          </CardTitle>
          <CardDescription>
            Resumo de todas as categorias dos últimos 3 meses | Total: {formatCurrency(totalExpenses)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de pizza */}
            <div>
              {categorySummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySummary}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {categorySummary.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => {
                        const cat = categorySummary.find(c => c.name === value);
                        const percent = cat ? cat.percentage.toFixed(0) : 0;
                        return `${value} (${percent}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">Nenhuma despesa registrada</p>
              )}
            </div>

            {/* Lista ordenada das categorias */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categorySummary.map((cat, idx) => (
                <div
                  key={cat.name}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{formatCurrency(cat.value)}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Análise Detalhada de Categoria Selecionada */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-brand-blue">Análise Detalhada</CardTitle>
              <CardDescription>Métricas e evolução da categoria selecionada</CardDescription>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {data && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total no Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-700">{formatCurrency(data.monthlyTotal)}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Média Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-purple-700">{formatCurrency(data.weeklyAverage)}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-rose-700 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Pico Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-rose-700">{formatCurrency(data.maxWeekly)}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Transações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-emerald-700">{data.transactionCount}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-brand-blue">Evolução nos Últimos 3 Meses</CardTitle>
                  <CardDescription>Histórico de gastos mensais em {selectedCategory}</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.evolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={data.evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ef137c" 
                          strokeWidth={2}
                          dot={{ fill: "#ef137c", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-10">
                      Dados insuficientes para gerar o gráfico
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
