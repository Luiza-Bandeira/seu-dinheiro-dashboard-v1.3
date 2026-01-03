import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "biblioteca" | "ferramentas" | "engajamento";
  xp: number;
}

export interface Level {
  level: number;
  name: string;
  minXP: number;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Biblioteca
  { key: "first_video", name: "Primeiro Passo", description: "Assistir primeiro vídeo", icon: "🎬", category: "biblioteca", xp: 20 },
  { key: "videos_10", name: "Estudioso", description: "Assistir 10 vídeos", icon: "📚", category: "biblioteca", xp: 100 },
  { key: "videos_50", name: "Maratonista", description: "Assistir 50 vídeos", icon: "🏃", category: "biblioteca", xp: 300 },
  { key: "first_module", name: "Módulo Concluído", description: "Completar 1 módulo", icon: "🎓", category: "biblioteca", xp: 100 },
  { key: "all_modules", name: "Formando", description: "Completar todos os módulos", icon: "🏆", category: "biblioteca", xp: 500 },
  
  // Ferramentas
  { key: "first_bank", name: "Organizado", description: "Cadastrar banco ou cartão", icon: "🏦", category: "ferramentas", xp: 50 },
  { key: "first_goal", name: "Planejador", description: "Criar primeiro objetivo", icon: "🎯", category: "ferramentas", xp: 50 },
  { key: "full_control", name: "Controle Total", description: "Ter objetivo + orçamento + redução", icon: "📊", category: "ferramentas", xp: 150 },
  { key: "first_investment", name: "Investidor", description: "Cadastrar investimentos", icon: "💰", category: "ferramentas", xp: 50 },
  { key: "batch_import", name: "Importador Pro", description: "Usar lançamento em lote", icon: "📥", category: "ferramentas", xp: 40 },
  
  // Engajamento
  { key: "welcome", name: "Boas-vindas", description: "Primeiro login", icon: "👋", category: "engajamento", xp: 10 },
  { key: "streak_7", name: "Frequente", description: "7 dias consecutivos", icon: "🔥", category: "engajamento", xp: 100 },
  { key: "streak_30", name: "Comprometido", description: "30 dias consecutivos", icon: "⭐", category: "engajamento", xp: 500 },
  { key: "profile_complete", name: "Perfil Completo", description: "Preencher todos os dados", icon: "✅", category: "engajamento", xp: 50 },
];

export const LEVELS: Level[] = [
  { level: 1, name: "Iniciante", minXP: 0, icon: "🥉" },
  { level: 2, name: "Aprendiz", minXP: 200, icon: "🥉" },
  { level: 3, name: "Praticante", minXP: 500, icon: "🥈" },
  { level: 4, name: "Dedicado", minXP: 1000, icon: "🥈" },
  { level: 5, name: "Expert", minXP: 2000, icon: "🥇" },
  { level: 6, name: "Mestre", minXP: 4000, icon: "🥇" },
  { level: 7, name: "Lenda Financeira", minXP: 8000, icon: "💎" },
];

export const ACTION_POINTS: Record<string, { points: number; description: string }> = {
  video_watched: { points: 20, description: "Assistiu vídeo" },
  exercise_completed: { points: 30, description: "Completou exercício" },
  module_completed: { points: 100, description: "Completou módulo" },
  daily_login: { points: 10, description: "Login diário" },
  profile_updated: { points: 20, description: "Atualizou perfil" },
  first_transaction: { points: 30, description: "Primeiro lançamento" },
  batch_import: { points: 40, description: "Lançamento em lote" },
};

export function useGamification(userId: string | undefined) {
  const [totalXP, setTotalXP] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Load total points
      const { data: pointsData } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", userId);
      
      const total = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;
      setTotalXP(total);

      // Load achievements
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("achievement_key")
        .eq("user_id", userId);
      
      setAchievements(achievementsData?.map(a => a.achievement_key) || []);
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentLevel = useCallback(() => {
    const sorted = [...LEVELS].sort((a, b) => b.minXP - a.minXP);
    return sorted.find(l => totalXP >= l.minXP) || LEVELS[0];
  }, [totalXP]);

  const getNextLevel = useCallback(() => {
    const current = getCurrentLevel();
    return LEVELS.find(l => l.level === current.level + 1);
  }, [getCurrentLevel]);

  const getXPProgress = useCallback(() => {
    const current = getCurrentLevel();
    const next = getNextLevel();
    if (!next) return 100;
    
    const xpIntoLevel = totalXP - current.minXP;
    const xpNeeded = next.minXP - current.minXP;
    return Math.min(100, (xpIntoLevel / xpNeeded) * 100);
  }, [totalXP, getCurrentLevel, getNextLevel]);

  const awardPoints = useCallback(async (actionType: string, customDescription?: string) => {
    if (!userId) return false;
    
    const action = ACTION_POINTS[actionType];
    if (!action) return false;

    try {
      const { error } = await supabase.from("user_points").insert({
        user_id: userId,
        action_type: actionType,
        points: action.points,
        description: customDescription || action.description,
      });

      if (error) throw error;
      
      setTotalXP(prev => prev + action.points);
      toast.success(`+${action.points} XP!`, { description: action.description });
      return true;
    } catch (error) {
      console.error("Error awarding points:", error);
      return false;
    }
  }, [userId]);

  const unlockAchievement = useCallback(async (achievementKey: string) => {
    if (!userId || achievements.includes(achievementKey)) return false;
    
    const achievement = ACHIEVEMENTS.find(a => a.key === achievementKey);
    if (!achievement) return false;

    try {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_key: achievementKey,
      });

      if (error) {
        if (error.code === "23505") return false; // Already exists
        throw error;
      }

      // Award XP for achievement
      await supabase.from("user_points").insert({
        user_id: userId,
        action_type: `achievement_${achievementKey}`,
        points: achievement.xp,
        description: `Conquista: ${achievement.name}`,
      });

      setAchievements(prev => [...prev, achievementKey]);
      setTotalXP(prev => prev + achievement.xp);
      
      toast.success("🏆 Nova Conquista!", {
        description: `${achievement.icon} ${achievement.name} (+${achievement.xp} XP)`,
      });
      
      return true;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return false;
    }
  }, [userId, achievements]);

  const hasAchievement = useCallback((key: string) => {
    return achievements.includes(key);
  }, [achievements]);

  return {
    totalXP,
    achievements,
    loading,
    getCurrentLevel,
    getNextLevel,
    getXPProgress,
    awardPoints,
    unlockAchievement,
    hasAchievement,
    refresh: loadData,
  };
}
