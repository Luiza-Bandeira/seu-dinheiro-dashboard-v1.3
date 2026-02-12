import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Home, Car, Smartphone, Gem, Package } from "lucide-react";
import { motion } from "framer-motion";

interface PatrimonyAssetsProps {
  userId: string;
}

interface PatrimonyAsset {
  id: string;
  name: string;
  category: string;
  estimated_value: number;
  acquisition_date: string | null;
  notes: string | null;
}

const CATEGORIES = [
  { value: "imovel", label: "Imóvel", icon: Home },
  { value: "veiculo", label: "Veículo", icon: Car },
  { value: "eletronico", label: "Eletrônico", icon: Smartphone },
  { value: "joia", label: "Joia / Luxo", icon: Gem },
  { value: "other", label: "Outro", icon: Package },
];

export function PatrimonyAssets({ userId }: PatrimonyAssetsProps) {
  const [assets, setAssets] = useState<PatrimonyAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PatrimonyAsset | null>(null);
  const [newAsset, setNewAsset] = useState({
    name: "",
    category: "other",
    estimated_value: 0,
    acquisition_date: "",
    notes: "",
  });

  useEffect(() => {
    loadAssets();
  }, [userId]);

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from("patrimony_assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setAssets(data);
  };

  const handleAdd = async () => {
    if (loading) return;
    if (!newAsset.name || newAsset.estimated_value <= 0) {
      toast({ title: "Erro", description: "Preencha o nome e o valor estimado", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("patrimony_assets").insert({
      user_id: userId,
      name: newAsset.name,
      category: newAsset.category,
      estimated_value: newAsset.estimated_value,
      acquisition_date: newAsset.acquisition_date || null,
      notes: newAsset.notes || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bem adicionado!", description: "Seu patrimônio foi registrado." });
      setNewAsset({ name: "", category: "other", estimated_value: 0, acquisition_date: "", notes: "" });
      await loadAssets();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editingAsset || loading) return;
    setLoading(true);
    const { error } = await supabase
      .from("patrimony_assets")
      .update({
        name: editingAsset.name,
        category: editingAsset.category,
        estimated_value: editingAsset.estimated_value,
        acquisition_date: editingAsset.acquisition_date,
        notes: editingAsset.notes,
      })
      .eq("id", editingAsset.id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Bem patrimonial atualizado." });
      setEditingAsset(null);
      await loadAssets();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("patrimony_assets").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deletado!", description: "Bem removido." });
      await loadAssets();
    }
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES[4];
  const totalPatrimony = assets.reduce((sum, a) => sum + Number(a.estimated_value), 0);

  return (
    <>
      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Bem Patrimonial
            </DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Bem</Label>
                <Input
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={editingAsset.category} onValueChange={(v) => setEditingAsset({ ...editingAsset, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={editingAsset.estimated_value || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, estimated_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={editingAsset.acquisition_date || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, acquisition_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={editingAsset.notes || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAsset(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={loading}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-blue">Adicionar Bem</CardTitle>
              <CardDescription>Registre seus bens patrimoniais (casa, carro, etc.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Bem</Label>
                <Input
                  placeholder="Ex: Apartamento, Carro, Moto"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newAsset.category} onValueChange={(v) => setNewAsset({ ...newAsset, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={newAsset.estimated_value || ""}
                  onChange={(e) => setNewAsset({ ...newAsset, estimated_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={newAsset.acquisition_date}
                  onChange={(e) => setNewAsset({ ...newAsset, acquisition_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  placeholder="Detalhes adicionais"
                  value={newAsset.notes}
                  onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleAdd} disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Bem
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-blue">Meus Bens</CardTitle>
              <CardDescription>
                Total: R$ {totalPatrimony.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum bem registrado ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => {
                    const cat = getCategoryInfo(asset.category);
                    const Icon = cat.icon;
                    return (
                      <div key={asset.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{cat.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            R$ {Number(asset.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAsset(asset)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(asset.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
