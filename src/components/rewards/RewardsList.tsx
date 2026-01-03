import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RewardCard } from "./RewardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Star, Clock, CheckCircle } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

interface RewardsListProps {
  userId: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  stock: number;
}

interface Claim {
  id: string;
  reward_id: string;
  claimed_at: string;
  status: string;
  rewards: Reward;
}

export function RewardsList({ userId }: RewardsListProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { totalXP, refresh } = useGamification(userId);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [rewardsRes, claimsRes] = await Promise.all([
        supabase
          .from("rewards")
          .select("*")
          .eq("is_active", true)
          .order("points_required", { ascending: true }),
        supabase
          .from("user_reward_claims")
          .select("*, rewards(*)")
          .eq("user_id", userId)
          .order("claimed_at", { ascending: false }),
      ]);

      setRewards(rewardsRes.data || []);
      setClaims(claimsRes.data as Claim[] || []);
    } catch (error) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || totalXP < reward.points_required) return;

    setClaiming(rewardId);
    try {
      const { error } = await supabase.from("user_reward_claims").insert({
        user_id: userId,
        reward_id: rewardId,
      });

      if (error) throw error;

      toast.success("🎁 Brinde resgatado!", {
        description: `Você resgatou: ${reward.name}. Aguarde a confirmação.`,
      });

      // Deduct points
      await supabase.from("user_points").insert({
        user_id: userId,
        action_type: "reward_claimed",
        points: -reward.points_required,
        description: `Resgate: ${reward.name}`,
      });

      loadData();
      refresh();
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Erro ao resgatar brinde");
    } finally {
      setClaiming(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Aprovado</Badge>;
      case "delivered":
        return <Badge variant="default" className="bg-brand-blue"><Gift className="w-3 h-3 mr-1" /> Entregue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Points Header */}
      <Card className="bg-gradient-to-r from-brand-blue/10 to-brand-magenta/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Seus pontos disponíveis</p>
              <p className="text-3xl font-bold text-brand-blue flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                {totalXP}
              </p>
            </div>
            <Gift className="w-12 h-12 text-brand-magenta/50" />
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <div>
        <h2 className="text-xl font-bold text-brand-blue mb-4">Brindes Disponíveis</h2>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum brinde disponível no momento.</p>
              <p className="text-sm text-muted-foreground">Volte em breve!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map(reward => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={totalXP}
                onClaim={handleClaim}
                claiming={claiming === reward.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Claims History */}
      {claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Seus Resgates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claims.map(claim => (
                <div 
                  key={claim.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{claim.rewards?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Resgatado em {new Date(claim.claimed_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {getStatusBadge(claim.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
