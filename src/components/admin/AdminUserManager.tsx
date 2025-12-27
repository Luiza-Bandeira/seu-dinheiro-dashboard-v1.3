import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Users, Edit2, Calendar, DollarSign, Package, Eye, Copy, CheckCircle, Link } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
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
});

const commercialSchema = z.object({
  produto_adquirido: z.string().max(200).optional(),
  data_inicio: z.string().optional(),
  data_fim_vigencia: z.string().optional(),
  valor_pago: z.number().min(0).optional(),
});

export function AdminUserManager({ profiles, onRefresh }: AdminUserManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState("");
  const [createdUserName, setCreatedUserName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");

  // Commercial data form
  const [produtoAdquirido, setProdutoAdquirido] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFimVigencia, setDataFimVigencia] = useState("");
  const [valorPago, setValorPago] = useState("");

  const handleCreateUser = async () => {
    setErrors({});

    try {
      const validatedData = createUserSchema.parse({
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
      });

      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Erro", description: "Sessão expirada", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: validatedData.email,
          fullName: validatedData.fullName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Show the recovery link to the admin
      setCreatedUserName(validatedData.fullName);
      setRecoveryLink(response.data.recoveryLink || "");
      setLinkCopied(false);
      setLinkDialogOpen(true);

      toast({
        title: "Usuário criado com sucesso!",
        description: "Copie o link de acesso e envie ao aluno.",
      });

      setNewUserEmail("");
      setNewUserName("");
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

  const openUserDetail = (user: Profile) => {
    setSelectedUser(user);
    setProdutoAdquirido(user.produto_adquirido || "");
    setDataInicio(user.data_inicio || "");
    setDataFimVigencia(user.data_fim_vigencia || "");
    setValorPago(user.valor_pago?.toString() || "");
    setDetailDialogOpen(true);
  };

  const handleSaveCommercialData = async () => {
    if (!selectedUser) return;

    try {
      const validatedData = commercialSchema.parse({
        produto_adquirido: produtoAdquirido || undefined,
        data_inicio: dataInicio || undefined,
        data_fim_vigencia: dataFimVigencia || undefined,
        valor_pago: valorPago ? parseFloat(valorPago) : undefined,
      });

      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          produto_adquirido: validatedData.produto_adquirido || null,
          data_inicio: validatedData.data_inicio || null,
          data_fim_vigencia: validatedData.data_fim_vigencia || null,
          valor_pago: validatedData.valor_pago || null,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({ title: "Dados comerciais salvos!" });
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
    // Priorize last_login_at over created_at
    const lastAccess = user.last_login_at;
    if (!lastAccess) {
      return { text: "Nunca acessou", isOnline: false };
    }

    const lastDate = new Date(lastAccess);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60));

    // Consider online if accessed in last 15 minutes
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUserDetail(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
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
              O aluno receberá um email para definir sua senha.
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

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>• O aluno será criado com perfil "Aluno"</p>
              <p>• Um link de recuperação de senha será gerado</p>
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
                  <div>
                    <span className="text-muted-foreground">Status Pagamento:</span>
                    <p className="font-medium capitalize">{selectedUser?.payment_status || "Pendente"}</p>
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

      {/* Recovery Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Aluno Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Copie o link abaixo e envie para <strong>{createdUserName}</strong> definir a senha de acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Link de Acesso
              </Label>
              <div className="flex gap-2">
                <Input
                  value={recoveryLink}
                  readOnly
                  className="flex-1 text-sm font-mono bg-muted"
                />
                <Button
                  variant={linkCopied ? "secondary" : "default"}
                  className={linkCopied ? "bg-green-500 hover:bg-green-500" : "bg-brand-magenta hover:bg-brand-magenta/90"}
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryLink);
                    setLinkCopied(true);
                    toast({ title: "Link copiado!" });
                  }}
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <p className="font-semibold">⚠️ Importante:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Este link é único e expira em 24 horas</li>
                <li>Envie por um canal seguro (ex: WhatsApp direto)</li>
                <li>O aluno definirá sua própria senha ao acessar</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setLinkDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
