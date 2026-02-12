import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Home, Wallet, BarChart3 } from "lucide-react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Investment {
  id: string;
  name: string;
  current_value: number;
  estimated_rate: number;
  created_at: string;
}

interface Contribution {
  amount: number;
  contributed_at: string;
}

interface Withdrawal {
  amount: number;
  withdrawn_at: string;
}

interface PatrimonyAsset {
  id: string;
  name: string;
  category: string;
  estimated_value: number;
  acquisition_date: string | null;
  created_at: string;
}

export default function PatrimonyEvolution() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [assets, setAssets] = useState<PatrimonyAsset[]>([]);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      setLoading(false);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      const [invRes, contRes, withRes, assetsRes] = await Promise.all([
        supabase.from("investments_current").select("*").eq("user_id", user.id),
        supabase.from("investment_contributions").select("amount, contributed_at").eq("user_id", user.id).order("contributed_at"),
        supabase.from("investment_withdrawals").select("amount, withdrawn_at").eq("user_id", user.id).order("withdrawn_at"),
        supabase.from("patrimony_assets").select("*").eq("user_id", user.id),
      ]);
      if (invRes.data) setInvestments(invRes.data);
      if (contRes.data) setContributions(contRes.data as Contribution[]);
      if (withRes.data) setWithdrawals(withRes.data);
      if (assetsRes.data) setAssets(assetsRes.data);
    };
    loadData();
  }, [user?.id]);

  const totalAssets = assets.reduce((s, a) => s + Number(a.estimated_value), 0);
  const totalInvestments = investments.reduce((s, i) => s + Number(i.current_value), 0);
  const totalPatrimony = totalAssets + totalInvestments;
  const avgRate = investments.length > 0
    ? investments.reduce((s, i) => s + Number(i.estimated_rate), 0) / investments.length
    : 0;

  const chartData = useMemo(() => {
    const now = new Date();
    const monthsBack = period === "yearly" ? 24 : period === "quarterly" ? 12 : 12;
    const step = period === "yearly" ? 12 : period === "quarterly" ? 3 : 1;
    const points: { label: string; bens: number; investimentos: number; total: number }[] = [];

    // Build a timeline going back monthsBack months
    // For investments: simulate growth using avg rate, subtract withdrawals, add contributions per period
    // For assets: assume constant value (user updates manually)

    for (let i = monthsBack; i >= 0; i -= step) {
      const pointDate = subMonths(now, i);
      const monthEnd = endOfMonth(pointDate);
      const label = period === "yearly"
        ? format(pointDate, "yyyy")
        : format(pointDate, "MMM/yy", { locale: ptBR });

      // Calculate investment value at this point:
      // Start from current value and work backwards
      // Simple approach: current investments projected backward using rate
      const monthlyRate = avgRate / 100 / 12;
      const monthsFromNow = i;

      // Contributions after this point (should be subtracted to get past value)
      const futureContributions = contributions
        .filter(c => new Date(c.contributed_at) > monthEnd)
        .reduce((s, c) => s + Number(c.amount), 0);

      // Withdrawals after this point (should be added back to get past value)
      const futureWithdrawals = withdrawals
        .filter(w => new Date(w.withdrawn_at) > monthEnd)
        .reduce((s, w) => s + Number(w.amount), 0);

      // Discount the growth from now back to this point
      const growthFactor = Math.pow(1 + monthlyRate, monthsFromNow);
      const investmentValue = Math.max(0, (totalInvestments - futureContributions + futureWithdrawals) / growthFactor);

      // Assets that existed at this point
      const assetsAtPoint = assets
        .filter(a => {
          const created = new Date(a.acquisition_date || a.created_at);
          return created <= monthEnd;
        })
        .reduce((s, a) => s + Number(a.estimated_value), 0);

      points.push({
        label,
        bens: Math.round(assetsAtPoint * 100) / 100,
        investimentos: Math.round(investmentValue * 100) / 100,
        total: Math.round((assetsAtPoint + investmentValue) * 100) / 100,
      });
    }

    return points;
  }, [investments, contributions, withdrawals, assets, period, totalInvestments, avgRate]);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-brand-blue mb-2">Evolução do Patrimônio</h1>
              <p className="text-muted-foreground">
                Acompanhe a evolução do seu patrimônio total ao longo do tempo
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bens Patrimoniais</p>
                      <p className="text-2xl font-bold text-brand-blue">
                        {formatCurrency(totalAssets)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Investimentos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalInvestments)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-brand-pink/10">
                      <Wallet className="h-6 w-6 text-brand-pink" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Patrimônio Total</p>
                      <p className="text-2xl font-bold text-brand-pink">
                        {formatCurrency(totalPatrimony)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-brand-blue flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Evolução Patrimonial
                    </CardTitle>
                    <CardDescription>
                      Visualize como seu patrimônio evolui ao longo do tempo
                    </CardDescription>
                  </div>
                  <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                    <TabsList>
                      <TabsTrigger value="monthly">Mensal</TabsTrigger>
                      <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
                      <TabsTrigger value="yearly">Anual</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    Adicione bens e investimentos para ver a evolução do seu patrimônio.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef137c" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef137c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                          name === "bens" ? "Bens" : name === "investimentos" ? "Investimentos" : "Total",
                        ]}
                        labelFormatter={(label) => `Período: ${label}`}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "bens" ? "Bens" : value === "investimentos" ? "Investimentos" : "Total"
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="bens"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorBens)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="investimentos"
                        stroke="#16a34a"
                        fill="url(#colorInv)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#ef137c"
                        fill="url(#colorTotal)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brand-blue text-lg">Bens Patrimoniais</CardTitle>
                </CardHeader>
                <CardContent>
                  {assets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum bem registrado. Vá em Ferramentas → Informações Básicas → Patrimônio.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((asset) => (
                        <div key={asset.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium">{asset.name}</span>
                          <span className="text-sm font-semibold">
                            R$ {Number(asset.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-brand-blue text-lg">Investimentos</CardTitle>
                  <CardDescription>Rentabilidade média: {avgRate.toFixed(1)}% a.a.</CardDescription>
                </CardHeader>
                <CardContent>
                  {investments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum investimento registrado. Vá em Ferramentas → Investimentos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {investments.map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{inv.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({inv.estimated_rate}% a.a.)</span>
                          </div>
                          <span className="text-sm font-semibold">
                            R$ {Number(inv.current_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
