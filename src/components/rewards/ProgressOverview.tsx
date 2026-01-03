import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGamification, LEVELS } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Target, Calendar } from "lucide-react";

interface ProgressOverviewProps {
  userId: string;
}

export function ProgressOverview({ userId }: ProgressOverviewProps) {
  const { totalXP, achievements, loading, getCurrentLevel, getNextLevel, getXPProgress } = useGamification(userId);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progress = getXPProgress();
  const xpToNext = nextLevel ? nextLevel.minXP - totalXP : 0;

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <Card className="bg-gradient-to-br from-brand-blue/10 to-brand-magenta/10 border-brand-blue/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentLevel.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">Nível {currentLevel.level}</p>
                <h2 className="text-2xl font-bold text-brand-blue">{currentLevel.name}</h2>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-brand-magenta/10 text-brand-magenta">
              <Star className="w-4 h-4 mr-1" />
              {totalXP} XP
            </Badge>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentLevel.minXP} XP</span>
              {nextLevel ? (
                <span>{xpToNext} XP para {nextLevel.name}</span>
              ) : (
                <span>Nível máximo alcançado!</span>
              )}
              <span>{nextLevel?.minXP || currentLevel.minXP} XP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-brand-magenta" />
            <p className="text-2xl font-bold text-brand-blue">{achievements.length}</p>
            <p className="text-sm text-muted-foreground">Conquistas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-brand-blue">{totalXP}</p>
            <p className="text-sm text-muted-foreground">XP Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-brand-blue">{currentLevel.level}</p>
            <p className="text-sm text-muted-foreground">Nível Atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-brand-blue">{LEVELS.length - currentLevel.level}</p>
            <p className="text-sm text-muted-foreground">Níveis Restantes</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Jornada de Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {LEVELS.map((level) => (
              <div
                key={level.level}
                className={`flex flex-col items-center min-w-[80px] p-3 rounded-lg transition-all ${
                  level.level === currentLevel.level
                    ? "bg-brand-magenta/20 border-2 border-brand-magenta"
                    : level.level < currentLevel.level
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-muted/50"
                }`}
              >
                <span className="text-2xl">{level.icon}</span>
                <span className={`text-xs font-medium mt-1 ${
                  level.level <= currentLevel.level ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {level.name}
                </span>
                <span className="text-xs text-muted-foreground">{level.minXP} XP</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
