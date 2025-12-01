import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calculator, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InvestmentSimulatorProps {
  userId: string;
}

interface Goal {
  id: string;
  goal_name: string;
  target_value: number;
}

export function InvestmentSimulator({ userId }: InvestmentSimulatorProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [inputs, setInputs] = useState({
    initialAmount: 0,
    monthlyContribution: 0,
    annualRate: 0,
    years: 0,
  });
  const [pmtInputs, setPmtInputs] = useState({
    targetValue: 0,
    months: 0,
    annualRate: 0,
  });
  const [result, setResult] = useState<{
    finalAmount: number;
    totalContributed: number;
    totalInterest: number;
    chartData: any[];
  } | null>(null);
  const [pmtResult, setPmtResult] = useState<number | null>(null);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("id, goal_name, target_value")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar metas:", error);
      return;
    }

    setGoals(data || []);
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setPmtInputs({ ...pmtInputs, targetValue: Number(goal.target_value) });
      toast({
        title: "Meta selecionada!",
        description: `Valor alvo: R$ ${Number(goal.target_value).toFixed(2)}`,
      });
    }
  };

  const calculateInvestment = () => {
    const { initialAmount, monthlyContribution, annualRate, years } = inputs;
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;

    let balance = initialAmount;
    const chartData = [];
    let totalContributed = initialAmount;

    for (let month = 1; month <= months; month++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;

      if (month % 12 === 0) {
        chartData.push({
          year: month / 12,
          balance: Math.round(balance),
          contributed: Math.round(totalContributed),
        });
      }
    }

    setResult({
      finalAmount: balance,
      totalContributed,
      totalInterest: balance - totalContributed,
      chartData,
    });
  };

  const calculatePMT = () => {
    if (pmtInputs.targetValue <= 0 || pmtInputs.months <= 0 || pmtInputs.annualRate <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos com valores válidos",
        variant: "destructive",
      });
      return;
    }

    const monthlyRate = pmtInputs.annualRate / 100 / 12;
    const months = pmtInputs.months;

    // Fórmula PMT: FV = PMT * [(1 + i)^n - 1] / i
    // PMT = FV * i / [(1 + i)^n - 1]
    const pmt = (pmtInputs.targetValue * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);

    setPmtResult(pmt);
  };

  return (
    <Tabs defaultValue="pmt" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-2">
        <TabsTrigger value="projection" className="text-xs sm:text-sm">Projeção</TabsTrigger>
        <TabsTrigger value="pmt" className="text-xs sm:text-sm">Calcular Aporte</TabsTrigger>
      </TabsList>

      <TabsContent value="projection" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
      <Card className="w-full">
        <CardHeader className="space-y-1 sm:space-y-2">
          <CardTitle className="text-lg sm:text-xl text-brand-blue">Simulador de Investimentos</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Calcule o crescimento do seu patrimônio com juros compostos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Valor Inicial (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-9 sm:h-10 text-sm"
              value={inputs.initialAmount || ""}
              onChange={(e) =>
                setInputs({ ...inputs, initialAmount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Aporte Mensal (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-9 sm:h-10 text-sm"
              value={inputs.monthlyContribution || ""}
              onChange={(e) =>
                setInputs({ ...inputs, monthlyContribution: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Taxa de Juros Anual (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-9 sm:h-10 text-sm"
              value={inputs.annualRate || ""}
              onChange={(e) =>
                setInputs({ ...inputs, annualRate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Período (anos)</Label>
            <Input
              type="number"
              placeholder="0"
              className="h-9 sm:h-10 text-sm"
              value={inputs.years || ""}
              onChange={(e) =>
                setInputs({ ...inputs, years: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <Button onClick={calculateInvestment} className="w-full h-9 sm:h-10 text-sm">
            <Calculator className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Calcular
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="space-y-1 sm:space-y-2">
          <CardTitle className="text-lg sm:text-xl text-brand-blue">Resultados</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Projeção do seu investimento</CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm px-4">
              Preencha os campos e clique em calcular para ver os resultados
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 rounded-lg bg-accent/20">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valor Final</p>
                  <p className="text-xl sm:text-2xl font-bold text-brand-blue">
                    R$ {result.finalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-muted">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Investido</p>
                    <p className="text-base sm:text-lg font-bold text-brand-blue">
                      R$ {result.totalContributed.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-primary/10">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Juros Ganhos</p>
                    <p className="text-base sm:text-lg font-bold text-primary">
                      R$ {result.totalInterest.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {result.chartData.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <ResponsiveContainer width="100%" height={200} className="sm:hidden">
                    <BarChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="contributed" fill="#0B2860" name="Investido" />
                      <Bar dataKey="balance" fill="#ef137c" name="Total" />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={250} className="hidden sm:block">
                    <BarChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" label={{ value: "Anos", position: "insideBottom", offset: -5 }} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="contributed" fill="#0B2860" name="Total Investido" />
                      <Bar dataKey="balance" fill="#ef137c" name="Saldo Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </TabsContent>

      <TabsContent value="pmt" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
          <Card className="w-full">
            <CardHeader className="space-y-1 sm:space-y-2">
              <CardTitle className="text-lg sm:text-xl text-brand-blue flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                Calcular Aporte Mensal (PMT)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Descubra quanto poupar mensalmente para atingir sua meta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {goals.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Selecionar Objetivo Financeiro</Label>
                  <Select value={selectedGoalId} onValueChange={handleGoalSelect}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Escolha um objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id} className="text-sm">
                          {goal.goal_name} - R$ {Number(goal.target_value).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted text-xs sm:text-sm text-muted-foreground">
                  Nenhum objetivo cadastrado. Vá até "Objetivos Financeiros" para criar um.
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Valor Alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-9 sm:h-10 text-sm"
                  value={pmtInputs.targetValue || ""}
                  onChange={(e) =>
                    setPmtInputs({ ...pmtInputs, targetValue: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Prazo (meses)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-9 sm:h-10 text-sm"
                  value={pmtInputs.months || ""}
                  onChange={(e) =>
                    setPmtInputs({ ...pmtInputs, months: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Rentabilidade Anual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-9 sm:h-10 text-sm"
                  value={pmtInputs.annualRate || ""}
                  onChange={(e) =>
                    setPmtInputs({ ...pmtInputs, annualRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <Button onClick={calculatePMT} className="w-full h-9 sm:h-10 text-sm">
                <Calculator className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Calcular Aporte
              </Button>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader className="space-y-1 sm:space-y-2">
              <CardTitle className="text-lg sm:text-xl text-brand-blue">Resultado</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Aporte mensal necessário</CardDescription>
            </CardHeader>
            <CardContent>
              {pmtResult === null ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm px-4">
                  Preencha os campos e clique em calcular para ver o resultado
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center p-4 sm:p-6 rounded-lg bg-gradient-to-br from-brand-blue to-brand-magenta">
                    <p className="text-xs sm:text-sm text-white/80 mb-2">Aporte Mensal Necessário</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white">
                      R$ {pmtResult.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-muted">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Valor da meta:</span>
                      <span className="font-semibold">R$ {pmtInputs.targetValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-semibold">{pmtInputs.months} meses ({(pmtInputs.months / 12).toFixed(1)} anos)</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Taxa anual:</span>
                      <span className="font-semibold">{pmtInputs.annualRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm pt-2 sm:pt-3 border-t border-border">
                      <span className="text-muted-foreground">Total a investir:</span>
                      <span className="font-semibold">R$ {(pmtResult * pmtInputs.months).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-lg bg-brand-pink/10 border-2 border-brand-pink/30">
                    <p className="text-xs sm:text-sm text-center text-muted-foreground mb-3">
                      Com esse aporte, você alcançará seu objetivo em {pmtInputs.months} meses
                    </p>
                    <Button 
                      className="w-full h-9 sm:h-10 text-sm bg-brand-magenta hover:bg-brand-magenta/90"
                      onClick={async () => {
                        const { error } = await supabase.from("finances").insert({
                          user_id: userId,
                          type: "fixed_expense",
                          category: "Aporte para Objetivos Financeiros",
                          value: pmtResult,
                          description: selectedGoalId ? `Aporte para: ${goals.find(g => g.id === selectedGoalId)?.goal_name}` : "Aporte mensal planejado",
                          date: new Date().toISOString().split("T")[0],
                        });

                        if (error) {
                          toast({
                            title: "Erro ao adicionar ao orçamento",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "Adicionado ao orçamento!",
                            description: "O aporte foi incluído no seu orçamento mensal.",
                          });
                        }
                      }}
                    >
                      Adicionar ao Orçamento
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}