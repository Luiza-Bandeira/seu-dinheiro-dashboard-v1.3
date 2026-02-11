import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { History as HistoryIcon, Filter, ArrowUpDown, Trash2, RefreshCw, CreditCard, Pencil } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Finance {
  id: string;
  type: string;
  category: string;
  value: number;
  date: string;
  description: string | null;
  source_type?: string | null;
  source_id?: string | null;
}

export default function History() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    category: "",
    value: 0,
    date: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadFinances(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadFinances = async (userId: string) => {
    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar histórico:", error);
      return;
    }

    setFinances(data || []);
  };

  const handleDelete = async (finance: Finance, deleteAll: boolean = false) => {
    if (!user) return;
    
    setDeletingId(finance.id);
    
    try {
      if (deleteAll && finance.source_id && finance.source_type) {
        const today = new Date().toISOString().split("T")[0];
        
        const { error: deleteError } = await supabase
          .from("finances")
          .delete()
          .eq("source_id", finance.source_id)
          .gte("date", today);
        
        if (deleteError) throw deleteError;
        
        if (finance.source_type === "recurring") {
          await supabase
            .from("recurring_expenses")
            .update({ is_active: false })
            .eq("id", finance.source_id);
        } else if (finance.source_type === "installment") {
          await supabase
            .from("installment_purchases")
            .update({ is_active: false })
            .eq("id", finance.source_id);
        }
        
        toast({
          title: "Lançamentos excluídos!",
          description: "Todos os lançamentos futuros foram removidos.",
        });
      } else {
        const { error } = await supabase
          .from("finances")
          .delete()
          .eq("id", finance.id);
        
        if (error) throw error;
        
        toast({
          title: "Lançamento excluído!",
          description: "O lançamento foi removido com sucesso.",
        });
      }
      
      await loadFinances(user.id);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (finance: Finance) => {
    setEditingFinance(finance);
    setEditForm({
      type: finance.type,
      category: finance.category,
      value: finance.value,
      date: finance.date,
      description: finance.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditFinance = async () => {
    if (!editingFinance || !user) return;
    if (editForm.value <= 0) {
      toast({ title: "Erro", description: "Informe um valor válido", variant: "destructive" });
      return;
    }
    if (!editForm.category.trim()) {
      toast({ title: "Erro", description: "Informe a categoria", variant: "destructive" });
      return;
    }
    if (!editForm.date) {
      toast({ title: "Erro", description: "Informe a data", variant: "destructive" });
      return;
    }

    if (saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("finances")
      .update({
        type: editForm.type as any,
        category: editForm.category,
        value: editForm.value,
        date: editForm.date,
        description: editForm.description || null,
      })
      .eq("id", editingFinance.id);

    if (error) {
      toast({ title: "Erro ao editar", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Lançamento atualizado!", description: "As alterações foram salvas." });
    setEditDialogOpen(false);
    setEditingFinance(null);
    await loadFinances(user.id);
    setSaving(false);
  };

  const getFilteredFinances = () => {
    let filtered = [...finances];

    if (filterType !== "all") {
      filtered = filtered.filter((f) => f.type === filterType);
    }

    if (filterCategory) {
      filtered = filtered.filter((f) =>
        f.category.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter((f) => f.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((f) => f.date <= endDate);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const filteredFinances = getFilteredFinances();

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      income: "Receita",
      fixed_expense: "Despesa Fixa",
      variable_expense: "Despesa Variável",
      receivable: "A Receber",
      debt: "Dívida",
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      income: "bg-green-500 text-white",
      fixed_expense: "bg-red-500 text-white",
      variable_expense: "bg-orange-500 text-white",
      receivable: "bg-blue-500 text-white",
      debt: "bg-purple-500 text-white",
    };
    return colors[type] || "bg-gray-500 text-white";
  };

  const getSourceBadge = (finance: Finance) => {
    if (!finance.source_type) return null;
    
    if (finance.source_type === "recurring") {
      return (
        <Badge variant="outline" className="ml-2 border-brand-magenta text-brand-magenta">
          <RefreshCw className="h-3 w-3 mr-1" />
          Recorrente
        </Badge>
      );
    }
    
    if (finance.source_type === "installment") {
      return (
        <Badge variant="outline" className="ml-2 border-brand-blue text-brand-blue">
          <CreditCard className="h-3 w-3 mr-1" />
          Parcelada
        </Badge>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand-blue text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onMenuClick={() => setIsOpen(!isOpen)} />
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-brand-blue mb-2 flex items-center gap-2">
              <HistoryIcon className="h-8 w-8" />
              Histórico Financeiro
            </h1>
            <p className="text-muted-foreground">
              Visualize todo o seu histórico de movimentações financeiras
            </p>
          </div>

          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-brand-blue flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="fixed_expense">Despesa Fixa</SelectItem>
                      <SelectItem value="variable_expense">Despesa Variável</SelectItem>
                      <SelectItem value="receivable">A Receber</SelectItem>
                      <SelectItem value="debt">Dívida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    placeholder="Filtrar por categoria"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="border-brand-magenta text-brand-magenta hover:bg-brand-magenta hover:text-white"
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Ordenar por Data ({sortOrder === "asc" ? "Mais Antiga" : "Mais Recente"})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType("all");
                    setFilterCategory("");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-md">
            <CardContent className="p-0">
              {filteredFinances.length === 0 ? (
                <div className="py-12 text-center">
                  <HistoryIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg">
                    Nenhuma movimentação encontrada
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold text-brand-blue">Tipo</TableHead>
                        <TableHead className="font-bold text-brand-blue">Categoria</TableHead>
                        <TableHead className="font-bold text-brand-blue">Valor</TableHead>
                        <TableHead className="font-bold text-brand-blue">Data</TableHead>
                        <TableHead className="font-bold text-brand-blue">Observações</TableHead>
                        <TableHead className="font-bold text-brand-blue text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFinances.map((finance, index) => (
                        <TableRow
                          key={finance.id}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <TableCell>
                            <div className="flex items-center flex-wrap">
                              <Badge className={getTypeBadgeColor(finance.type)}>
                                {getTypeLabel(finance.type)}
                              </Badge>
                              {getSourceBadge(finance)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{finance.category}</TableCell>
                          <TableCell
                            className={`font-bold ${
                              finance.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {finance.type === "income" ? "+" : "-"} R${" "}
                            {finance.value.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {new Date(finance.date + "T12:00:00").toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {finance.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => openEditDialog(finance)}
                                title="Editar lançamento"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {finance.source_id ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      disabled={deletingId === finance.id}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Este lançamento faz parte de uma {finance.source_type === "recurring" ? "despesa recorrente" : "compra parcelada"}. 
                                        O que você deseja fazer?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(finance, false)}
                                        className="bg-orange-500 hover:bg-orange-600"
                                      >
                                        Excluir apenas este
                                      </AlertDialogAction>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(finance, true)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Excluir todos futuros
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === finance.id}
                                  onClick={() => handleDelete(finance, false)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-muted-foreground">
            <p>
              Total de registros: <span className="font-bold text-brand-blue">{filteredFinances.length}</span>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Dialog de Editar Lançamento */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-brand-blue">Editar Lançamento</DialogTitle>
            <DialogDescription>Altere os dados do lançamento financeiro</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={editForm.type} onValueChange={(val) => setEditForm({ ...editForm, type: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="fixed_expense">Despesa Fixa</SelectItem>
                  <SelectItem value="variable_expense">Despesa Variável</SelectItem>
                  <SelectItem value="receivable">A Receber</SelectItem>
                  <SelectItem value="debt">Dívida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                placeholder="Ex: Alimentação, Transporte"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={editForm.value || ""}
                onChange={(e) => setEditForm({ ...editForm, value: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descrição do lançamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditFinance} disabled={saving}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
