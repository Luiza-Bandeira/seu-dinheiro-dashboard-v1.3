import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, CreditCard, Building2, Wallet, AlertCircle, CheckCircle, Clock, Pencil } from "lucide-react";
import { motion } from "framer-motion";

interface BasicInformationProps {
  userId: string;
}

interface BankAccount {
  id: string;
  name: string;
  type: string;
  card_limit: number;
  annual_fee: number;
  interest_rate: number;
  other_fees: string;
}

interface DebtPayable {
  id: string;
  creditor_name: string;
  amount: number;
  due_date: string;
  description: string;
  status: string;
  paid_at: string | null;
}

interface DebtReceivable {
  id: string;
  debtor_name: string;
  amount: number;
  due_date: string;
  description: string;
  status: string;
  received_at: string | null;
}

export function BasicInformation({ userId }: BasicInformationProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [debtsPayable, setDebtsPayable] = useState<DebtPayable[]>([]);
  const [debtsReceivable, setDebtsReceivable] = useState<DebtReceivable[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editingDebtPayable, setEditingDebtPayable] = useState<DebtPayable | null>(null);
  const [editingDebtReceivable, setEditingDebtReceivable] = useState<DebtReceivable | null>(null);

  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "conta",
    card_limit: 0,
    annual_fee: 0,
    interest_rate: 0,
    other_fees: "",
  });

  const [newDebtPayable, setNewDebtPayable] = useState({
    creditor_name: "",
    amount: 0,
    due_date: "",
    description: "",
  });

  const [newDebtReceivable, setNewDebtReceivable] = useState({
    debtor_name: "",
    amount: 0,
    due_date: "",
    description: "",
  });

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    await Promise.all([loadAccounts(), loadDebtsPayable(), loadDebtsReceivable()]);
  };

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("banks_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setAccounts(data);
  };

  const loadDebtsPayable = async () => {
    const { data, error } = await supabase
      .from("debts_payable")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (!error && data) setDebtsPayable(data);
  };

  const loadDebtsReceivable = async () => {
    const { data, error } = await supabase
      .from("debts_receivable")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (!error && data) setDebtsReceivable(data);
  };

  const handleAddAccount = async () => {
    if (loading) return;
    if (!newAccount.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome da conta/cartão",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("banks_accounts").insert({
      user_id: userId,
      ...newAccount,
    });

    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Adicionado!", description: "Conta/cartão registrado." });
      setNewAccount({ name: "", type: "conta", card_limit: 0, annual_fee: 0, interest_rate: 0, other_fees: "" });
      await loadAccounts();
    }
    setLoading(false);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from("banks_accounts")
      .update({
        name: editingAccount.name,
        type: editingAccount.type,
        card_limit: editingAccount.card_limit,
        annual_fee: editingAccount.annual_fee,
        interest_rate: editingAccount.interest_rate,
        other_fees: editingAccount.other_fees,
      })
      .eq("id", editingAccount.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Conta/cartão atualizado." });
      setEditingAccount(null);
      await loadAccounts();
    }
    setLoading(false);
  };

  const handleAddDebtPayable = async () => {
    if (loading) return;
    if (!newDebtPayable.creditor_name || newDebtPayable.amount <= 0 || !newDebtPayable.due_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("debts_payable").insert({
      user_id: userId,
      ...newDebtPayable,
    });

    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Adicionado!", description: "Dívida a pagar registrada." });
      setNewDebtPayable({ creditor_name: "", amount: 0, due_date: "", description: "" });
      await loadDebtsPayable();
    }
    setLoading(false);
  };

  const handleUpdateDebtPayable = async () => {
    if (!editingDebtPayable || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from("debts_payable")
      .update({
        creditor_name: editingDebtPayable.creditor_name,
        amount: editingDebtPayable.amount,
        due_date: editingDebtPayable.due_date,
        description: editingDebtPayable.description,
      })
      .eq("id", editingDebtPayable.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Dívida atualizada." });
      setEditingDebtPayable(null);
      await loadDebtsPayable();
    }
    setLoading(false);
  };

  const handleAddDebtReceivable = async () => {
    if (loading) return;
    if (!newDebtReceivable.debtor_name || newDebtReceivable.amount <= 0 || !newDebtReceivable.due_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("debts_receivable").insert({
      user_id: userId,
      ...newDebtReceivable,
    });

    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Adicionado!", description: "Valor a receber registrado." });
      setNewDebtReceivable({ debtor_name: "", amount: 0, due_date: "", description: "" });
      await loadDebtsReceivable();
    }
    setLoading(false);
  };

  const handleUpdateDebtReceivable = async () => {
    if (!editingDebtReceivable || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from("debts_receivable")
      .update({
        debtor_name: editingDebtReceivable.debtor_name,
        amount: editingDebtReceivable.amount,
        due_date: editingDebtReceivable.due_date,
        description: editingDebtReceivable.description,
      })
      .eq("id", editingDebtReceivable.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Valor a receber atualizado." });
      setEditingDebtReceivable(null);
      await loadDebtsReceivable();
    }
    setLoading(false);
  };

  const handleUpdateDebtPayableStatus = async (id: string, status: string) => {
    const updateData = status === "paid" ? { status, paid_at: new Date().toISOString() } : { status };
    const { error } = await supabase.from("debts_payable").update(updateData).eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Status da dívida alterado." });
      await loadDebtsPayable();
    }
  };

  const handleUpdateDebtReceivableStatus = async (id: string, status: string) => {
    const updateData = status === "received" ? { status, received_at: new Date().toISOString() } : { status };
    const { error } = await supabase.from("debts_receivable").update(updateData).eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Status atualizado." });
      await loadDebtsReceivable();
    }
  };

  const handleDelete = async (table: "banks_accounts" | "debts_payable" | "debts_receivable", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deletado!", description: "Registro removido." });
      if (table === "banks_accounts") await loadAccounts();
      else if (table === "debts_payable") await loadDebtsPayable();
      else if (table === "debts_receivable") await loadDebtsReceivable();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "cartao":
        return <CreditCard className="h-5 w-5" />;
      case "conta":
        return <Building2 className="h-5 w-5" />;
      case "carteira_digital":
        return <Wallet className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "cartao":
        return "Cartão";
      case "conta":
        return "Conta";
      case "carteira_digital":
        return "Carteira Digital";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string, type: "payable" | "receivable") => {
    const isPaid = status === "paid" || status === "received";
    const isOverdue = status === "overdue";
    
    return (
      <Badge variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"}>
        {isPaid ? <CheckCircle className="h-3 w-3 mr-1" /> : isOverdue ? <AlertCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
        {isPaid ? type === "payable" ? "Pago" : "Recebido" : isOverdue ? "Atrasado" : "Pendente"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Edit Account Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Conta/Cartão
            </DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editingAccount.type}
                  onValueChange={(value) => setEditingAccount({ ...editingAccount, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conta">Conta Bancária</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="carteira_digital">Carteira Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingAccount.type === "cartao" && (
                <div className="space-y-2">
                  <Label>Limite do Cartão (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingAccount.card_limit || ""}
                    onChange={(e) => setEditingAccount({ ...editingAccount, card_limit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Anuidade (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingAccount.annual_fee || ""}
                    onChange={(e) => setEditingAccount({ ...editingAccount, annual_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Juros (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingAccount.interest_rate || ""}
                    onChange={(e) => setEditingAccount({ ...editingAccount, interest_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Outras Taxas</Label>
                <Input
                  value={editingAccount.other_fees || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, other_fees: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateAccount} disabled={loading}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Debt Payable Dialog */}
      <Dialog open={!!editingDebtPayable} onOpenChange={(open) => !open && setEditingDebtPayable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Dívida a Pagar
            </DialogTitle>
          </DialogHeader>
          {editingDebtPayable && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Credor</Label>
                <Input
                  value={editingDebtPayable.creditor_name}
                  onChange={(e) => setEditingDebtPayable({ ...editingDebtPayable, creditor_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editingDebtPayable.amount || ""}
                  onChange={(e) => setEditingDebtPayable({ ...editingDebtPayable, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={editingDebtPayable.due_date}
                  onChange={(e) => setEditingDebtPayable({ ...editingDebtPayable, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingDebtPayable.description || ""}
                  onChange={(e) => setEditingDebtPayable({ ...editingDebtPayable, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDebtPayable(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDebtPayable} disabled={loading}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Debt Receivable Dialog */}
      <Dialog open={!!editingDebtReceivable} onOpenChange={(open) => !open && setEditingDebtReceivable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Valor a Receber
            </DialogTitle>
          </DialogHeader>
          {editingDebtReceivable && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Devedor</Label>
                <Input
                  value={editingDebtReceivable.debtor_name}
                  onChange={(e) => setEditingDebtReceivable({ ...editingDebtReceivable, debtor_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editingDebtReceivable.amount || ""}
                  onChange={(e) => setEditingDebtReceivable({ ...editingDebtReceivable, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Recebimento</Label>
                <Input
                  type="date"
                  value={editingDebtReceivable.due_date}
                  onChange={(e) => setEditingDebtReceivable({ ...editingDebtReceivable, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingDebtReceivable.description || ""}
                  onChange={(e) => setEditingDebtReceivable({ ...editingDebtReceivable, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDebtReceivable(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDebtReceivable} disabled={loading}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="banks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
          <TabsTrigger value="banks">Bancos e Cartões</TabsTrigger>
          <TabsTrigger value="payable">Dívidas a Pagar</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="text-brand-blue">Adicionar Banco/Cartão</CardTitle>
                  <CardDescription>Registre suas contas e cartões</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Nubank, Itaú, PicPay"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={newAccount.type} onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conta">Conta Bancária</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                        <SelectItem value="carteira_digital">Carteira Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newAccount.type === "cartao" && (
                    <div className="space-y-2">
                      <Label>Limite do Cartão (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={newAccount.card_limit || ""}
                        onChange={(e) => setNewAccount({ ...newAccount, card_limit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Anuidade (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={newAccount.annual_fee || ""}
                        onChange={(e) => setNewAccount({ ...newAccount, annual_fee: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Juros (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={newAccount.interest_rate || ""}
                        onChange={(e) => setNewAccount({ ...newAccount, interest_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Outras Taxas (opcional)</Label>
                    <Input
                      placeholder="Ex: Taxa de manutenção, tarifa de saque"
                      value={newAccount.other_fees}
                      onChange={(e) => setNewAccount({ ...newAccount, other_fees: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleAddAccount} disabled={loading} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10">
                  <CardTitle className="text-brand-blue">Minhas Contas e Cartões</CardTitle>
                  <CardDescription>Gerencie suas contas bancárias e cartões</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {accounts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma conta registrada ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {accounts.map((account) => (
                        <motion.div
                          key={account.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="border-border hover:border-primary/50 transition-colors">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="text-brand-blue mt-1">{getIcon(account.type)}</div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-brand-blue">{account.name}</h4>
                                    <p className="text-xs text-muted-foreground mb-2">{getTypeLabel(account.type)}</p>
                                    <div className="space-y-1 text-sm">
                                      {account.type === "cartao" && account.card_limit > 0 && (
                                        <p className="text-muted-foreground">
                                          Limite:{" "}
                                          <span className="font-semibold text-foreground">R$ {Number(account.card_limit).toFixed(2)}</span>
                                        </p>
                                      )}
                                      {account.annual_fee > 0 && (
                                        <p className="text-muted-foreground">
                                          Anuidade:{" "}
                                          <span className="font-semibold text-foreground">R$ {Number(account.annual_fee).toFixed(2)}</span>
                                        </p>
                                      )}
                                      {account.interest_rate > 0 && (
                                        <p className="text-muted-foreground">
                                          Juros: <span className="font-semibold text-foreground">{Number(account.interest_rate).toFixed(2)}%</span>
                                        </p>
                                      )}
                                      {account.other_fees && <p className="text-muted-foreground text-xs">{account.other_fees}</p>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingAccount(account)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete("banks_accounts", account.id)}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="payable" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-destructive/5 to-destructive/10">
                <CardTitle className="text-brand-blue">Adicionar Dívida a Pagar</CardTitle>
                <CardDescription>Registre suas dívidas e compromissos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Credor</Label>
                  <Input
                    placeholder="Nome do credor"
                    value={newDebtPayable.creditor_name}
                    onChange={(e) => setNewDebtPayable({ ...newDebtPayable, creditor_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={newDebtPayable.amount || ""}
                    onChange={(e) => setNewDebtPayable({ ...newDebtPayable, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={newDebtPayable.due_date}
                    onChange={(e) => setNewDebtPayable({ ...newDebtPayable, due_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Detalhes da dívida"
                    value={newDebtPayable.description}
                    onChange={(e) => setNewDebtPayable({ ...newDebtPayable, description: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddDebtPayable} disabled={loading} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Dívida
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10">
                <CardTitle className="text-brand-blue">Minhas Dívidas a Pagar</CardTitle>
                <CardDescription>Acompanhe seus compromissos</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {debtsPayable.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma dívida registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {debtsPayable.map((debt) => (
                      <Card key={debt.id} className="border-border">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-brand-blue">{debt.creditor_name}</h4>
                                {getStatusBadge(debt.status, "payable")}
                              </div>
                              <p className="text-lg font-bold text-foreground">R$ {Number(debt.amount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                Vencimento: {new Date(debt.due_date).toLocaleDateString("pt-BR")}
                              </p>
                              {debt.description && <p className="text-xs text-muted-foreground mt-1">{debt.description}</p>}
                              {debt.status === "pending" && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateDebtPayableStatus(debt.id, "paid")}
                                  >
                                    Marcar como Pago
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingDebtPayable(debt)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete("debts_payable", debt.id)}
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
        </TabsContent>

        <TabsContent value="receivable" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="text-brand-blue">Adicionar Valor a Receber</CardTitle>
                <CardDescription>Registre valores que você tem a receber</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Devedor</Label>
                  <Input
                    placeholder="Nome do devedor"
                    value={newDebtReceivable.debtor_name}
                    onChange={(e) => setNewDebtReceivable({ ...newDebtReceivable, debtor_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={newDebtReceivable.amount || ""}
                    onChange={(e) => setNewDebtReceivable({ ...newDebtReceivable, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Recebimento</Label>
                  <Input
                    type="date"
                    value={newDebtReceivable.due_date}
                    onChange={(e) => setNewDebtReceivable({ ...newDebtReceivable, due_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Detalhes do valor a receber"
                    value={newDebtReceivable.description}
                    onChange={(e) => setNewDebtReceivable({ ...newDebtReceivable, description: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddDebtReceivable} disabled={loading} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Recebível
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10">
                <CardTitle className="text-brand-blue">Valores a Receber</CardTitle>
                <CardDescription>Acompanhe seus recebíveis</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {debtsReceivable.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum valor a receber</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {debtsReceivable.map((debt) => (
                      <Card key={debt.id} className="border-border">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-brand-blue">{debt.debtor_name}</h4>
                                {getStatusBadge(debt.status, "receivable")}
                              </div>
                              <p className="text-lg font-bold text-foreground">R$ {Number(debt.amount).toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                Recebimento: {new Date(debt.due_date).toLocaleDateString("pt-BR")}
                              </p>
                              {debt.description && <p className="text-xs text-muted-foreground mt-1">{debt.description}</p>}
                              {debt.status === "pending" && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateDebtReceivableStatus(debt.id, "received")}
                                  >
                                    Marcar como Recebido
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingDebtReceivable(debt)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete("debts_receivable", debt.id)}
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
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-brand-blue" />
                  <p className="text-sm text-muted-foreground">Contas e Cartões</p>
                  <p className="text-2xl font-bold text-brand-blue">{accounts.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-muted-foreground">Dívidas a Pagar</p>
                  <p className="text-2xl font-bold text-destructive">
                    R${" "}
                    {debtsPayable
                      .filter((d) => d.status === "pending")
                      .reduce((sum, d) => sum + Number(d.amount), 0)
                      .toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-primary">
                    R${" "}
                    {debtsReceivable
                      .filter((d) => d.status === "pending")
                      .reduce((sum, d) => sum + Number(d.amount), 0)
                      .toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                  <p className="text-2xl font-bold text-green-600">
                    R${" "}
                    {(
                      debtsReceivable
                        .filter((d) => d.status === "pending")
                        .reduce((sum, d) => sum + Number(d.amount), 0) -
                      debtsPayable
                        .filter((d) => d.status === "pending")
                        .reduce((sum, d) => sum + Number(d.amount), 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
