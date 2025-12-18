import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, TrendingUp, ArrowDownCircle, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CurrentInvestmentsProps {
  userId: string;
}

interface Investment {
  id: string;
  name: string;
  current_value: number;
  estimated_rate: number;
}

interface Withdrawal {
  id: string;
  investment_name: string;
  amount: number;
  withdrawn_at: string;
  notes: string | null;
}

export function CurrentInvestments({ userId }: CurrentInvestmentsProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [newInvestment, setNewInvestment] = useState({
    name: "",
    current_value: 0,
    estimated_rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawNotes, setWithdrawNotes] = useState("");

  useEffect(() => {
    loadInvestments();
    loadWithdrawals();
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

  const loadWithdrawals = async () => {
    const { data, error } = await supabase
      .from("investment_withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("withdrawn_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar resgates:", error);
      return;
    }

    setWithdrawals(data || []);
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

  const openWithdrawDialog = (investment: Investment) => {
    setSelectedInvestment(investment);
    setWithdrawAmount(0);
    setWithdrawNotes("");
    setWithdrawDialogOpen(true);
  };

  const handleWithdraw = async () => {
    if (!selectedInvestment) return;

    if (withdrawAmount <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido para o resgate",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > selectedInvestment.current_value) {
      toast({
        title: "Erro",
        description: "O valor do resgate não pode ser maior que o valor investido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Registrar o resgate no histórico
    const { error: withdrawalError } = await supabase.from("investment_withdrawals").insert({
      user_id: userId,
      investment_name: selectedInvestment.name,
      amount: withdrawAmount,
      notes: withdrawNotes || null,
    });

    if (withdrawalError) {
      toast({
        title: "Erro ao registrar resgate",
        description: withdrawalError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const newValue = selectedInvestment.current_value - withdrawAmount;

    if (newValue <= 0) {
      // Se o resgate for total, deletar o investimento
      const { error } = await supabase
        .from("investments_current")
        .delete()
        .eq("id", selectedInvestment.id);

      if (error) {
        toast({
          title: "Erro ao processar resgate",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Resgate total realizado!",
        description: `Você resgatou R$ ${withdrawAmount.toFixed(2)} de ${selectedInvestment.name}. O investimento foi encerrado.`,
      });
    } else {
      // Resgate parcial: atualizar o valor
      const { error } = await supabase
        .from("investments_current")
        .update({ current_value: newValue })
        .eq("id", selectedInvestment.id);

      if (error) {
        toast({
          title: "Erro ao processar resgate",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Resgate realizado!",
        description: `Você resgatou R$ ${withdrawAmount.toFixed(2)} de ${selectedInvestment.name}. Novo saldo: R$ ${newValue.toFixed(2)}`,
      });
    }

    setWithdrawDialogOpen(false);
    setSelectedInvestment(null);
    setWithdrawAmount(0);
    setWithdrawNotes("");
    await loadInvestments();
    await loadWithdrawals();
    setLoading(false);
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const avgRate = investments.length > 0
    ? investments.reduce((sum, inv) => sum + Number(inv.estimated_rate), 0) / investments.length
    : 0;
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-blue">Meus Investimentos Atuais</CardTitle>
              <CardDescription>Visão geral do seu portfólio</CardDescription>
            </div>
            {withdrawals.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                Histórico
              </Button>
            )}
          </div>
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

              {totalWithdrawn > 0 && (
                <div className="text-center p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20">
                  <p className="text-sm text-muted-foreground mb-1">Total Resgatado</p>
                  <p className="text-lg font-bold text-amber-600">
                    R$ {totalWithdrawn.toFixed(2)}
                  </p>
                </div>
              )}

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
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openWithdrawDialog(investment)}
                            className="h-8 w-8"
                            title="Resgatar"
                          >
                            <ArrowDownCircle className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(investment.id)}
                            className="h-8 w-8"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Resgate */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-brand-blue">Resgatar Investimento</DialogTitle>
            <DialogDescription>
              {selectedInvestment && (
                <>
                  Informe o valor que deseja resgatar de <strong>{selectedInvestment.name}</strong>.
                  <br />
                  Saldo disponível: <strong>R$ {Number(selectedInvestment.current_value).toFixed(2)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor do Resgate (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount || ""}
                onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                placeholder="Ex: Resgate para emergência"
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
              />
            </div>

            {selectedInvestment && withdrawAmount > 0 && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                {withdrawAmount >= selectedInvestment.current_value ? (
                  <p className="text-amber-600">
                    ⚠️ Resgate total - o investimento será encerrado
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Novo saldo após resgate: <strong>R$ {(selectedInvestment.current_value - withdrawAmount).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleWithdraw} disabled={loading}>
              Confirmar Resgate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-brand-blue">Histórico de Resgates</DialogTitle>
            <DialogDescription>
              Total resgatado: <strong>R$ {totalWithdrawn.toFixed(2)}</strong>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="border-border">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-brand-blue">{withdrawal.investment_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(withdrawal.withdrawn_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {withdrawal.notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            "{withdrawal.notes}"
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-amber-600">
                        R$ {Number(withdrawal.amount).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
