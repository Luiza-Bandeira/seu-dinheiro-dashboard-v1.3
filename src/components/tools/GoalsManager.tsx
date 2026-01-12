import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Target, Pencil, TrendingUp, CheckCircle2, Calendar } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

interface GoalsManagerProps {
  userId: string;
}

interface Goal {
  id: string;
  goal_name: string;
  target_value: number;
  current_value: number;
  deadline: string;
  status: string;
}

export function GoalsManager({ userId }: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    goal_name: "",
    target_value: 0,
    current_value: 0,
    deadline: "",
  });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const { unlockAchievement, awardPoints } = useGamification(userId);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar metas:", error);
      return;
    }

    setGoals(data || []);
  };

  const handleAddGoal = async () => {
    if (loading) return;

    if (!newGoal.goal_name || newGoal.target_value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      goal_name: newGoal.goal_name,
      target_value: newGoal.target_value,
      current_value: newGoal.current_value,
      deadline: newGoal.deadline || null,
    });

    if (error) {
      toast({
        title: "Erro ao adicionar meta",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Meta criada!",
      description: "Sua meta financeira foi registrada com sucesso.",
    });

    // Gamification
    await unlockAchievement("first_goal");
    await awardPoints("first_transaction", "Criou objetivo financeiro");
    await checkFullControl();

    setNewGoal({
      goal_name: "",
      target_value: 0,
      current_value: 0,
      deadline: "",
    });

    await loadGoals();
    setLoading(false);
  };

  const checkFullControl = async () => {
    const { count: goalsCount } = await supabase
      .from("goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: financeCount } = await supabase
      .from("finances")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: reductionCount } = await supabase
      .from("reduction_goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((goalsCount || 0) > 0 && (financeCount || 0) > 0 && (reductionCount || 0) > 0) {
      await unlockAchievement("full_control");
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || loading) return;

    setLoading(true);

    const status = editingGoal.current_value >= editingGoal.target_value ? "completed" : "in_progress";

    const { error } = await supabase
      .from("goals")
      .update({
        goal_name: editingGoal.goal_name,
        target_value: editingGoal.target_value,
        current_value: editingGoal.current_value,
        deadline: editingGoal.deadline || null,
        status,
      })
      .eq("id", editingGoal.id);

    if (error) {
      toast({
        title: "Erro ao atualizar meta",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Meta atualizada!",
      description: "Sua meta financeira foi atualizada com sucesso.",
    });

    setEditingGoal(null);
    await loadGoals();
    setLoading(false);
  };

  const handleDeleteGoal = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar meta",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Meta deletada!",
      description: "Sua meta foi removida.",
    });

    await loadGoals();
  };

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const status = newValue >= goal.target_value ? "completed" : "in_progress";

    const { error } = await supabase
      .from("goals")
      .update({ current_value: newValue, status })
      .eq("id", goalId);

    if (error) {
      toast({
        title: "Erro ao atualizar progresso",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (status === "completed") {
      toast({
        title: "Parabéns!",
        description: "Você alcançou sua meta!",
      });
    }

    await loadGoals();
  };

  // Calculate summary stats
  const inProgressGoals = goals.filter(g => g.status !== "completed");
  const completedGoals = goals.filter(g => g.status === "completed");
  const totalTargetValue = goals.reduce((sum, g) => sum + Number(g.target_value), 0);
  const totalCurrentValue = goals.reduce((sum, g) => sum + Number(g.current_value), 0);
  const overallProgress = totalTargetValue > 0 ? (totalCurrentValue / totalTargetValue) * 100 : 0;
  const nextDeadline = inProgressGoals
    .filter(g => g.deadline)
    .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))[0];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 shadow-lg bg-gradient-to-r from-primary/5 to-brand-magenta/5">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-brand-blue" />
                <span className="text-xl font-bold text-brand-blue">{inProgressGoals.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Metas Ativas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xl font-bold text-green-600">{completedGoals.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                R$ {totalTargetValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-brand-magenta" />
                <span className="text-xl font-bold text-brand-magenta">{overallProgress.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Progresso Geral</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  {nextDeadline?.deadline 
                    ? new Date(nextDeadline.deadline).toLocaleDateString("pt-BR") 
                    : "-"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Próx. Prazo</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Button onClick={handleUpdateGoal} disabled={loading}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Criar Nova Meta</CardTitle>
          <CardDescription>Defina seus objetivos financeiros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Meta</Label>
            <Input
              placeholder="Ex: Viagem, Reserva de Emergência"
              value={newGoal.goal_name}
              onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Alvo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={newGoal.target_value || ""}
              onChange={(e) =>
                setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Atual (R$)</Label>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={newGoal.current_value || ""}
              onChange={(e) =>
                setNewGoal({ ...newGoal, current_value: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
          </div>

          <Button onClick={handleAddGoal} disabled={loading} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Criar Meta
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Minhas Metas</CardTitle>
            <CardDescription>Acompanhe o progresso dos seus objetivos</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma meta criada ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = (Number(goal.current_value) / Number(goal.target_value)) * 100;
                  const isCompleted = goal.status === "completed";

                  return (
                    <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-brand-blue">{goal.goal_name}</h4>
                              {goal.deadline && (
                                <p className="text-xs text-muted-foreground">
                                  Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingGoal(goal)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-semibold">
                                R$ {Number(goal.current_value).toFixed(2)} / R${" "}
                                {Number(goal.target_value).toFixed(2)}
                              </span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                          </div>

                          {!isCompleted && (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                placeholder="Adicionar valor"
                                id={`add-value-${goal.id}`}
                                className="flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const input = e.target as HTMLInputElement;
                                    const addValue = parseFloat(input.value);
                                    if (!isNaN(addValue) && addValue > 0) {
                                      const newValue = Number(goal.current_value) + addValue;
                                      handleUpdateProgress(goal.id, newValue);
                                      input.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => {
                                  const input = document.getElementById(`add-value-${goal.id}`) as HTMLInputElement;
                                  const addValue = parseFloat(input.value);
                                  if (!isNaN(addValue) && addValue > 0) {
                                    const newValue = Number(goal.current_value) + addValue;
                                    handleUpdateProgress(goal.id, newValue);
                                    input.value = "";
                                  } else {
                                    toast({
                                      title: "Valor inválido",
                                      description: "Digite um valor maior que zero",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {isCompleted && (
                            <div className="text-center py-2 bg-green-50 rounded text-green-700 font-semibold">
                              Meta Concluída!
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
      </div>
    </div>
  );
}
