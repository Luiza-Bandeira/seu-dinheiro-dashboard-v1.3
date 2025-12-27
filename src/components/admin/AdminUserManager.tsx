import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, Edit2, Calendar, DollarSign, Package, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  payment_status: string | null;
  created_at: string | null;
  last_login_at?: string | null;
  produto_adquirido?: string | null;
  data_inicio?: string | null;
  data_fim_vigencia?: string | null;
  valor_pago?: number | null;
}

interface AdminUserManagerProps {
  profiles: Profile[];
  onRefresh: () => void;
}

const createUserSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  fullName: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }).max(100),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const commercialSchema = z.object({
  produto_adquirido: z.string().max(200).optional(),
  data_inicio: z.string().optional(),
  data_fim_vigencia: z.string().optional(),
  valor_pago: z.number().min(0).optional(),
  payment_status: z.string().optional(),
});

export function AdminUserManager({ profiles, onRefresh }: AdminUserManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Commercial data form
  const [produtoAdquirido, setProdutoAdquirido] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFimVigencia, setDataFimVigencia] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const handleCreateUser = async () => {
    setErrors({});

    try {
      const validatedData = createUserSchema.parse({
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
        password: newUserPassword,
      });

      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Erro", description: "Sessão expirada", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'create',
          email: validatedData.email,
          fullName: validatedData.fullName,
          password: validatedData.password,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: `O aluno pode fazer login com email e senha definidos.`,
      });

      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setCreateDialogOpen(false);
      onRefresh();

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else if (error instanceof Error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const response = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'delete',
          userId: userToDelete.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Usuário deletado",
        description: `${userToDelete.full_name || userToDelete.email} foi removido.`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      onRefresh();

    } catch (error) {
      if (error instanceof Error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } finally {
      setDeleting(false);
    }
  };

  const openUserDetail = (user: Profile) => {
    setSelectedUser(user);
    setProdutoAdquirido(user.produto_adquirido || "");
    setDataInicio(user.data_inicio || "");
    setDataFimVigencia(user.data_fim_vigencia || "");
    setValorPago(user.valor_pago?.toString() || "");
    setPaymentStatus(user.payment_status || "pending");
    setDetailDialogOpen(true);
  };

  const openDeleteDialog = (user: Profile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleSaveCommercialData = async () => {
    if (!selectedUser) return;

    try {
      const validatedData = commercialSchema.parse({
        produto_adquirido: produtoAdquirido || undefined,
        data_inicio: dataInicio || undefined,
        data_fim_vigencia: dataFimVigencia || undefined,
        valor_pago: valorPago ? parseFloat(valorPago) : undefined,
        payment_status: paymentStatus || undefined,
      });

      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          produto_adquirido: validatedData.produto_adquirido || null,
          data_inicio: validatedData.data_inicio || null,
          data_fim_vigencia: validatedData.data_fim_vigencia || null,
          valor_pago: validatedData.valor_pago || null,
          payment_status: validatedData.payment_status || null,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({ title: "Dados salvos com sucesso!" });
      setDetailDialogOpen(false);
      onRefresh();

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Erro de validação", description: "Verifique os campos", variant: "destructive" });
      } else if (error instanceof Error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca acessou";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLastAccessInfo = (user: Profile) => {
    const lastAccess = user.last_login_at;
    if (!lastAccess) {
      return { text: "Nunca acessou", isOnline: false };
    }

    const lastDate = new Date(lastAccess);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60));

    const isOnline = diffMinutes < 15;

    return {
      text: formatDateTime(lastAccess),
      isOnline,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-blue flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários
          </h3>
          <p className="text-sm text-muted-foreground">
            {profiles.length} usuários cadastrados
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-brand-magenta hover:bg-brand-magenta/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((user) => {
                  const accessInfo = getLastAccessInfo(user);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "Sem nome"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {accessInfo.isOnline && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                          <span className={accessInfo.isOnline ? "text-green-600 font-medium" : ""}>
                            {accessInfo.isOnline ? "Online" : accessInfo.text}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.payment_status === "approved" ? (
                          <Badge className="bg-green-500">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUserDetail(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-magenta" />
              Cadastrar Novo Aluno
            </DialogTitle>
            <DialogDescription>
              Defina email, nome e senha do novo aluno.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newUserName">Nome Completo *</Label>
              <Input
                id="newUserName"
                placeholder="Nome do aluno"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUserEmail">Email *</Label>
              <Input
                id="newUserEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newUserPassword">Senha *</Label>
              <Input
                id="newUserPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>• O aluno poderá fazer login imediatamente</p>
              <p>• A senha definida aqui é temporária - oriente o aluno a alterá-la</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-brand-magenta hover:bg-brand-magenta/90"
              disabled={saving}
            >
              {saving ? "Criando..." : "Criar Aluno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-brand-blue" />
              Detalhes do Usuário
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informações do Usuário
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedUser?.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cadastro:</span>
                    <p className="font-medium">{formatDate(selectedUser?.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Último Acesso:</span>
                    <p className="font-medium">{formatDateTime(selectedUser?.last_login_at)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Status Pagamento</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Commercial Data */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Dados Comerciais
                </h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="produtoAdquirido">Produto Adquirido</Label>
                    <Input
                      id="produtoAdquirido"
                      placeholder="Ex: Curso Completo"
                      value={produtoAdquirido}
                      onChange={(e) => setProdutoAdquirido(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dataInicio" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Data Início
                      </Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataFimVigencia" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Fim Vigência
                      </Label>
                      <Input
                        id="dataFimVigencia"
                        type="date"
                        value={dataFimVigencia}
                        onChange={(e) => setDataFimVigencia(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorPago" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Pago (R$)
                    </Label>
                    <Input
                      id="valorPago"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCommercialData}
              className="bg-brand-blue hover:bg-brand-blue/90"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
              <br /><br />
              Esta ação é irreversível e removerá todos os dados do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
