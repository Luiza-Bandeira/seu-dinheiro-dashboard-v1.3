import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Receipt, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Pencil,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

interface DebtsWidgetProps {
  userId: string;
}

interface DebtPayable {
  id: string;
  creditor_name: string;
  amount: number;
  due_date: string;
  description: string;
  status: string;
}

interface DebtReceivable {
  id: string;
  debtor_name: string;
  amount: number;
  due_date: string;
  description: string;
  status: string;
}

interface DebtsSummary {
  totalPayable: number;
  totalReceivable: number;
  pendingPayableCount: number;
  pendingReceivableCount: number;
  overduePayableCount: number;
  overdueReceivableCount: number;
  netBalance: number;
}

export function DebtsWidget({ userId }: DebtsWidgetProps) {
  const navigate = useNavigate();
  const [debtsPayable, setDebtsPayable] = useState<DebtPayable[]>([]);
  const [debtsReceivable, setDebtsReceivable] = useState<DebtReceivable[]>([]);
  const [summary, setSummary] = useState<DebtsSummary>({
    totalPayable: 0,
    totalReceivable: 0,
    pendingPayableCount: 0,
    pendingReceivableCount: 0,
    overduePayableCount: 0,
    overdueReceivableCount: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingPayable, setEditingPayable] = useState<DebtPayable | null>(null);
  const [editingReceivable, setEditingReceivable] = useState<DebtReceivable | null>(null);

  useEffect(() => {
    loadDebts();

    // Realtime subscriptions
    const payableChannel = supabase
      .channel("debts-payable-widget")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "debts_payable", filter: `user_id=eq.${userId}` },
        () => loadDebts()
      )
      .subscribe();

    const receivableChannel = supabase
      .channel("debts-receivable-widget")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "debts_receivable", filter: `user_id=eq.${userId}` },
        () => loadDebts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(payableChannel);
      supabase.removeChannel(receivableChannel);
    };
  }, [userId]);

  const loadDebts = async () => {
    const [payableResult, receivableResult] = await Promise.all([
      supabase
        .from("debts_payable")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "paid")
        .order("due_date", { ascending: true })
        .limit(3),
      supabase
        .from("debts_receivable")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "received")
        .order("due_date", { ascending: true })
        .limit(3),
    ]);

    setDebtsPayable(payableResult.data || []);
    setDebtsReceivable(receivableResult.data || []);

    // Get all for summary
    const [allPayable, allReceivable] = await Promise.all([
      supabase.from("debts_payable").select("*").eq("user_id", userId),
      supabase.from("debts_receivable").select("*").eq("user_id", userId),
    ]);

    const today = new Date().toISOString().split("T")[0];

    const pendingPayable = (allPayable.data || []).filter((d) => d.status === "pending");
    const pendingReceivable = (allReceivable.data || []).filter((d) => d.status === "pending");
    const overduePayable = pendingPayable.filter((d) => d.due_date < today);
    const overdueReceivable = pendingReceivable.filter((d) => d.due_date < today);

    const totalPayable = pendingPayable.reduce((acc, d) => acc + Number(d.amount), 0);
    const totalReceivable = pendingReceivable.reduce((acc, d) => acc + Number(d.amount), 0);

    setSummary({
      totalPayable,
      totalReceivable,
      pendingPayableCount: pendingPayable.length,
      pendingReceivableCount: pendingReceivable.length,
      overduePayableCount: overduePayable.length,
      overdueReceivableCount: overdueReceivable.length,
      netBalance: totalReceivable - totalPayable,
    });

    setLoading(false);
  };

  const handleMarkAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("debts_payable")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Dívida paga!", description: "Status atualizado com sucesso." });
    loadDebts();
  };

  const handleMarkAsReceived = async (id: string) => {
    const { error } = await supabase
      .from("debts_receivable")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Valor recebido!", description: "Status atualizado com sucesso." });
    loadDebts();
  };

  const handleUpdatePayable = async () => {
    if (!editingPayable) return;

    const { error } = await supabase
      .from("debts_payable")
      .update({
        creditor_name: editingPayable.creditor_name,
        amount: editingPayable.amount,
        due_date: editingPayable.due_date,
        description: editingPayable.description,
      })
      .eq("id", editingPayable.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Dívida atualizada!", description: "Alterações salvas com sucesso." });
    setEditingPayable(null);
    loadDebts();
  };

  const handleUpdateReceivable = async () => {
    if (!editingReceivable) return;

    const { error } = await supabase
      .from("debts_receivable")
      .update({
        debtor_name: editingReceivable.debtor_name,
        amount: editingReceivable.amount,
        due_date: editingReceivable.due_date,
        description: editingReceivable.description,
      })
      .eq("id", editingReceivable.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Recebível atualizado!", description: "Alterações salvas com sucesso." });
    setEditingReceivable(null);
    loadDebts();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const isOverdue = (dueDate: string) => {
    return dueDate < new Date().toISOString().split("T")[0];
  };

  const getStatusBadge = (status: string, dueDate: string, type: "payable" | "receivable") => {
    const overdue = isOverdue(dueDate) && status === "pending";
    const isPaid = status === "paid" || status === "received";

    if (isPaid) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          {type === "payable" ? "Pago" : "Recebido"}
        </Badge>
      );
    }

    if (overdue) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Atrasado
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Dívidas e Recebíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-muted rounded-xl" />
              <div className="h-24 bg-muted rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Edit Payable Dialog */}
      <Dialog open={!!editingPayable} onOpenChange={(open) => !open && setEditingPayable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Dívida a Pagar
            </DialogTitle>
          </DialogHeader>
          {editingPayable && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Credor</Label>
                <Input
                  value={editingPayable.creditor_name}
                  onChange={(e) => setEditingPayable({ ...editingPayable, creditor_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingPayable.amount || ""}
                    onChange={(e) => setEditingPayable({ ...editingPayable, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={editingPayable.due_date}
                    onChange={(e) => setEditingPayable({ ...editingPayable, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingPayable.description || ""}
                  onChange={(e) => setEditingPayable({ ...editingPayable, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayable(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePayable}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Receivable Dialog */}
      <Dialog open={!!editingReceivable} onOpenChange={(open) => !open && setEditingReceivable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Valor a Receber
            </DialogTitle>
          </DialogHeader>
          {editingReceivable && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Devedor</Label>
                <Input
                  value={editingReceivable.debtor_name}
                  onChange={(e) => setEditingReceivable({ ...editingReceivable, debtor_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingReceivable.amount || ""}
                    onChange={(e) => setEditingReceivable({ ...editingReceivable, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={editingReceivable.due_date}
                    onChange={(e) => setEditingReceivable({ ...editingReceivable, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingReceivable.description || ""}
                  onChange={(e) => setEditingReceivable({ ...editingReceivable, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReceivable(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateReceivable}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-blue flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Dívidas e Recebíveis
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
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <ArrowUpRight className="h-4 w-4 text-red-500" />
                <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalPayable)}</p>
              </div>
              <p className="text-xs text-muted-foreground">A Pagar</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalReceivable)}</p>
              </div>
              <p className="text-xs text-muted-foreground">A Receber</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${summary.netBalance >= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center justify-center gap-1">
                {summary.netBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <p className={`text-lg font-bold ${summary.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(Math.abs(summary.netBalance))}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Saldo</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {summary.overduePayableCount + summary.overdueReceivableCount}
              </p>
              <p className="text-xs text-muted-foreground">Atrasados</p>
            </div>
          </div>

          {/* Two columns: Payable | Receivable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A Pagar */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-red-600 flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                A Pagar ({summary.pendingPayableCount})
              </h4>
              {debtsPayable.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm border rounded-xl">
                  Nenhuma dívida pendente
                </div>
              ) : (
                <div className="space-y-2">
                  {debtsPayable.map((debt) => (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border ${
                        isOverdue(debt.due_date) ? "border-red-200 bg-red-50/50" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{debt.creditor_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {new Date(debt.due_date).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="font-semibold text-red-600 mt-1">{formatCurrency(Number(debt.amount))}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(debt.status, debt.due_date, "payable")}
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleMarkAsPaid(debt.id)}
                              className="h-7 w-7"
                              title="Marcar como pago"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingPayable(debt)}
                              className="h-7 w-7"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* A Receber */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-green-600 flex items-center gap-1">
                <ArrowDownLeft className="h-4 w-4" />
                A Receber ({summary.pendingReceivableCount})
              </h4>
              {debtsReceivable.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm border rounded-xl">
                  Nenhum valor a receber
                </div>
              ) : (
                <div className="space-y-2">
                  {debtsReceivable.map((debt) => (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border ${
                        isOverdue(debt.due_date) ? "border-orange-200 bg-orange-50/50" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{debt.debtor_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {new Date(debt.due_date).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="font-semibold text-green-600 mt-1">{formatCurrency(Number(debt.amount))}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(debt.status, debt.due_date, "receivable")}
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleMarkAsReceived(debt.id)}
                              className="h-7 w-7"
                              title="Marcar como recebido"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingReceivable(debt)}
                              className="h-7 w-7"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
