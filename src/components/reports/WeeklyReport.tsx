import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";

interface WeeklyReportProps {
  userId: string;
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

export function WeeklyReport({ userId }: WeeklyReportProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyTracking[]>([]);
  const [reductionGoals, setReductionGoals] = useState<ReductionGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);

    // Carregar metas de redução
    const { data: goals } = await supabase
      .from("reduction_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (goals) {
      setReductionGoals(goals);
    }

    // Carregar registros semanais
    const { data: tracking } = await supabase
      .from("weekly_tracking")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(8);

    if (tracking) {
      setWeeklyData(tracking);
    }

    setLoading(false);
  };

  const getWeekLabel = (start: string, end: string) => {
    const startDate = new Date(start + "T12:00:00"); // Avoid timezone issues
    const endDate = new Date(end + "T12:00:00");
    return `${startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
  };

  // Helper to get week boundaries starting on Sunday
  const getWeekBoundaries = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return {
      start: sunday.toISOString().slice(0, 10),
      end: saturday.toISOString().slice(0, 10),
    };
  };

  const analyzeWeek = (tracking: WeeklyTracking) => {
    const goal = reductionGoals.find(g => g.category === tracking.category);
    if (!goal) return { status: "sem_meta", percentage: 0, limit: 0 };

    const weeklyLimit = goal.period_type === "semanal" 
      ? goal.target_value 
      : goal.target_value / 4;

    const percentage = (tracking.total_spent / weeklyLimit) * 100;
    const status = percentage <= 100 ? "dentro" : "fora";

    return { status, percentage, limit: weeklyLimit };
  };

  const compareWeeks = (current: WeeklyTracking, previous: WeeklyTracking | undefined) => {
    if (!previous) return null;
    
    const variation = ((current.total_spent - previous.total_spent) / previous.total_spent) * 100;
    return variation;
  };

  const groupedByWeek = weeklyData.reduce((acc, item) => {
    const weekKey = `${item.week_start}_${item.week_end}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(item);
    return acc;
  }, {} as { [key: string]: WeeklyTracking[] });

  if (loading) {
    return <div className="text-center py-10">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-blue">Relatório Semanal</h2>
        <p className="text-muted-foreground">Acompanhamento semanal e comparação com metas</p>
      </div>

      {Object.entries(groupedByWeek).map(([weekKey, items], weekIdx) => {
        const [start, end] = weekKey.split("_");
        const previousWeekData = Object.values(groupedByWeek)[weekIdx + 1];
        
        const weekTotal = items.reduce((sum, item) => sum + Number(item.total_spent), 0);
        
        return (
          <Card key={weekKey}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-brand-blue">{getWeekLabel(start, end)}</CardTitle>
                  <CardDescription>Total gasto: R$ {weekTotal.toFixed(2)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((tracking) => {
                const analysis = analyzeWeek(tracking);
                const previousItem = previousWeekData?.find(p => p.category === tracking.category);
                const variation = compareWeeks(tracking, previousItem);

                return (
                  <div key={tracking.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{tracking.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          Gasto: R$ {Number(tracking.total_spent).toFixed(2)}
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
                        <Badge variant="outline">Sem meta</Badge>
                      )}
                    </div>

                    {analysis.status !== "sem_meta" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Limite semanal: R$ {analysis.limit.toFixed(2)}</span>
                          <span className={analysis.percentage > 100 ? "text-red-600 font-semibold" : "text-green-600"}>
                            {analysis.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(analysis.percentage, 100)} className="h-2" />
                      </div>
                    )}

                    {variation !== null && (
                      <div className={`flex items-center gap-2 text-sm ${variation > 10 ? "text-red-600 font-semibold" : variation < -10 ? "text-green-600" : "text-muted-foreground"}`}>
                        {variation > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {variation > 0 ? "+" : ""}{variation.toFixed(1)}% vs semana anterior
                        {Math.abs(variation) > 10 && (
                          <span className="ml-2">
                            {variation > 10 ? "⚠️ Aumento significativo!" : "✅ Redução significativa!"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {weeklyData.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">
              Nenhum registro semanal encontrado. Comece a registrar seus gastos semanais!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
