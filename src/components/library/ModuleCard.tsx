import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    description: string;
    order_index: number;
  };
  userId: string;
  index: number;
}

export function ModuleCard({ module, userId, index }: ModuleCardProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [totalContents, setTotalContents] = useState(0);
  const [completedContents, setCompletedContents] = useState(0);

  useEffect(() => {
    loadProgress();
  }, [module.id, userId]);

  const loadProgress = async () => {
    // Get total contents for this module
    const { count: total } = await supabase
      .from("contents")
      .select("*", { count: "exact", head: true })
      .eq("module_id", module.id);

    // Get completed contents for this module
    const { data: completed } = await supabase
      .from("progress")
      .select("content_id, contents!inner(module_id)")
      .eq("user_id", userId)
      .eq("completed", true)
      .eq("contents.module_id", module.id);

    const totalCount = total || 0;
    const completedCount = completed?.length || 0;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    setTotalContents(totalCount);
    setCompletedContents(completedCount);
    setProgress(progressPercentage);
  };

  // Check if this is the bonus module (Encontros ao Vivo)
  const isBonus = module.order_index === 6 || module.title.toLowerCase().includes('bônus') || module.title.toLowerCase().includes('bonus');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={`hover:shadow-lg transition-shadow ${isBonus ? 'border-2 border-brand-magenta/30 bg-gradient-to-br from-background to-brand-pink/5' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isBonus ? (
                <Badge className="mb-2 bg-brand-magenta">
                  ⭐ Bônus
                </Badge>
              ) : (
                <Badge variant="secondary" className="mb-2">
                  Semana {module.order_index}
                </Badge>
              )}
            </div>
            {progress === 100 && (
              <Badge className="bg-green-600">Completo</Badge>
            )}
          </div>
          <CardTitle className={`${isBonus ? 'text-brand-magenta' : 'text-brand-blue'}`}>{module.title}</CardTitle>
          <CardDescription className="line-clamp-2">{module.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-brand-blue">
                {completedContents}/{totalContents} completos
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button 
            className={`w-full ${isBonus ? 'bg-brand-magenta hover:bg-brand-magenta/90' : ''}`}
            variant="default"
            onClick={() => navigate(`/library/${module.id}`)}
          >
            Ver conteúdos
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}