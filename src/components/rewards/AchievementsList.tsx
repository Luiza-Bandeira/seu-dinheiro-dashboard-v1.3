import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACHIEVEMENTS, Achievement } from "@/hooks/useGamification";
import { AchievementCard } from "./AchievementCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Wrench, Heart } from "lucide-react";

interface AchievementsListProps {
  userId: string;
}

interface UnlockedAchievement {
  achievement_key: string;
  unlocked_at: string;
}

export function AchievementsList({ userId }: AchievementsListProps) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_key, unlocked_at")
        .eq("user_id", userId);
      
      setUnlockedAchievements(data || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementsByCategory = (category: Achievement["category"]) => {
    return ACHIEVEMENTS.filter(a => a.category === category);
  };

  const isUnlocked = (key: string) => {
    return unlockedAchievements.some(a => a.achievement_key === key);
  };

  const getUnlockedAt = (key: string) => {
    return unlockedAchievements.find(a => a.achievement_key === key)?.unlocked_at;
  };

  const categories = [
    { key: "biblioteca", label: "Biblioteca", icon: BookOpen },
    { key: "ferramentas", label: "Ferramentas", icon: Wrench },
    { key: "engajamento", label: "Engajamento", icon: Heart },
  ] as const;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-blue">Suas Conquistas</h2>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} de {totalCount} desbloqueadas
          </p>
        </div>
      </div>

      <Tabs defaultValue="biblioteca" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {categories.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key} className="flex items-center gap-2">
              <cat.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.key} value={cat.key} className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getAchievementsByCategory(cat.key).map(achievement => (
                <AchievementCard
                  key={achievement.key}
                  achievement={achievement}
                  unlocked={isUnlocked(achievement.key)}
                  unlockedAt={getUnlockedAt(achievement.key)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
