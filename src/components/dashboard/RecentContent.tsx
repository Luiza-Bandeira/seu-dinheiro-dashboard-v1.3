import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, CheckSquare, FileCheck } from "lucide-react";

interface RecentContentProps {
  userId: string;
}

interface Content {
  id: string;
  title: string;
  type: string;
  module_id: string;
}

const contentIcons = {
  video: Video,
  pdf: FileText,
  exercise: CheckSquare,
  checklist: FileCheck,
  extra: FileText,
};

export function RecentContent({ userId }: RecentContentProps) {
  const [recentContents, setRecentContents] = useState<Content[]>([]);

  useEffect(() => {
    loadRecentContent();
  }, [userId]);

  const loadRecentContent = async () => {
    const { data, error } = await supabase
      .from("progress")
      .select(
        `
        content_id,
        completed_at,
        contents (
          id,
          title,
          type,
          module_id
        )
      `
      )
      .eq("user_id", userId)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Erro ao carregar conteúdos recentes:", error);
      return;
    }

    const contents = data?.map((item: any) => item.contents).filter(Boolean) || [];
    setRecentContents(contents);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-blue">Últimos Conteúdos Acessados</CardTitle>
      </CardHeader>
      <CardContent>
        {recentContents.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum conteúdo acessado ainda
          </p>
        ) : (
          <div className="space-y-3">
            {recentContents.map((content) => {
              const Icon = contentIcons[content.type as keyof typeof contentIcons] || FileText;
              return (
                <div
                  key={content.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-brand-pink/20">
                    <Icon className="h-5 w-5 text-brand-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{content.title}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {content.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}