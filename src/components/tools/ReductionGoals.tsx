import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Target, Pencil } from "lucide-react";

interface ReductionGoalsProps {
  userId: string;
}

interface ReductionGoal {
  id: string;
  category: string;
  period_type: string;
  target_value: number;
  deadline: string;
  status: string;
}

export function ReductionGoals({ userId }: ReductionGoalsProps) {
  const [goals, setGoals] = useState<ReductionGoal[]>([]);
  const [newGoal, setNewGoal] = useState({
    category: "",
    period_type: "mensal",
    target_value: 0,
    deadline: "",
  });
  const [editingGoal, setEditingGoal] = useState<ReductionGoal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from("reduction_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar metas de redução:", error);
      return;
    }

    setGoals(data || []);
  };

  const handleAddGoal = async () => {
    if (loading) return;

    if (!newGoal.category || newGoal.target_value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha a categoria e o valor alvo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reduction_goals").insert({
      user_id: userId,
      category: newGoal.category,
      period_type: newGoal.period_type,
      target_value: newGoal.target_value,
      deadline: newGoal.deadline || null,
    });

    if (error) {
      toast({
        title: "Erro ao criar meta",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Meta criada!",
      description: "Sua meta de redução foi registrada.",
    });

    setNewGoal({
      category: "",
      period_type: "mensal",
      target_value: 0,
      deadline: "",
    });

    await loadGoals();
    setLoading(false);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || loading) return;

    setLoading(true);

    const { error } = await supabase
      .from("reduction_goals")
      .update({
        category: editingGoal.category,
        period_type: editingGoal.period_type,
        target_value: editingGoal.target_value,
        deadline: editingGoal.deadline || null,
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
      description: "Sua meta de redução foi atualizada com sucesso.",
    });

    setEditingGoal(null);
    await loadGoals();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reduction_goals").delete().eq("id", id);

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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "completed" : "active";

    const { error } = await supabase
      .from("reduction_goals")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (newStatus === "completed") {
      toast({
        title: "Parabéns!",
        description: "Meta de redução concluída!",
      });
    }

    await loadGoals();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Meta de Redução
            </DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={editingGoal.category}
                  onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select
                  value={editingGoal.period_type}
                  onValueChange={(value) => setEditingGoal({ ...editingGoal, period_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editingGoal.target_value || ""}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target_value: parseFloat(e.target.value) || 0 })}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Criar Meta de Redução</CardTitle>
          <CardDescription>Defina limites de gastos por categoria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input
              placeholder="Ex: Ifood, Restaurantes, Delivery"
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <Select
              value={newGoal.period_type}
              onValueChange={(value) => setNewGoal({ ...newGoal, period_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Valor Máximo (R$)</Label>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Minhas Metas de Redução</CardTitle>
          <CardDescription>Acompanhe seus limites de gastos</CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma meta de redução criada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <Card key={goal.id} className={goal.status === "completed" ? "border-green-500" : "border-border"}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-brand-blue">{goal.category}</h4>
                          <Badge variant={goal.period_type === "mensal" ? "default" : "secondary"}>
                            {goal.period_type === "mensal" ? "Mensal" : "Semanal"}
                          </Badge>
                          {goal.status === "completed" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Concluída
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Valor máximo: <span className="font-semibold text-foreground">R$ {Number(goal.target_value).toFixed(2)}</span>
                        </p>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        {goal.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(goal.id, goal.status)}
                            className="mt-2"
                          >
                            Marcar como Concluída
                          </Button>
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
                          onClick={() => handleDelete(goal.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
