import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Calendar, Hash } from "lucide-react";

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

  const data = getCategoryData();

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">Relatório por Categoria</h2>
          <p className="text-muted-foreground">Análise detalhada de uma categoria específica</p>
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

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total no Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-blue">R$ {data.monthlyTotal.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Média Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">R$ {data.weeklyAverage.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pico Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">R$ {data.maxWeekly.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.transactionCount}</div>
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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
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

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-blue">Comparação com Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta funcionalidade exibe a comparação com metas de redução quando disponível.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
