import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Target } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

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

    setNewGoal({
      goal_name: "",
      target_value: 0,
      current_value: 0,
      deadline: "",
    });

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
        title: "🎉 Parabéns!",
        description: "Você alcançou sua meta!",
      });
    }

    await loadGoals();
  };

  return (
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
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
                                placeholder="Adicionar valor"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const input = e.target as HTMLInputElement;
                                    const newValue =
                                      Number(goal.current_value) + parseFloat(input.value);
                                    handleUpdateProgress(goal.id, newValue);
                                    input.value = "";
                                  }
                                }}
                              />
                            </div>
                          )}

                          {isCompleted && (
                            <div className="text-center py-2 bg-green-50 rounded text-green-700 font-semibold">
                              ✓ Meta Concluída!
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
  );
}