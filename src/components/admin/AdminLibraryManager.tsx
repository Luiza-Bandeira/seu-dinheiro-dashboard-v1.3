import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, Plus, Edit2, Trash2, ChevronDown, ChevronRight, 
  Video, FileText, ClipboardList, CheckSquare, Star,
  ArrowUp, ArrowDown, X
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface Content {
  id: string;
  title: string;
  description: string | null;
  type: ContentType;
  url: string | null;
  order_index: number;
  module_id: string | null;
}

interface PendingContent {
  tempId: string;
  id?: string;
  title: string;
  description: string;
  type: ContentType;
  url: string;
  isNew: boolean;
  toDelete?: boolean;
}

const contentTypeIcons: Record<ContentType, typeof Video> = {
  video: Video,
  pdf: FileText,
  exercise: ClipboardList,
  checklist: CheckSquare,
  extra: Star,
};

const contentTypeLabels: Record<ContentType, string> = {
  video: "Vídeo",
  pdf: "PDF",
  exercise: "Exercício",
  checklist: "Checklist",
  extra: "Extra",
};

export function AdminLibraryManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Module form state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [pendingContents, setPendingContents] = useState<PendingContent[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [modulesRes, contentsRes] = await Promise.all([
      supabase.from("modules").select("*").order("order_index"),
      supabase.from("contents").select("*").order("order_index"),
    ]);

    if (modulesRes.data) setModules(modulesRes.data);
    if (contentsRes.data) setContents(contentsRes.data as Content[]);
    setLoading(false);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Module CRUD
  const openModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleTitle(module.title);
      setModuleDescription(module.description || "");
      // Load existing contents for this module
      const moduleContents = contents
        .filter((c) => c.module_id === module.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((c) => ({
          tempId: c.id,
          id: c.id,
          title: c.title,
          description: c.description || "",
          type: c.type,
          url: c.url || "",
          isNew: false,
        }));
      setPendingContents(moduleContents);
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleDescription("");
      setPendingContents([]);
    }
    setModuleDialogOpen(true);
  };

  const addPendingContent = () => {
    setPendingContents((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        title: "",
        description: "",
        type: "video",
        url: "",
        isNew: true,
      },
    ]);
  };

  const updatePendingContent = (tempId: string, field: keyof PendingContent, value: string) => {
    setPendingContents((prev) =>
      prev.map((c) =>
        c.tempId === tempId ? { ...c, [field]: value } : c
      )
    );
  };

  const removePendingContent = (tempId: string) => {
    setPendingContents((prev) => {
      const content = prev.find((c) => c.tempId === tempId);
      if (content && !content.isNew && content.id) {
        // Mark existing content for deletion
        return prev.map((c) =>
          c.tempId === tempId ? { ...c, toDelete: true } : c
        );
      }
      // Remove new content immediately
      return prev.filter((c) => c.tempId !== tempId);
    });
  };

  const movePendingContent = (index: number, direction: "up" | "down") => {
    const visibleContents = pendingContents.filter((c) => !c.toDelete);
    const visibleIndex = visibleContents.findIndex((_, i) => {
      let count = 0;
      for (let j = 0; j <= i; j++) {
        if (!pendingContents[j]?.toDelete) count++;
      }
      return count - 1 === index;
    });

    if (direction === "up" && visibleIndex === 0) return;
    if (direction === "down" && visibleIndex === visibleContents.length - 1) return;

    setPendingContents((prev) => {
      const visible = prev.filter((c) => !c.toDelete);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      const newVisible = [...visible];
      [newVisible[index], newVisible[swapIndex]] = [newVisible[swapIndex], newVisible[index]];
      
      // Reconstruct with deleted items
      const deleted = prev.filter((c) => c.toDelete);
      return [...newVisible, ...deleted];
    });
  };

  const saveModule = async () => {
    if (!moduleTitle.trim()) {
      toast({ title: "Erro", description: "Título do módulo é obrigatório", variant: "destructive" });
      return;
    }

    // Validate pending contents
    const validContents = pendingContents.filter((c) => !c.toDelete);
    for (const content of validContents) {
      if (!content.title.trim()) {
        toast({ title: "Erro", description: "Todos os conteúdos precisam de título", variant: "destructive" });
        return;
      }
    }

    setSaving(true);

    try {
      let moduleId = editingModule?.id;

      // Create or update module
      if (editingModule) {
        const { error } = await supabase
          .from("modules")
          .update({ title: moduleTitle, description: moduleDescription || null })
          .eq("id", editingModule.id);
        if (error) throw error;
      } else {
        const newOrderIndex = modules.length > 0 ? Math.max(...modules.map((m) => m.order_index)) + 1 : 1;
        const { data, error } = await supabase
          .from("modules")
          .insert({
            title: moduleTitle,
            description: moduleDescription || null,
            order_index: newOrderIndex,
          })
          .select()
          .single();
        if (error) throw error;
        moduleId = data.id;
      }

      // Handle contents
      const toDelete = pendingContents.filter((c) => c.toDelete && c.id);
      const toUpdate = pendingContents.filter((c) => !c.toDelete && !c.isNew && c.id);
      const toCreate = pendingContents.filter((c) => !c.toDelete && c.isNew);

      // Delete removed contents
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("contents")
          .delete()
          .in("id", toDelete.map((c) => c.id!));
        if (error) throw error;
      }

      // Update existing contents
      for (let i = 0; i < toUpdate.length; i++) {
        const content = toUpdate[i];
        const visibleIndex = pendingContents.filter((c) => !c.toDelete).findIndex((c) => c.tempId === content.tempId);
        const { error } = await supabase
          .from("contents")
          .update({
            title: content.title,
            description: content.description || null,
            type: content.type,
            url: content.url || null,
            order_index: visibleIndex + 1,
          })
          .eq("id", content.id!);
        if (error) throw error;
      }

      // Create new contents
      if (toCreate.length > 0 && moduleId) {
        const existingCount = toUpdate.length;
        const newContents = toCreate.map((content, i) => ({
          title: content.title,
          description: content.description || null,
          type: content.type,
          url: content.url || null,
          module_id: moduleId,
          order_index: existingCount + i + 1,
        }));
        const { error } = await supabase.from("contents").insert(newContents);
        if (error) throw error;
      }

      toast({ title: editingModule ? "Módulo atualizado!" : "Módulo criado!" });
      setModuleDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Excluir este módulo e todos os seus conteúdos?")) return;

    try {
      const { error: contentError } = await supabase
        .from("contents")
        .delete()
        .eq("module_id", moduleId);
      if (contentError) throw contentError;

      const { error } = await supabase.from("modules").delete().eq("id", moduleId);
      if (error) throw error;

      toast({ title: "Módulo excluído!" });
      loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const moveModule = async (moduleId: string, direction: "up" | "down") => {
    const index = modules.findIndex((m) => m.id === moduleId);
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === modules.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const currentModule = modules[index];
    const swapModule = modules[swapIndex];

    try {
      await Promise.all([
        supabase.from("modules").update({ order_index: swapModule.order_index }).eq("id", currentModule.id),
        supabase.from("modules").update({ order_index: currentModule.order_index }).eq("id", swapModule.id),
      ]);
      loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const visiblePendingContents = pendingContents.filter((c) => !c.toDelete);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-blue flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Gerenciar Biblioteca
          </h3>
          <p className="text-sm text-muted-foreground">
            {modules.length} módulos • {contents.length} conteúdos
          </p>
        </div>
        <Button onClick={() => openModuleDialog()} className="bg-brand-magenta hover:bg-brand-magenta/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        <AnimatePresence>
          {modules.map((module, moduleIndex) => {
            const moduleContents = contents.filter((c) => c.module_id === module.id).sort((a, b) => a.order_index - b.order_index);
            const isExpanded = expandedModules.includes(module.id);

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-2 hover:border-brand-blue/30 transition-colors">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleModule(module.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <span className="text-brand-blue">#{moduleIndex + 1}</span>
                                {module.title}
                              </CardTitle>
                              {module.description && (
                                <CardDescription className="mt-1">{module.description}</CardDescription>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Badge variant="secondary">{moduleContents.length} itens</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveModule(module.id, "up")}
                              disabled={moduleIndex === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveModule(module.id, "down")}
                              disabled={moduleIndex === modules.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openModuleDialog(module)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteModule(module.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-3">
                        {moduleContents.map((content) => {
                          const Icon = contentTypeIcons[content.type];
                          return (
                            <div
                              key={content.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-brand-magenta" />
                                <div>
                                  <div className="font-medium text-sm">{content.title}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {contentTypeLabels[content.type]}
                                    </Badge>
                                    {content.url && <span className="truncate max-w-[200px]">{content.url}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {moduleContents.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Nenhum conteúdo neste módulo
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                          onClick={() => openModuleDialog(module)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar Módulo e Conteúdos
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {modules.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum módulo cadastrado.</p>
              <Button
                onClick={() => openModuleDialog()}
                className="mt-4 bg-brand-magenta hover:bg-brand-magenta/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Módulo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Module Dialog with Contents */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Atualize as informações do módulo e seus conteúdos" : "Crie um novo módulo com vídeos, PDFs e outros recursos"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Module Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Módulo *</Label>
                  <Input
                    placeholder="Ex: Introdução às Finanças"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Descrição do módulo..."
                    value={moduleDescription}
                    onChange={(e) => setModuleDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Contents Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Conteúdos do Módulo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPendingContent}
                    className="border-brand-magenta text-brand-magenta hover:bg-brand-magenta/10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <AnimatePresence>
                  {visiblePendingContents.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground text-sm">
                        Nenhum conteúdo adicionado ainda.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addPendingContent}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar primeiro conteúdo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visiblePendingContents.map((content, index) => {
                        const Icon = contentTypeIcons[content.type];
                        return (
                          <motion.div
                            key={content.tempId}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 border rounded-lg bg-muted/30 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-brand-magenta" />
                                <span className="text-sm font-medium text-muted-foreground">
                                  Conteúdo #{index + 1}
                                </span>
                                {content.isNew && (
                                  <Badge variant="secondary" className="text-xs">Novo</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => movePendingContent(index, "up")}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => movePendingContent(index, "down")}
                                  disabled={index === visiblePendingContents.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removePendingContent(content.tempId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Tipo</Label>
                                <Select
                                  value={content.type}
                                  onValueChange={(v) => updatePendingContent(content.tempId, "type", v)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(Object.keys(contentTypeLabels) as ContentType[]).map((type) => {
                                      const TypeIcon = contentTypeIcons[type];
                                      return (
                                        <SelectItem key={type} value={type}>
                                          <div className="flex items-center gap-2">
                                            <TypeIcon className="h-4 w-4" />
                                            {contentTypeLabels[type]}
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Título *</Label>
                                <Input
                                  placeholder="Ex: Vídeo de Boas-Vindas"
                                  value={content.title}
                                  onChange={(e) => updatePendingContent(content.tempId, "title", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">URL do Recurso</Label>
                              <Input
                                placeholder="https://youtube.com/... ou https://drive.google.com/..."
                                value={content.url}
                                onChange={(e) => updatePendingContent(content.tempId, "url", e.target.value)}
                                className="h-9"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Descrição (opcional)</Label>
                              <Input
                                placeholder="Breve descrição do conteúdo"
                                value={content.description}
                                onChange={(e) => updatePendingContent(content.tempId, "description", e.target.value)}
                                className="h-9"
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={saveModule} 
              className="bg-brand-magenta hover:bg-brand-magenta/90"
              disabled={saving}
            >
              {saving ? "Salvando..." : editingModule ? "Salvar Alterações" : "Criar Módulo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
