import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar, TrendingDown, TrendingUp } from "lucide-react";

interface WeeklyTrackingProps {
  userId: string;
}

interface WeeklyEntry {
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
  period_type: string;
  target_value: number;
}

export function WeeklyTracking({ userId }: WeeklyTrackingProps) {
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [reductionGoals, setReductionGoals] = useState<ReductionGoal[]>([]);
  const [newEntry, setNewEntry] = useState({
    category: "",
    week_start: "",
    week_end: "",
    total_spent: 0,
    reduction_goal_id: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEntries();
    loadReductionGoals();
  }, [userId]);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("weekly_tracking")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false });

    if (error) {
      console.error("Erro ao carregar acompanhamentos:", error);
      return;
    }

    setEntries(data || []);
  };

  const loadReductionGoals = async () => {
    const { data, error } = await supabase
      .from("reduction_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar metas:", error);
      return;
    }

    setReductionGoals(data || []);
  };

  const handleAddEntry = async () => {
    if (!newEntry.category || !newEntry.week_start || !newEntry.week_end || newEntry.total_spent <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("weekly_tracking").insert({
      user_id: userId,
      category: newEntry.category,
      week_start: newEntry.week_start,
      week_end: newEntry.week_end,
      total_spent: newEntry.total_spent,
      reduction_goal_id: newEntry.reduction_goal_id || null,
    });

    if (error) {
      toast({
        title: "Erro ao registrar acompanhamento",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Acompanhamento registrado!",
      description: "Seus gastos semanais foram salvos.",
    });

    setNewEntry({
      category: "",
      week_start: "",
      week_end: "",
      total_spent: 0,
      reduction_goal_id: "",
    });

    await loadEntries();
    setLoading(false);
  };

  const getGoalComparison = (entry: WeeklyEntry) => {
    if (!entry.reduction_goal_id) return null;

    const goal = reductionGoals.find((g) => g.id === entry.reduction_goal_id);
    if (!goal) return null;

    const targetValue = goal.period_type === "semanal" ? goal.target_value : goal.target_value / 4;
    const percentage = (Number(entry.total_spent) / targetValue) * 100;
    const withinBudget = Number(entry.total_spent) <= targetValue;

    return { goal, targetValue, percentage, withinBudget };
  };

  // Auto-fill dates for current week
  const fillCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setNewEntry({
      ...newEntry,
      week_start: monday.toISOString().split("T")[0],
      week_end: sunday.toISOString().split("T")[0],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Registrar Semana</CardTitle>
          <CardDescription>Registre seus gastos semanais por categoria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input
              placeholder="Ex: Ifood, Restaurantes, Delivery"
              value={newEntry.category}
              onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início da Semana</Label>
              <Input
                type="date"
                value={newEntry.week_start}
                onChange={(e) => setNewEntry({ ...newEntry, week_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim da Semana</Label>
              <Input
                type="date"
                value={newEntry.week_end}
                onChange={(e) => setNewEntry({ ...newEntry, week_end: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillCurrentWeek}
            className="w-full"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Preencher Semana Atual
          </Button>

          <div className="space-y-2">
            <Label>Total Gasto na Semana (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newEntry.total_spent || ""}
              onChange={(e) =>
                setNewEntry({ ...newEntry, total_spent: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Vincular a Meta (opcional)</Label>
            <Select
              value={newEntry.reduction_goal_id || "none"}
              onValueChange={(value) => setNewEntry({ ...newEntry, reduction_goal_id: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma meta</SelectItem>
                {reductionGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.category} ({goal.period_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAddEntry} disabled={loading} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Registrar Acompanhamento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Histórico Semanal</CardTitle>
          <CardDescription>Acompanhe seus gastos por semana</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum acompanhamento registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {entries.map((entry) => {
                const comparison = getGoalComparison(entry);

                return (
                  <Card key={entry.id} className="border-border">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-brand-blue">{entry.category}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.week_start).toLocaleDateString("pt-BR")} -{" "}
                              {new Date(entry.week_end).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            R$ {Number(entry.total_spent).toFixed(2)}
                          </p>
                        </div>

                        {comparison && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Meta da semana</span>
                              <span className="font-semibold">
                                R$ {comparison.targetValue.toFixed(2)}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(comparison.percentage, 100)}
                              className="h-2"
                            />
                            <div className="flex items-center gap-2">
                              {comparison.withinBudget ? (
                                <>
                                  <TrendingDown className="h-4 w-4 text-green-600" />
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    Dentro do planejado
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="h-4 w-4 text-red-600" />
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                    Acima do planejado
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}