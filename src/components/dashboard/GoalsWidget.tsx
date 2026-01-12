import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Target, Plus, Pencil, ArrowRight, TrendingUp, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface GoalsWidgetProps {
  userId: string;
}

interface Goal {
  id: string;
  goal_name: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: string;
}

interface GoalsSummary {
  totalGoals: number;
  completedGoals: number;
  totalTargetValue: number;
  totalCurrentValue: number;
  averageProgress: number;
}

export function GoalsWidget({ userId }: GoalsWidgetProps) {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalsSummary>({
    totalGoals: 0,
    completedGoals: 0,
    totalTargetValue: 0,
    totalCurrentValue: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addValueGoalId, setAddValueGoalId] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");

  useEffect(() => {
    loadGoals();

    // Realtime subscription
    const channel = supabase
      .channel("goals-widget")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals", filter: `user_id=eq.${userId}` },
        () => loadGoals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error("Erro ao carregar metas:", error);
      setLoading(false);
      return;
    }

    const goalsData = data || [];
    setGoals(goalsData);

    // Calculate summary
    const { data: allGoals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId);

    if (allGoals) {
      const completed = allGoals.filter((g) => g.status === "completed").length;
      const totalTarget = allGoals.reduce((acc, g) => acc + Number(g.target_value), 0);
      const totalCurrent = allGoals.reduce((acc, g) => acc + Number(g.current_value), 0);
      const avgProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

      setSummary({
        totalGoals: allGoals.length,
        completedGoals: completed,
        totalTargetValue: totalTarget,
        totalCurrentValue: totalCurrent,
        averageProgress: avgProgress,
      });
    }

    setLoading(false);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    const status = editingGoal.current_value >= editingGoal.target_value ? "completed" : "in_progress";

    const { error } = await supabase
      .from("goals")
      .update({
        goal_name: editingGoal.goal_name,
        target_value: editingGoal.target_value,
        current_value: editingGoal.current_value,
        deadline: editingGoal.deadline,
        status,
      })
      .eq("id", editingGoal.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Meta atualizada!", description: "Alterações salvas com sucesso." });
    setEditingGoal(null);
    loadGoals();
  };

  const handleAddValue = async (goalId: string) => {
    const value = parseFloat(addValue);
    if (isNaN(value) || value <= 0) {
      toast({ title: "Valor inválido", description: "Digite um valor maior que zero", variant: "destructive" });
      return;
    }

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newValue = Number(goal.current_value) + value;
    const status = newValue >= goal.target_value ? "completed" : "in_progress";

    const { error } = await supabase
      .from("goals")
      .update({ current_value: newValue, status })
      .eq("id", goalId);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    if (status === "completed") {
      toast({ title: "Parabéns!", description: "Você alcançou sua meta!" });
    } else {
      toast({ title: "Valor adicionado!", description: `R$ ${value.toFixed(2)} adicionado à meta.` });
    }

    setAddValueGoalId(null);
    setAddValue("");
    loadGoals();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Meta
            </DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Meta</Label>
                <Input
                  value={editingGoal.goal_name}
                  onChange={(e) => setEditingGoal({ ...editingGoal, goal_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Alvo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingGoal.target_value || ""}
                    onChange={(e) => setEditingGoal({ ...editingGoal, target_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Atual (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingGoal.current_value || ""}
                    onChange={(e) => setEditingGoal({ ...editingGoal, current_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={editingGoal.deadline || ""}
                  onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGoal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateGoal}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Value Dialog */}
      <Dialog open={!!addValueGoalId} onOpenChange={(open) => !open && setAddValueGoalId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Valor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor a adicionar (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0,00"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddValueGoalId(null)}>
              Cancelar
            </Button>
            <Button onClick={() => addValueGoalId && handleAddValue(addValueGoalId)}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-blue flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Financeiras
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/tools")}>
              Ver Todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-brand-blue">{summary.totalGoals}</p>
              <p className="text-xs text-muted-foreground">Metas Ativas</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.completedGoals}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-primary">{formatCurrency(summary.totalCurrentValue)}</p>
              <p className="text-xs text-muted-foreground">Acumulado</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-brand-magenta" />
                <p className="text-lg font-bold text-brand-magenta">{summary.averageProgress.toFixed(0)}%</p>
              </div>
              <p className="text-xs text-muted-foreground">Progresso</p>
            </div>
          </div>

          {/* Goals List */}
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma meta criada ainda</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/tools")}>
                Criar Meta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const progress = Math.min((Number(goal.current_value) / Number(goal.target_value)) * 100, 100);
                const isCompleted = goal.status === "completed";

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${isCompleted ? "border-green-200 bg-green-50/50" : "border-border bg-card"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{goal.goal_name}</h4>
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!isCompleted && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setAddValueGoalId(goal.id);
                              setAddValue("");
                            }}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingGoal(goal)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(Number(goal.current_value))} / {formatCurrency(Number(goal.target_value))}
                        </span>
                        <span className="font-medium text-brand-blue">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
