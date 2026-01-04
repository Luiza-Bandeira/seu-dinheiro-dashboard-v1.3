import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Gift, Coins, Package } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  stock: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface Claim {
  id: string;
  user_id: string;
  reward_id: string | null;
  claimed_at: string | null;
  status: string | null;
  rewards?: { name: string } | null;
  user_email?: string;
  user_name?: string;
}

export function AdminRewardsManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState(100);
  const [stock, setStock] = useState(-1);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [rewardsRes, claimsRes, profilesRes] = await Promise.all([
      supabase.from("rewards").select("*").order("created_at", { ascending: false }),
      supabase
        .from("user_reward_claims")
        .select("*, rewards(name)")
        .order("claimed_at", { ascending: false })
        .limit(50),
      supabase.from("profiles").select("id, email, full_name"),
    ]);

    if (rewardsRes.data) setRewards(rewardsRes.data);
    
    if (claimsRes.data && profilesRes.data) {
      const profilesMap = new Map(profilesRes.data.map(p => [p.id, p]));
      const enrichedClaims: Claim[] = claimsRes.data.map(claim => {
        const profile = profilesMap.get(claim.user_id);
        return {
          ...claim,
          user_email: profile?.email || "Email não encontrado",
          user_name: profile?.full_name || "Sem nome",
        };
      });
      setClaims(enrichedClaims);
    }

    setLoading(false);
  };

    setLoading(false);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPointsRequired(100);
    setStock(-1);
    setImageUrl("");
    setEditingReward(null);
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setName(reward.name);
    setDescription(reward.description || "");
    setPointsRequired(reward.points_required);
    setStock(reward.stock ?? -1);
    setImageUrl(reward.image_url || "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    const rewardData = {
      name: name.trim(),
      description: description.trim() || null,
      points_required: pointsRequired,
      stock: stock,
      image_url: imageUrl.trim() || null,
    };

    if (editingReward) {
      const { error } = await supabase
        .from("rewards")
        .update(rewardData)
        .eq("id", editingReward.id);

      if (error) {
        toast({ title: "Erro", description: "Erro ao atualizar brinde", variant: "destructive" });
        return;
      }
      toast({ title: "Sucesso", description: "Brinde atualizado com sucesso!" });
    } else {
      const { error } = await supabase.from("rewards").insert(rewardData);

      if (error) {
        toast({ title: "Erro", description: "Erro ao criar brinde", variant: "destructive" });
        return;
      }
      toast({ title: "Sucesso", description: "Brinde criado com sucesso!" });
    }

    setIsDialogOpen(false);
    resetForm();
    loadData();
  };

  const toggleActive = async (reward: Reward) => {
    const { error } = await supabase
      .from("rewards")
      .update({ is_active: !reward.is_active })
      .eq("id", reward.id);

    if (error) {
      toast({ title: "Erro", description: "Erro ao atualizar status", variant: "destructive" });
      return;
    }

    loadData();
  };

  const updateClaimStatus = async (claimId: string, newStatus: string) => {
    const { error } = await supabase
      .from("user_reward_claims")
      .update({ status: newStatus })
      .eq("id", claimId);

    if (error) {
      toast({ title: "Erro", description: "Erro ao atualizar status", variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Status atualizado!" });
    loadData();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case "approved":
        return <Badge className="bg-blue-500">Aprovado</Badge>;
      case "delivered":
        return <Badge className="bg-green-500">Entregue</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Carregando brindes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-brand-blue flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gerenciar Brindes
          </h3>
          <p className="text-muted-foreground text-sm">Cadastre e gerencie os brindes disponíveis para resgate</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Brinde
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReward ? "Editar Brinde" : "Novo Brinde"}</DialogTitle>
              <DialogDescription>
                Preencha as informações do brinde
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Caneca personalizada"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do brinde..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Pontos Necessários</Label>
                  <Input
                    id="points"
                    type="number"
                    min={1}
                    value={pointsRequired}
                    onChange={(e) => setPointsRequired(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Estoque (-1 = ilimitado)</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={-1}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image">URL da Imagem</Label>
                <Input
                  id="image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingReward ? "Salvar Alterações" : "Criar Brinde"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de brindes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className={`${!reward.is_active ? "opacity-60" : ""}`}>
            <CardContent className="pt-4">
              {reward.image_url && (
                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={reward.image_url}
                    alt={reward.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <h4 className="font-semibold text-lg">{reward.name}</h4>
              {reward.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reward.description}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Badge className="bg-primary gap-1">
                  <Coins className="h-3 w-3" />
                  {reward.points_required} pts
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  {reward.stock === -1 ? "Ilimitado" : `${reward.stock} restantes`}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={reward.is_active ?? false}
                    onCheckedChange={() => toggleActive(reward)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {reward.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(reward)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rewards.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum brinde cadastrado. Clique em "Novo Brinde" para adicionar.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico de resgates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Histórico de Resgates</CardTitle>
          <CardDescription>Acompanhe e gerencie os pedidos de resgate dos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          {claims.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Brinde</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.user_name}</div>
                        <div className="text-sm text-muted-foreground">{claim.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{claim.rewards?.name || "Brinde removido"}</TableCell>
                    <TableCell>
                      {claim.claimed_at
                        ? new Date(claim.claimed_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={claim.status || "pending"}
                        onValueChange={(value) => updateClaimStatus(claim.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum resgate realizado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
