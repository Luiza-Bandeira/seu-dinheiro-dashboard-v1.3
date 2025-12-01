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
import { History as HistoryIcon, Filter, ArrowUpDown } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

interface Finance {
  id: string;
  type: string;
  category: string;
  value: number;
  date: string;
  description: string | null;
}

export default function History() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [finances, setFinances] = useState<Finance[]>([]);
  
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFinances.map((finance, index) => (
                        <TableRow
                          key={finance.id}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <TableCell>
                            <Badge className={getTypeBadgeColor(finance.type)}>
                              {getTypeLabel(finance.type)}
                            </Badge>
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
                            {new Date(finance.date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {finance.description || "—"}
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
    </div>
  );
}
