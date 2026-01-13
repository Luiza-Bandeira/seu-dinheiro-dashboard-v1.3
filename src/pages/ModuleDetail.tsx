import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Video, FileText, PenTool, CheckSquare, Sparkles, ExternalLink, Play, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Helper to extract Vimeo video ID
const getVimeoVideoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

// Helper to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  return !!getYouTubeVideoId(url) || !!getVimeoVideoId(url);
};

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
  type: "video" | "pdf" | "exercise" | "checklist" | "extra";
  url: string | null;
  order_index: number;
}

interface ProgressRecord {
  content_id: string;
  completed: boolean;
}

const contentTypeConfig = {
  video: { icon: Video, label: "Vídeo", color: "text-red-500" },
  pdf: { icon: FileText, label: "PDF", color: "text-blue-500" },
  exercise: { icon: PenTool, label: "Exercício", color: "text-green-500" },
  checklist: { icon: CheckSquare, label: "Checklist", color: "text-purple-500" },
  extra: { icon: Sparkles, label: "Extra", color: "text-amber-500" },
};

export default function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<Content | null>(null);
  const [encontro2Completed, setEncontro2Completed] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && moduleId) {
      loadModuleData();
    }
  }, [user, moduleId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadModuleData = async () => {
    if (!moduleId || !user) return;

    setLoading(true);
    try {
      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Load contents
      const { data: contentsData, error: contentsError } = await supabase
        .from("contents")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (contentsError) throw contentsError;
      setContents(contentsData || []);

      // Load progress
      const { data: progressData, error: progressError } = await supabase
        .from("progress")
        .select("content_id, completed")
        .eq("user_id", user.id)
        .in("content_id", (contentsData || []).map(c => c.id));

      if (progressError) throw progressError;

      const progressRecord: Record<string, boolean> = {};
      (progressData || []).forEach((p: ProgressRecord) => {
        progressRecord[p.content_id] = p.completed;
      });
      setProgressMap(progressRecord);

      // Check if "Encontro 2" is completed (for conditional release of Sessão Individual 1)
      const { data: encontro2Content } = await supabase
        .from("contents")
        .select("id")
        .ilike("title", "%Encontro 2%")
        .single();

      if (encontro2Content) {
        const { data: encontro2Progress } = await supabase
          .from("progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("content_id", encontro2Content.id)
          .eq("completed", true)
          .maybeSingle();

        setEncontro2Completed(!!encontro2Progress);
      }
    } catch (error) {
      console.error("Error loading module:", error);
      toast.error("Erro ao carregar módulo");
    } finally {
      setLoading(false);
    }
  };

  const toggleContentProgress = async (contentId: string, currentValue: boolean) => {
    if (!user) return;

    setUpdatingProgress(contentId);
    try {
      const newValue = !currentValue;

      // Check if progress record exists
      const { data: existing } = await supabase
        .from("progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_id", contentId)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from("progress")
          .update({ 
            completed: newValue, 
            completed_at: newValue ? new Date().toISOString() : null 
          })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase
          .from("progress")
          .insert({
            user_id: user.id,
            content_id: contentId,
            completed: newValue,
            completed_at: newValue ? new Date().toISOString() : null,
          });
      }

      setProgressMap(prev => ({ ...prev, [contentId]: newValue }));
      toast.success(newValue ? "Conteúdo marcado como concluído!" : "Marcação removida");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Erro ao atualizar progresso");
    } finally {
      setUpdatingProgress(null);
    }
  };

  const completedCount = Object.values(progressMap).filter(Boolean).length;
  const totalCount = contents.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const openContent = (content: Content) => {
    if (!content.url) {
      toast.info("Este conteúdo não possui um link associado");
      return;
    }

    // Check if it's a video type with embeddable URL
    if (content.type === "video" && isVideoUrl(content.url)) {
      setActiveVideo(content);
    } else {
      window.open(content.url, "_blank");
    }
  };

  const getEmbedUrl = (url: string): string | null => {
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
    }
    
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onMenuClick={() => setIsOpen(!isOpen)} />
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-48 w-full" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onMenuClick={() => setIsOpen(!isOpen)} />
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">Módulo não encontrado</h2>
            <Button onClick={() => navigate("/library")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Biblioteca
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onMenuClick={() => setIsOpen(!isOpen)} />
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/library")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Biblioteca
          </Button>

          {/* Module header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="text-sm">
                    Módulo {module.order_index + 1}
                  </Badge>
                  {progressPercentage === 100 && (
                    <Badge className="bg-green-600 text-white">Completo</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl text-brand-blue">{module.title}</CardTitle>
                {module.description && (
                  <CardDescription className="text-base">{module.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso do módulo</span>
                    <span className="font-semibold text-brand-blue">
                      {completedCount}/{totalCount} completos ({Math.round(progressPercentage)}%)
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contents list */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Conteúdos</h3>
            
            {contents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Este módulo ainda não possui conteúdos cadastrados.
                </CardContent>
              </Card>
            ) : (
              contents.map((content, index) => {
                const config = contentTypeConfig[content.type];
                const Icon = config.icon;
                const isCompleted = progressMap[content.id] || false;
                const isUpdating = updatingProgress === content.id;
                
                // Check if this is "Sessão Individual 1" and if it's locked
                const isSessaoIndividual1 = content.title.toLowerCase().includes("sessão individual 1") || 
                                            content.title.toLowerCase().includes("sessao individual 1");
                const isLocked = isSessaoIndividual1 && !encontro2Completed;

                // Special styling for individual sessions
                const isSessaoIndividual = content.title.toLowerCase().includes("sessão individual") || 
                                           content.title.toLowerCase().includes("sessao individual");

                return (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`transition-all ${
                      isLocked 
                        ? 'bg-muted/50 border-muted opacity-70' 
                        : isCompleted 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                          : isSessaoIndividual
                            ? 'bg-gradient-to-r from-brand-magenta/5 to-brand-pink/10 border-brand-magenta/30 hover:shadow-md'
                            : 'hover:shadow-md'
                    }`}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          {/* Checkbox or Lock */}
                          {isLocked ? (
                            <div className="h-5 w-5 flex items-center justify-center">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <Checkbox
                              checked={isCompleted}
                              disabled={isUpdating}
                              onCheckedChange={() => toggleContentProgress(content.id, isCompleted)}
                              className="h-5 w-5"
                            />
                          )}

                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${isLocked ? 'bg-muted' : isSessaoIndividual ? 'bg-brand-magenta/10' : 'bg-muted'} ${isLocked ? 'text-muted-foreground' : config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Content info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={isSessaoIndividual && !isLocked ? "default" : "outline"} className={`text-xs ${isSessaoIndividual && !isLocked ? 'bg-brand-magenta' : ''}`}>
                                {isSessaoIndividual ? 'Sessão Individual' : config.label}
                              </Badge>
                              {isLocked && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                                  🔒 Bloqueado
                                </Badge>
                              )}
                            </div>
                            <h4 className={`font-medium mt-1 ${isLocked ? 'text-muted-foreground' : isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {content.title}
                            </h4>
                            {isLocked ? (
                              <p className="text-sm text-amber-600 mt-1">
                                ⏳ Disponível após completar o Encontro ao Vivo 2
                              </p>
                            ) : content.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {content.description}
                              </p>
                            )}
                          </div>

                          {/* Action button */}
                          {content.url && !isLocked && (
                            <Button
                              variant={isSessaoIndividual ? "default" : "outline"}
                              size="sm"
                              onClick={() => openContent(content)}
                              className={isSessaoIndividual ? 'bg-brand-magenta hover:bg-brand-magenta/90' : ''}
                            >
                              {content.type === "video" && isVideoUrl(content.url) ? (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Reproduzir
                                </>
                              ) : isSessaoIndividual ? (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Agendar
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Abrir
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Video Player Dialog */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-lg font-semibold pr-8">
              {activeVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-video bg-black">
            {activeVideo?.url && (
              <iframe
                src={getEmbedUrl(activeVideo.url) || ""}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeVideo.title}
              />
            )}
          </div>
          {activeVideo?.description && (
            <div className="p-4 pt-2 text-sm text-muted-foreground">
              {activeVideo.description}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
