import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, TrendingUp } from "lucide-react";

interface CurrentInvestmentsProps {
  userId: string;
}

interface Investment {
  id: string;
  name: string;
  current_value: number;
  estimated_rate: number;
}

export function CurrentInvestments({ userId }: CurrentInvestmentsProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [newInvestment, setNewInvestment] = useState({
    name: "",
    current_value: 0,
    estimated_rate: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvestments();
  }, [userId]);

  const loadInvestments = async () => {
    const { data, error } = await supabase
      .from("investments_current")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar investimentos:", error);
      return;
    }

    setInvestments(data || []);
  };

  const handleAddInvestment = async () => {
    if (!newInvestment.name || newInvestment.current_value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha o nome e o valor atual do investimento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("investments_current").insert({
      user_id: userId,
      name: newInvestment.name,
      current_value: newInvestment.current_value,
      estimated_rate: newInvestment.estimated_rate,
    });

    if (error) {
      toast({
        title: "Erro ao adicionar investimento",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Investimento adicionado!",
      description: "Seu investimento foi registrado com sucesso.",
    });

    setNewInvestment({
      name: "",
      current_value: 0,
      estimated_rate: 0,
    });

    await loadInvestments();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("investments_current").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar investimento",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Investimento deletado!",
      description: "Seu investimento foi removido.",
    });

    await loadInvestments();
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const avgRate = investments.length > 0
    ? investments.reduce((sum, inv) => sum + Number(inv.estimated_rate), 0) / investments.length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Adicionar Investimento</CardTitle>
          <CardDescription>Registre seus investimentos atuais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Investimento</Label>
            <Input
              placeholder="Ex: Tesouro Direto, CDB, Ações"
              value={newInvestment.name}
              onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Atual (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newInvestment.current_value || ""}
              onChange={(e) =>
                setNewInvestment({ ...newInvestment, current_value: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Rentabilidade Estimada (% ao ano)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newInvestment.estimated_rate || ""}
              onChange={(e) =>
                setNewInvestment({ ...newInvestment, estimated_rate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <Button onClick={handleAddInvestment} disabled={loading} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Investimento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Meus Investimentos Atuais</CardTitle>
          <CardDescription>Visão geral do seu portfólio</CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum investimento registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Total Investido</p>
                  <p className="text-xl font-bold text-brand-blue">
                    R$ {totalInvested.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Rentabilidade Média</p>
                  <p className="text-xl font-bold text-primary">
                    {avgRate.toFixed(2)}% a.a.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {investments.map((investment) => (
                  <Card key={investment.id} className="border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-brand-blue">{investment.name}</h4>
                          <div className="flex gap-4 mt-1 text-sm">
                            <p className="text-muted-foreground">
                              Valor: <span className="font-semibold">R$ {Number(investment.current_value).toFixed(2)}</span>
                            </p>
                            <p className="text-muted-foreground">
                              Taxa: <span className="font-semibold">{Number(investment.estimated_rate).toFixed(2)}% a.a.</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(investment.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}