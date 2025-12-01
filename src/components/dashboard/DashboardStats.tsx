import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Target } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStatsProps {
  userId: string;
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalContents: 0,
    completedContents: 0,
    progressPercentage: 0,
    activeGoals: 0,
  });

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    // Get total contents
    const { count: totalContents } = await supabase
      .from("contents")
      .select("*", { count: "exact", head: true });

    // Get completed contents
    const { count: completedContents } = await supabase
      .from("progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);

    // Get active goals
    const { count: activeGoals } = await supabase
      .from("goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "in_progress");

    const progressPercentage =
      totalContents && completedContents
        ? Math.round((completedContents / totalContents) * 100)
        : 0;

    setStats({
      totalContents: totalContents || 0,
      completedContents: completedContents || 0,
      progressPercentage,
      activeGoals: activeGoals || 0,
    });
  };

  const statCards = [
    {
      title: "Progresso Geral",
      value: `${stats.progressPercentage}%`,
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      title: "Conteúdos Completos",
      value: `${stats.completedContents}/${stats.totalContents}`,
      icon: BookOpen,
      color: "text-brand-blue",
    },
    {
      title: "Metas Ativas",
      value: stats.activeGoals,
      icon: Target,
      color: "text-accent-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-blue">{stat.value}</div>
              {stat.title === "Progresso Geral" && (
                <Progress value={stats.progressPercentage} className="mt-2" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}