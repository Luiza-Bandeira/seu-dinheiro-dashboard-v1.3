import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { Achievement } from "@/hooks/useGamification";
import { motion } from "framer-motion";

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
}

export function AchievementCard({ achievement, unlocked, unlockedAt }: AchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        unlocked 
          ? "bg-gradient-to-br from-brand-blue/5 to-brand-magenta/5 border-brand-magenta/30 hover:shadow-lg" 
          : "bg-muted/30 opacity-60"
      }`}>
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        <CardContent className="pt-6 text-center">
          <span className="text-4xl block mb-3">{achievement.icon}</span>
          
          <h3 className={`font-semibold mb-1 ${unlocked ? "text-brand-blue" : "text-muted-foreground"}`}>
            {achievement.name}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-3">
            {achievement.description}
          </p>
          
          <Badge 
            variant={unlocked ? "default" : "outline"} 
            className={unlocked ? "bg-brand-magenta" : ""}
          >
            +{achievement.xp} XP
          </Badge>
          
          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Desbloqueado em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
