import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Plus, Edit2, Trash2, ChevronDown, ChevronRight, 
  Video, FileText, ClipboardList, CheckSquare, Star,
  GripVertical, ArrowUp, ArrowDown
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

  // Module form state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");

  // Content form state
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [contentModuleId, setContentModuleId] = useState<string>("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentType, setContentType] = useState<ContentType>("video");
  const [contentUrl, setContentUrl] = useState("");

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
    } else {
      setEditingModule(null);
      setModuleTitle("");
      setModuleDescription("");
    }
    setModuleDialogOpen(true);
  };

  const saveModule = async () => {
    if (!moduleTitle.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingModule) {
        const { error } = await supabase
          .from("modules")
          .update({ title: moduleTitle, description: moduleDescription || null })
          .eq("id", editingModule.id);
        if (error) throw error;
        toast({ title: "Módulo atualizado!" });
      } else {
        const newOrderIndex = modules.length > 0 ? Math.max(...modules.map((m) => m.order_index)) + 1 : 1;
        const { error } = await supabase.from("modules").insert({
          title: moduleTitle,
          description: moduleDescription || null,
          order_index: newOrderIndex,
        });
        if (error) throw error;
        toast({ title: "Módulo criado!" });
      }
      setModuleDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
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

  // Content CRUD
  const openContentDialog = (moduleId: string, content?: Content) => {
    setContentModuleId(moduleId);
    if (content) {
      setEditingContent(content);
      setContentTitle(content.title);
      setContentDescription(content.description || "");
      setContentType(content.type);
      setContentUrl(content.url || "");
    } else {
      setEditingContent(null);
      setContentTitle("");
      setContentDescription("");
      setContentType("video");
      setContentUrl("");
    }
    setContentDialogOpen(true);
  };

  const saveContent = async () => {
    if (!contentTitle.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingContent) {
        const { error } = await supabase
          .from("contents")
          .update({
            title: contentTitle,
            description: contentDescription || null,
            type: contentType,
            url: contentUrl || null,
          })
          .eq("id", editingContent.id);
        if (error) throw error;
        toast({ title: "Conteúdo atualizado!" });
      } else {
        const moduleContents = contents.filter((c) => c.module_id === contentModuleId);
        const newOrderIndex = moduleContents.length > 0 ? Math.max(...moduleContents.map((c) => c.order_index)) + 1 : 1;

        const { error } = await supabase.from("contents").insert({
          title: contentTitle,
          description: contentDescription || null,
          type: contentType,
          url: contentUrl || null,
          module_id: contentModuleId,
          order_index: newOrderIndex,
        });
        if (error) throw error;
        toast({ title: "Conteúdo criado!" });
      }
      setContentDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!confirm("Excluir este conteúdo?")) return;

    try {
      const { error } = await supabase.from("contents").delete().eq("id", contentId);
      if (error) throw error;
      toast({ title: "Conteúdo excluído!" });
      loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const moveContent = async (contentId: string, moduleId: string, direction: "up" | "down") => {
    const moduleContents = contents.filter((c) => c.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
    const index = moduleContents.findIndex((c) => c.id === contentId);

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === moduleContents.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const currentContent = moduleContents[index];
    const swapContent = moduleContents[swapIndex];

    try {
      await Promise.all([
        supabase.from("contents").update({ order_index: swapContent.order_index }).eq("id", currentContent.id),
        supabase.from("contents").update({ order_index: currentContent.order_index }).eq("id", swapContent.id),
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
                        {moduleContents.map((content, contentIndex) => {
                          const Icon = contentTypeIcons[content.type];
                          return (
                            <div
                              key={content.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
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
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => moveContent(content.id, module.id, "up")}
                                  disabled={contentIndex === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => moveContent(content.id, module.id, "down")}
                                  disabled={contentIndex === moduleContents.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openContentDialog(module.id, content)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => deleteContent(content.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                          onClick={() => openContentDialog(module.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Conteúdo
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

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Atualize as informações do módulo" : "Crie um novo módulo para a biblioteca"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
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
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveModule} className="bg-brand-magenta hover:bg-brand-magenta/90">
              {editingModule ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Dialog */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContent ? "Editar Conteúdo" : "Novo Conteúdo"}</DialogTitle>
            <DialogDescription>
              {editingContent ? "Atualize as informações do conteúdo" : "Adicione um novo conteúdo ao módulo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Vídeo de Boas-Vindas"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(contentTypeLabels) as ContentType[]).map((type) => {
                    const Icon = contentTypeIcons[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {contentTypeLabels[type]}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL (opcional)</Label>
              <Input
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Descrição do conteúdo..."
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveContent} className="bg-brand-magenta hover:bg-brand-magenta/90">
              {editingContent ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
