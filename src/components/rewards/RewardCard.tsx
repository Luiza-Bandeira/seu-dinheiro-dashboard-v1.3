import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Lock, Star } from "lucide-react";
import { motion } from "framer-motion";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  stock: number;
}

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onClaim: (rewardId: string) => void;
  claiming?: boolean;
}

export function RewardCard({ reward, userPoints, onClaim, claiming }: RewardCardProps) {
  const canClaim = userPoints >= reward.points_required && (reward.stock === -1 || reward.stock > 0);
  const outOfStock = reward.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${
        canClaim 
          ? "hover:shadow-lg hover:border-brand-magenta/50" 
          : "opacity-70"
      }`}>
        <div className="aspect-video bg-gradient-to-br from-brand-blue/20 to-brand-magenta/20 flex items-center justify-center">
          {reward.image_url ? (
            <img 
              src={reward.image_url} 
              alt={reward.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <Gift className="w-16 h-16 text-brand-magenta/50" />
          )}
        </div>

        <CardContent className="pt-4">
          <h3 className="font-semibold text-brand-blue mb-1">{reward.name}</h3>
          {reward.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {reward.points_required} pontos
            </Badge>
            
            {outOfStock && (
              <Badge variant="destructive">Esgotado</Badge>
            )}
            
            {reward.stock > 0 && reward.stock <= 10 && (
              <Badge variant="secondary">Restam {reward.stock}</Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button 
            className="w-full" 
            disabled={!canClaim || claiming}
            onClick={() => onClaim(reward.id)}
          >
            {claiming ? (
              "Resgatando..."
            ) : outOfStock ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Esgotado
              </>
            ) : !canClaim ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Faltam {reward.points_required - userPoints} pontos
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Resgatar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
