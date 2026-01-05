import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface ReductionGoalsWidgetProps {
  userId: string;
}

interface ReductionGoalWithProgress {
  id: string;
  category: string;
  period_type: string;
  target_value: number;
  current_spent: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
}

export function ReductionGoalsWidget({ userId }: ReductionGoalsWidgetProps) {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<ReductionGoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoalsWithProgress = async () => {
    if (!userId) return;

    try {
      // Fetch active reduction goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("reduction_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      if (goalsError) throw goalsError;
      if (!goalsData || goalsData.length === 0) {
        setGoals([]);
        setLoading(false);
        return;
      }

      // Calculate spending for each goal
      const goalsWithProgress = await Promise.all(
        goalsData.map(async (goal) => {
          const currentSpent = await calculateSpentInPeriod(
            goal.category,
            goal.period_type
          );

          const percentage = goal.target_value > 0 
            ? Math.round((currentSpent / goal.target_value) * 100) 
            : 0;

          let status: "ok" | "warning" | "exceeded" = "ok";
          if (percentage >= 100) {
            status = "exceeded";
          } else if (percentage >= 70) {
            status = "warning";
          }

          return {
            id: goal.id,
            category: goal.category,
            period_type: goal.period_type,
            target_value: Number(goal.target_value),
            current_spent: currentSpent,
            percentage,
            status,
          };
        })
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error("Error loading reduction goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSpentInPeriod = async (
    category: string,
    periodType: string
  ): Promise<number> => {
    const now = new Date();
    let startDate: string;

    if (periodType === "mensal") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
    } else {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
    }

    const { data } = await supabase
      .from("finances")
      .select("value")
      .eq("user_id", userId)
      .eq("category", category)
      .gte("date", startDate)
      .in("type", ["fixed_expense", "variable_expense", "debt"]);

    return data?.reduce((sum, f) => sum + Number(f.value), 0) || 0;
  };

  useEffect(() => {
    loadGoalsWithProgress();
  }, [userId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("dashboard-reduction-goals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reduction_goals" },
        () => loadGoalsWithProgress()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "finances" },
        () => loadGoalsWithProgress()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getProgressColor = (status: "ok" | "warning" | "exceeded") => {
    switch (status) {
      case "exceeded":
        return "bg-destructive";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="border-2 border-brand-blue/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas de Redução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="border-2 border-brand-blue/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas de Redução
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tools")}
            className="text-brand-magenta"
          >
            Criar Meta
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Você ainda não tem metas de redução ativas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-brand-blue/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-brand-blue flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas de Redução
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/tools")}
          className="text-brand-magenta"
        >
          Ver Todas
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.slice(0, 4).map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-muted/50 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {goal.category}
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs capitalize"
                  >
                    {goal.period_type}
                  </Badge>
                  {goal.status === "exceeded" && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(goal.current_spent)} /{" "}
                  {formatCurrency(goal.target_value)}
                </span>
                <span
                  className={`font-medium ${
                    goal.status === "exceeded"
                      ? "text-destructive"
                      : goal.status === "warning"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {goal.percentage}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(goal.percentage, 100)} 
                  className="h-2"
                />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(
                    goal.status
                  )}`}
                  style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
