import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, CalendarDays, Target } from "lucide-react";
import { formatCurrency } from "@/utils/exportUtils";
import { toast } from "@/components/ui/use-toast";
import { MonthYearPicker } from "@/components/ui/month-year-picker";

interface WeeklyReportProps {
  userId: string;
}

interface FinanceEntry {
  id: string;
  category: string;
  value: number;
  date: string;
  type: string;
}

interface WeeklyTracking {
  id: string;
  category: string;
  week_start: string;
  week_end: string;
  total_spent: number;
  reduction_goal_id: string | null;
}

interface ReductionGoal {
  id: string;
  category: string;
  target_value: number;
  period_type: string;
}

interface WeeklyAggregate {
  weekStart: string;
  weekEnd: string;
  categories: { [category: string]: { receitas: number; despesas: number } };
  total: number;
}

export function WeeklyReport({ userId }: WeeklyReportProps) {
  const [weeklyAggregates, setWeeklyAggregates] = useState<WeeklyAggregate[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyTracking[]>([]);
  const [reductionGoals, setReductionGoals] = useState<ReductionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  
  // Goal dialog state
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [periodType, setPeriodType] = useState("semanal");

  useEffect(() => {
    loadData();
  }, [userId, selectedMonth]);

  const loadData = async () => {
    setLoading(true);

    // Load reduction goals
    const { data: goals } = await supabase
      .from("reduction_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (goals) {
      setReductionGoals(goals);
    }

    // Load manual weekly tracking
    const { data: tracking } = await supabase
      .from("weekly_tracking")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(8);

    if (tracking) {
      setWeeklyData(tracking);
    }

    // Calculate date range for selected month
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    
    // Extend range to include full weeks that overlap with the month
    const startOfFirstWeek = new Date(firstDayOfMonth);
    startOfFirstWeek.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    
    const endOfLastWeek = new Date(lastDayOfMonth);
    endOfLastWeek.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
    
    const { data: finances } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startOfFirstWeek.toISOString().slice(0, 10))
      .lte("date", endOfLastWeek.toISOString().slice(0, 10))
      .order("date", { ascending: false });

    if (finances) {
      const aggregates = aggregateByWeek(finances, year, month);
      setWeeklyAggregates(aggregates);
    }

    setLoading(false);
  };

  // Aggregate finances by week (Sunday to Saturday) - filtered by selected month
  const aggregateByWeek = (finances: FinanceEntry[], year: number, month: number): WeeklyAggregate[] => {
    const weekMap: { [key: string]: WeeklyAggregate } = {};

    finances.forEach((entry) => {
      const entryDate = new Date(entry.date + "T12:00:00");
      const dayOfWeek = entryDate.getDay(); // 0 = Sunday
      
      // Find Sunday of this week
      const sunday = new Date(entryDate);
      sunday.setDate(entryDate.getDate() - dayOfWeek);
      
      // Saturday is 6 days after Sunday
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const weekKey = sunday.toISOString().slice(0, 10);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekStart: weekKey,
          weekEnd: saturday.toISOString().slice(0, 10),
          categories: {},
          total: 0,
        };
      }

      if (!weekMap[weekKey].categories[entry.category]) {
        weekMap[weekKey].categories[entry.category] = { receitas: 0, despesas: 0 };
      }

      if (entry.type === "income" || entry.type === "receivable") {
        weekMap[weekKey].categories[entry.category].receitas += Number(entry.value);
      } else {
        weekMap[weekKey].categories[entry.category].despesas += Number(entry.value);
        weekMap[weekKey].total += Number(entry.value);
      }
    });

    // Filter weeks that have at least one day in the selected month
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    return Object.values(weekMap)
      .filter((week) => {
        const weekStart = new Date(week.weekStart + "T12:00:00");
        const weekEnd = new Date(week.weekEnd + "T12:00:00");
        // Week overlaps with month if weekEnd >= firstDay AND weekStart <= lastDay
        return weekEnd >= firstDayOfMonth && weekStart <= lastDayOfMonth;
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  };

  const getWeekLabel = (start: string, end: string) => {
    const startDate = new Date(start + "T12:00:00");
    const endDate = new Date(end + "T12:00:00");
    return `${startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  };

  const getGoalForCategory = (category: string) => {
    return reductionGoals.find((g) => g.category === category);
  };

  const analyzeAgainstGoal = (spent: number, category: string) => {
    const goal = getGoalForCategory(category);
    if (!goal) return { status: "sem_meta", percentage: 0, limit: 0 };

    const weeklyLimit = goal.period_type === "semanal" ? goal.target_value : goal.target_value / 4;
    const percentage = (spent / weeklyLimit) * 100;
    const status = percentage <= 100 ? "dentro" : "fora";

    return { status, percentage, limit: weeklyLimit };
  };

  // Compare with previous week
  const getVariation = (currentWeekIndex: number, category: string, currentSpent: number) => {
    const previousWeek = weeklyAggregates[currentWeekIndex + 1];
    if (!previousWeek || !previousWeek.categories[category]) return null;

    const previousSpent = previousWeek.categories[category].despesas;
    if (previousSpent === 0) return null;

    return ((currentSpent - previousSpent) / previousSpent) * 100;
  };

  const handleAddGoal = (category: string) => {
    setSelectedCategory(category);
    setTargetValue("");
    setPeriodType("semanal");
    setIsGoalDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!targetValue || Number(targetValue) <= 0) {
      toast({ title: "Erro", description: "Informe um valor válido", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("reduction_goals").insert({
      user_id: userId,
      category: selectedCategory,
      target_value: Number(targetValue),
      period_type: periodType,
      status: "active",
    });

    if (error) {
      toast({ title: "Erro", description: "Erro ao criar meta", variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: `Meta criada para ${selectedCategory}!` });
    setIsGoalDialogOpen(false);
    loadData();
  };

  if (loading) {
    return <div className="text-center py-10">Carregando relatórios...</div>;
  }

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">Relatório Semanal</h2>
          <p className="text-muted-foreground">
            Gastos de {getMonthName(selectedMonth)} (Domingo a Sábado)
          </p>
        </div>
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Dialog para adicionar meta */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Meta de Redução</DialogTitle>
            <DialogDescription>
              Defina um limite de gastos para a categoria: <strong>{selectedCategory}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="targetValue">Valor Limite (R$)</Label>
              <Input
                id="targetValue"
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex: 500"
              />
            </div>
            <div>
              <Label htmlFor="periodType">Período</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {periodType === "semanal" 
                  ? "Limite aplicado a cada semana" 
                  : "Limite mensal dividido por 4 para cálculo semanal"}
              </p>
            </div>
            <Button onClick={handleSaveGoal} className="w-full">
              Salvar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Automatic aggregation from finances */}
      {weeklyAggregates.length > 0 ? (
        weeklyAggregates.map((week, weekIdx) => {
          const categoryEntries = Object.entries(week.categories)
            .filter(([_, data]) => data.despesas > 0)
            .sort((a, b) => b[1].despesas - a[1].despesas);

          return (
            <Card key={week.weekStart}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-brand-blue flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      {getWeekLabel(week.weekStart, week.weekEnd)}
                    </CardTitle>
                    <CardDescription>
                      Total de despesas: {formatCurrency(week.total)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryEntries.length > 0 ? (
                  categoryEntries.map(([category, data]) => {
                    const analysis = analyzeAgainstGoal(data.despesas, category);
                    const variation = getVariation(weekIdx, category, data.despesas);

                    return (
                      <div key={category} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{category}</h4>
                            <p className="text-sm text-muted-foreground">
                              Gasto: {formatCurrency(data.despesas)}
                            </p>
                          </div>
                          {analysis.status === "dentro" && (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Dentro do planejado
                            </Badge>
                          )}
                          {analysis.status === "fora" && (
                            <Badge variant="destructive">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Fora do planejado
                            </Badge>
                          )}
                          {analysis.status === "sem_meta" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddGoal(category)}
                              className="gap-1"
                            >
                              <Target className="h-3 w-3" />
                              Adicionar Meta
                            </Button>
                          )}
                        </div>

                        {analysis.status !== "sem_meta" && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Limite semanal: {formatCurrency(analysis.limit)}</span>
                              <span
                                className={
                                  analysis.percentage > 100
                                    ? "text-red-600 font-semibold"
                                    : "text-green-600"
                                }
                              >
                                {analysis.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={Math.min(analysis.percentage, 100)} className="h-2" />
                          </div>
                        )}

                        {variation !== null && (
                          <div
                            className={`flex items-center gap-2 text-sm ${
                              variation > 10
                                ? "text-red-600 font-semibold"
                                : variation < -10
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {variation > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {variation > 0 ? "+" : ""}
                            {variation.toFixed(1)}% vs semana anterior
                            {Math.abs(variation) > 10 && (
                              <span className="ml-2">
                                {variation > 10 ? "⚠️ Aumento significativo!" : "✅ Redução significativa!"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma despesa registrada nesta semana
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">
              Nenhum registro encontrado. Comece a registrar seus gastos!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
