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
    <Tabs defaultValue="projection" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="projection">Projeção de Crescimento</TabsTrigger>
        <TabsTrigger value="pmt">Calcular Aporte (PMT)</TabsTrigger>
      </TabsList>

      <TabsContent value="projection" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Simulador de Investimentos</CardTitle>
          <CardDescription>
            Calcule o crescimento do seu patrimônio com juros compostos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Inicial (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={inputs.initialAmount || ""}
              onChange={(e) =>
                setInputs({ ...inputs, initialAmount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Aporte Mensal (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={inputs.monthlyContribution || ""}
              onChange={(e) =>
                setInputs({ ...inputs, monthlyContribution: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Taxa de Juros Anual (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={inputs.annualRate || ""}
              onChange={(e) =>
                setInputs({ ...inputs, annualRate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Período (anos)</Label>
            <Input
              type="number"
              placeholder="0"
              value={inputs.years || ""}
              onChange={(e) =>
                setInputs({ ...inputs, years: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <Button onClick={calculateInvestment} className="w-full">
            <Calculator className="mr-2 h-4 w-4" />
            Calcular
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Resultados</CardTitle>
          <CardDescription>Projeção do seu investimento</CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-center py-12 text-muted-foreground">
              Preencha os campos e clique em calcular para ver os resultados
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 rounded-lg bg-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Valor Final</p>
                  <p className="text-2xl font-bold text-brand-blue">
                    R$ {result.finalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">Total Investido</p>
                    <p className="text-lg font-bold text-brand-blue">
                      R$ {result.totalContributed.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Juros Ganhos</p>
                    <p className="text-lg font-bold text-primary">
                      R$ {result.totalInterest.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {result.chartData.length > 0 && (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={250}>
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

      <TabsContent value="pmt" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-blue flex items-center gap-2">
                <Target className="h-5 w-5" />
                Calcular Aporte Mensal (PMT)
              </CardTitle>
              <CardDescription>
                Descubra quanto poupar mensalmente para atingir sua meta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length > 0 && (
                <div className="space-y-2">
                  <Label>Selecionar Meta (opcional)</Label>
                  <Select value={selectedGoalId} onValueChange={handleGoalSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma meta" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.goal_name} - R$ {Number(goal.target_value).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Valor Alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pmtInputs.targetValue || ""}
                  onChange={(e) =>
                    setPmtInputs({ ...pmtInputs, targetValue: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo (meses)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={pmtInputs.months || ""}
                  onChange={(e) =>
                    setPmtInputs({ ...pmtInputs, months: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Rentabilidade Anual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pmtInputs.annualRate || ""}
                  onChange={(e) =>
                    setPmtInputs({ ...pmtInputs, annualRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <Button onClick={calculatePMT} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Aporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-brand-blue">Resultado</CardTitle>
              <CardDescription>Aporte mensal necessário</CardDescription>
            </CardHeader>
            <CardContent>
              {pmtResult === null ? (
                <div className="text-center py-12 text-muted-foreground">
                  Preencha os campos e clique em calcular para ver o resultado
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-6 rounded-lg bg-gradient-primary">
                    <p className="text-sm text-white/80 mb-2">Aporte Mensal Necessário</p>
                    <p className="text-4xl font-bold text-white">
                      R$ {pmtResult.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-muted">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor da meta:</span>
                      <span className="font-semibold">R$ {pmtInputs.targetValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-semibold">{pmtInputs.months} meses ({(pmtInputs.months / 12).toFixed(1)} anos)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa anual:</span>
                      <span className="font-semibold">{pmtInputs.annualRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-border">
                      <span className="text-muted-foreground">Total a investir:</span>
                      <span className="font-semibold">R$ {(pmtResult * pmtInputs.months).toFixed(2)}</span>
                    </div>
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