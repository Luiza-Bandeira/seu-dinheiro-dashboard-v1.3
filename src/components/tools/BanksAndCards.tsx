import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, CreditCard, Building2, Wallet } from "lucide-react";

interface BanksAndCardsProps {
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

export function BanksAndCards({ userId }: BanksAndCardsProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "conta",
    card_limit: 0,
    annual_fee: 0,
    interest_rate: 0,
    other_fees: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("banks_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar contas:", error);
      return;
    }

    setAccounts(data || []);
  };

  const handleAddAccount = async () => {
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
      name: newAccount.name,
      type: newAccount.type,
      card_limit: newAccount.card_limit,
      annual_fee: newAccount.annual_fee,
      interest_rate: newAccount.interest_rate,
      other_fees: newAccount.other_fees,
    });

    if (error) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Adicionado!",
      description: "Conta/cartão registrado com sucesso.",
    });

    setNewAccount({
      name: "",
      type: "conta",
      card_limit: 0,
      annual_fee: 0,
      interest_rate: 0,
      other_fees: "",
    });

    await loadAccounts();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("banks_accounts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deletado!",
      description: "Conta/cartão removido.",
    });

    await loadAccounts();
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Adicionar Banco/Cartão</CardTitle>
          <CardDescription>Registre suas contas e cartões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Select
              value={newAccount.type}
              onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}
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

          {newAccount.type === "cartao" && (
            <div className="space-y-2">
              <Label>Limite do Cartão (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAccount.card_limit || ""}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, card_limit: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Anuidade (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newAccount.annual_fee || ""}
              onChange={(e) =>
                setNewAccount({ ...newAccount, annual_fee: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Taxa de Juros (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newAccount.interest_rate || ""}
              onChange={(e) =>
                setNewAccount({ ...newAccount, interest_rate: parseFloat(e.target.value) || 0 })
              }
            />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Minhas Contas e Cartões</CardTitle>
          <CardDescription>Gerencie suas contas bancárias e cartões</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conta registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <Card key={account.id} className="border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-brand-blue mt-1">{getIcon(account.type)}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-brand-blue">{account.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {getTypeLabel(account.type)}
                          </p>
                          <div className="space-y-1 text-sm">
                            {account.type === "cartao" && account.card_limit > 0 && (
                              <p className="text-muted-foreground">
                                Limite: <span className="font-semibold">R$ {Number(account.card_limit).toFixed(2)}</span>
                              </p>
                            )}
                            {account.annual_fee > 0 && (
                              <p className="text-muted-foreground">
                                Anuidade: <span className="font-semibold">R$ {Number(account.annual_fee).toFixed(2)}</span>
                              </p>
                            )}
                            {account.interest_rate > 0 && (
                              <p className="text-muted-foreground">
                                Juros: <span className="font-semibold">{Number(account.interest_rate).toFixed(2)}%</span>
                              </p>
                            )}
                            {account.other_fees && (
                              <p className="text-muted-foreground text-xs">
                                {account.other_fees}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(account.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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