import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface LibraryStatsProps {
  userId: string;
}

export function LibraryStats({ userId }: LibraryStatsProps) {
  const [stats, setStats] = useState({
    totalContents: 0,
    completedContents: 0,
    progressPercentage: 0,
    activeGoals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    setLoading(true);
    
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
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mb-6 bg-gradient-to-r from-brand-blue/5 to-primary/5 border-brand-blue/20">
        <CardContent className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Progress Section */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-brand-blue">Seu Progresso no Curso</h3>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <Progress value={stats.progressPercentage} className="flex-1 h-3" />
                <span className="text-2xl font-bold text-brand-blue min-w-[60px] text-right">
                  {stats.progressPercentage}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Continue estudando para alcançar seus objetivos financeiros!
              </p>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-wrap gap-4 lg:gap-6">
              <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-sm border">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-blue">
                    {stats.completedContents}
                  </p>
                  <p className="text-xs text-muted-foreground">Completos</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-sm border">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-blue">
                    {stats.totalContents}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-sm border">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-blue">
                    {stats.activeGoals}
                  </p>
                  <p className="text-xs text-muted-foreground">Metas Ativas</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
