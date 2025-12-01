import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { FileText, FileSpreadsheet, BookOpen, CheckCircle2, Clock, Award } from "lucide-react";
import { exportToPDF, exportToCSV, formatPercentage } from "@/utils/exportUtils";
import { motion } from "framer-motion";

interface ProgressReportProps {
  userId: string;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface Content {
  id: string;
  module_id: string;
  title: string;
  type: string;
}

interface ProgressEntry {
  id: string;
  content_id: string;
  completed: boolean;
  completed_at: string | null;
}

export function ProgressReport({ userId }: ProgressReportProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);

    const [modulesRes, contentsRes, progressRes] = await Promise.all([
      supabase.from("modules").select("*").order("order_index"),
      supabase.from("contents").select("*"),
      supabase.from("progress").select("*").eq("user_id", userId),
    ]);

    if (modulesRes.data) setModules(modulesRes.data);
    if (contentsRes.data) setContents(contentsRes.data);
    if (progressRes.data) setProgress(progressRes.data);

    setLoading(false);
  };

  const calculateOverallProgress = () => {
    if (contents.length === 0) return 0;
    const completed = progress.filter(p => p.completed).length;
    return (completed / contents.length) * 100;
  };

  const getModuleProgress = () => {
    return modules.map(module => {
      const moduleContents = contents.filter(c => c.module_id === module.id);
      const completedContents = progress.filter(
        p => p.completed && moduleContents.some(c => c.id === p.content_id)
      ).length;

      return {
        id: module.id,
        title: module.title,
        total: moduleContents.length,
        completed: completedContents,
        percentage: moduleContents.length > 0 
          ? (completedContents / moduleContents.length) * 100 
          : 0,
      };
    });
  };

  const getWeeklyStudyData = () => {
    const weeks: { [key: string]: number } = {};
    
    // Get last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      weeks[weekKey] = 0;
    }

    progress
      .filter(p => p.completed && p.completed_at)
      .forEach(p => {
        const completedDate = new Date(p.completed_at!);
        const weekStart = new Date(completedDate);
        weekStart.setDate(completedDate.getDate() - completedDate.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);
        
        if (weeks[weekKey] !== undefined) {
          weeks[weekKey]++;
        }
      });

    return Object.entries(weeks).map(([week, count]) => {
      const date = new Date(week);
      return {
        week: `${date.getDate()}/${date.getMonth() + 1}`,
        conteudos: count,
      };
    });
  };

  const getContentStats = () => {
    const completed = progress.filter(p => p.completed).length;
    const pending = contents.length - completed;
    const videos = contents.filter(c => c.type === "video").length;
    const exercises = contents.filter(c => c.type === "exercise").length;

    return { completed, pending, videos, exercises, total: contents.length };
  };

  const handleExportPDF = () => {
    const moduleProgress = getModuleProgress();
    const stats = getContentStats();

    exportToPDF({
      title: "Relatório de Progresso nos Conteúdos",
      subtitle: `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      headers: ["Módulo", "Conteúdos", "Concluídos", "Progresso"],
      rows: moduleProgress.map(m => [
        m.title,
        m.total,
        m.completed,
        formatPercentage(m.percentage),
      ]),
      summary: [
        { label: "Progresso Geral", value: formatPercentage(calculateOverallProgress()) },
        { label: "Concluídos", value: stats.completed },
        { label: "Pendentes", value: stats.pending },
        { label: "Total", value: stats.total },
      ],
    }, `relatorio-progresso-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = () => {
    const moduleProgress = getModuleProgress();

    exportToCSV({
      title: "Relatório de Progresso",
      headers: ["Módulo", "Total de Conteúdos", "Concluídos", "Progresso (%)"],
      rows: moduleProgress.map(m => [
        m.title,
        m.total,
        m.completed,
        m.percentage.toFixed(1),
      ]),
    }, `relatorio-progresso-${new Date().toISOString().slice(0, 10)}`);
  };

  const overallProgress = calculateOverallProgress();
  const moduleProgress = getModuleProgress();
  const weeklyData = getWeeklyStudyData();
  const stats = getContentStats();

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Carregando relatório...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">Relatório de Progresso</h2>
          <p className="text-muted-foreground">Acompanhe sua evolução nos conteúdos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Progresso Geral */}
      <Card className="bg-gradient-to-r from-brand-blue/5 to-primary/5">
        <CardHeader>
          <CardTitle className="text-brand-blue flex items-center gap-2">
            <Award className="h-5 w-5" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">
                {stats.completed} de {stats.total} conteúdos concluídos
              </span>
              <Badge 
                className={
                  overallProgress >= 75 ? "bg-green-500" : 
                  overallProgress >= 50 ? "bg-yellow-500" : 
                  overallProgress >= 25 ? "bg-orange-500" : "bg-red-500"
                }
              >
                {formatPercentage(overallProgress)}
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Vídeos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.videos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              Exercícios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.exercises}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Progresso por Módulo</CardTitle>
            <CardDescription>Desempenho em cada módulo</CardDescription>
          </CardHeader>
          <CardContent>
            {moduleProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moduleProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    type="category" 
                    dataKey="title" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value: number) => formatPercentage(value)} />
                  <Bar dataKey="percentage" name="Progresso" fill="#ef137c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhum módulo disponível</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand-blue">Evolução Semanal</CardTitle>
            <CardDescription>Conteúdos concluídos por semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conteudos" 
                  name="Conteúdos"
                  stroke="#0B2860" 
                  strokeWidth={2}
                  dot={{ fill: "#0B2860", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista detalhada por módulo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Detalhamento por Módulo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleProgress.map((module, idx) => (
              <div key={module.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{module.title}</span>
                  <Badge variant={module.percentage === 100 ? "default" : "outline"}>
                    {module.completed}/{module.total}
                  </Badge>
                </div>
                <Progress value={module.percentage} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {module.percentage === 100 
                    ? "✅ Módulo concluído!" 
                    : `${module.total - module.completed} conteúdo(s) restante(s)`}
                </p>
              </div>
            ))}
            {moduleProgress.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum módulo encontrado. Acesse a biblioteca para começar!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
