import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { FileText, FileSpreadsheet, Users, TrendingUp, Clock, Award, AlertTriangle, Star, Search, Download } from "lucide-react";
import { exportToPDF, exportToCSV, exportToXLSX, formatCurrency, formatPercentage } from "@/utils/exportUtils";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import { toast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  payment_status: string | null;
  created_at: string | null;
}

interface ProgressEntry {
  user_id: string | null;
  completed: boolean | null;
}

interface AnalyticsAccess {
  user_id: string;
  session_time: number | null;
  accessed_at: string;
}

const COLORS = ["#0B2860", "#ef137c", "#f7acb3", "#22c55e", "#f59e0b"];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsAccess[]>([]);
  const [contents, setContents] = useState<{ id: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");

  useEffect(() => {
    checkAdminAndLoadData();
  }, [navigate]);

  const checkAdminAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    const [profilesRes, progressRes, analyticsRes, contentsRes, modulesRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, payment_status, created_at"),
      supabase.from("progress").select("user_id, completed"),
      supabase.from("analytics_access").select("user_id, session_time, accessed_at"),
      supabase.from("contents").select("id"),
      supabase.from("modules").select("id, title"),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (progressRes.data) setProgress(progressRes.data);
    if (analyticsRes.data) setAnalytics(analyticsRes.data);
    if (contentsRes.data) setContents(contentsRes.data);
    if (modulesRes.data) setModules(modulesRes.data);
  };

  // KPIs calculations
  const getKPIs = () => {
    const totalStudents = profiles.length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeStudents = new Set(
      analytics
        .filter(a => new Date(a.accessed_at) >= sevenDaysAgo)
        .map(a => a.user_id)
    ).size;

    const totalSessionTime = analytics.reduce((sum, a) => sum + (a.session_time || 0), 0);
    const avgStudyTime = analytics.length > 0 ? totalSessionTime / analytics.length : 0;

    const completedProgress = progress.filter(p => p.completed).length;
    const avgProgress = contents.length > 0 && profiles.length > 0
      ? (completedProgress / (contents.length * profiles.length)) * 100
      : 0;

    return { totalStudents, activeStudents, avgStudyTime, avgProgress };
  };

  // Get progress distribution
  const getProgressDistribution = () => {
    const distribution = [
      { name: "0-25%", value: 0, color: "#ef4444" },
      { name: "25-50%", value: 0, color: "#f59e0b" },
      { name: "50-75%", value: 0, color: "#3b82f6" },
      { name: "75-100%", value: 0, color: "#22c55e" },
    ];

    profiles.forEach(profile => {
      const userProgress = progress.filter(p => p.user_id === profile.id && p.completed).length;
      const percentage = contents.length > 0 ? (userProgress / contents.length) * 100 : 0;

      if (percentage <= 25) distribution[0].value++;
      else if (percentage <= 50) distribution[1].value++;
      else if (percentage <= 75) distribution[2].value++;
      else distribution[3].value++;
    });

    return distribution;
  };

  // Get access evolution
  const getAccessEvolution = () => {
    const days: { [key: string]: number } = {};
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().slice(0, 10);
      days[dateKey] = 0;
    }

    analytics.forEach(a => {
      const dateKey = a.accessed_at.slice(0, 10);
      if (days[dateKey] !== undefined) {
        days[dateKey]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      acessos: count,
    }));
  };

  // Get student engagement data
  const getStudentEngagement = () => {
    return profiles.map(profile => {
      const userProgress = progress.filter(p => p.user_id === profile.id && p.completed).length;
      const progressPercentage = contents.length > 0 ? (userProgress / contents.length) * 100 : 0;

      const userAnalytics = analytics.filter(a => a.user_id === profile.id);
      const lastAccess = userAnalytics.length > 0 
        ? new Date(Math.max(...userAnalytics.map(a => new Date(a.accessed_at).getTime())))
        : null;
      const totalSessions = userAnalytics.length;
      const avgSessionTime = totalSessions > 0 
        ? userAnalytics.reduce((sum, a) => sum + (a.session_time || 0), 0) / totalSessions 
        : 0;

      const daysSinceLastAccess = lastAccess 
        ? Math.floor((new Date().getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      return {
        id: profile.id,
        name: profile.full_name || "Sem nome",
        email: profile.email,
        progress: progressPercentage,
        lastAccess,
        daysSinceLastAccess,
        totalSessions,
        avgSessionTime,
        isAtRisk: daysSinceLastAccess >= 14 || (progressPercentage < 25 && totalSessions < 3),
        isTopPerformer: progressPercentage >= 75 || avgSessionTime > 30,
      };
    });
  };

  // Filter students
  const getFilteredStudents = () => {
    let filtered = getStudentEngagement();

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (progressFilter !== "all") {
      if (progressFilter === "0-25") filtered = filtered.filter(s => s.progress <= 25);
      else if (progressFilter === "25-50") filtered = filtered.filter(s => s.progress > 25 && s.progress <= 50);
      else if (progressFilter === "50-75") filtered = filtered.filter(s => s.progress > 50 && s.progress <= 75);
      else if (progressFilter === "75-100") filtered = filtered.filter(s => s.progress > 75);
    }

    if (activityFilter !== "all") {
      if (activityFilter === "active") filtered = filtered.filter(s => s.daysSinceLastAccess <= 7);
      else if (activityFilter === "inactive") filtered = filtered.filter(s => s.daysSinceLastAccess > 7);
      else if (activityFilter === "risk") filtered = filtered.filter(s => s.isAtRisk);
    }

    return filtered;
  };

  // Export functions
  const handleExportPDF = () => {
    const students = getFilteredStudents();
    const kpis = getKPIs();

    exportToPDF({
      title: "Painel Analítico - Administrador",
      subtitle: `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      headers: ["Nome", "Email", "Progresso", "Último Acesso", "Sessões", "Status"],
      rows: students.map(s => [
        s.name,
        s.email,
        formatPercentage(s.progress),
        s.lastAccess ? s.lastAccess.toLocaleDateString("pt-BR") : "Nunca",
        s.totalSessions,
        s.isAtRisk ? "Em Risco" : s.isTopPerformer ? "Destaque" : "Normal",
      ]),
      summary: [
        { label: "Total de Alunos", value: kpis.totalStudents },
        { label: "Alunos Ativos (7d)", value: kpis.activeStudents },
        { label: "Progresso Médio", value: formatPercentage(kpis.avgProgress) },
      ],
    }, `painel-admin-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = () => {
    const students = getFilteredStudents();

    exportToCSV({
      title: "Painel Analítico",
      headers: ["Nome", "Email", "Progresso (%)", "Último Acesso", "Total Sessões", "Tempo Médio (min)", "Status"],
      rows: students.map(s => [
        s.name,
        s.email,
        s.progress.toFixed(1),
        s.lastAccess ? s.lastAccess.toISOString().slice(0, 10) : "",
        s.totalSessions,
        s.avgSessionTime.toFixed(0),
        s.isAtRisk ? "Em Risco" : s.isTopPerformer ? "Destaque" : "Normal",
      ]),
    }, `painel-admin-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportXLSX = () => {
    const students = getFilteredStudents();

    exportToXLSX({
      title: "Painel Analítico",
      headers: ["Nome", "Email", "Progresso (%)", "Último Acesso", "Total Sessões", "Tempo Médio (min)", "Status"],
      rows: students.map(s => [
        s.name,
        s.email,
        Number(s.progress.toFixed(1)),
        s.lastAccess ? s.lastAccess.toISOString().slice(0, 10) : "",
        s.totalSessions,
        Number(s.avgSessionTime.toFixed(0)),
        s.isAtRisk ? "Em Risco" : s.isTopPerformer ? "Destaque" : "Normal",
      ]),
    }, `painel-admin-${new Date().toISOString().slice(0, 10)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand-blue text-xl">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const kpis = getKPIs();
  const progressDistribution = getProgressDistribution();
  const accessEvolution = getAccessEvolution();
  const students = getFilteredStudents();
  const atRiskStudents = students.filter(s => s.isAtRisk);
  const topPerformers = students.filter(s => s.isTopPerformer).sort((a, b) => b.progress - a.progress).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onMenuClick={() => setIsOpen(!isOpen)} />
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-blue mb-2">Painel Analítico</h1>
              <p className="text-muted-foreground">Visão completa do desempenho da plataforma</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportXLSX}>
                <Download className="h-4 w-4 mr-2" />
                XLSX
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total de Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{kpis.totalStudents}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ativos (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{kpis.activeStudents}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">{kpis.avgStudyTime.toFixed(0)} min</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-pink-700 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Progresso Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-700">{formatPercentage(kpis.avgProgress)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-blue">Distribuição de Progresso</CardTitle>
                <CardDescription>Alunos por faixa de conclusão</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={progressDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {progressDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-brand-blue">Evolução de Acessos</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={accessEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="acessos" 
                      name="Acessos"
                      stroke="#0B2860" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="engagement" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="engagement">Engajamento</TabsTrigger>
              <TabsTrigger value="risk">Em Risco ({atRiskStudents.length})</TabsTrigger>
              <TabsTrigger value="top">Destaque ({topPerformers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="engagement" className="mt-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Progresso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="0-25">0-25%</SelectItem>
                    <SelectItem value="25-50">25-50%</SelectItem>
                    <SelectItem value="50-75">50-75%</SelectItem>
                    <SelectItem value="75-100">75-100%</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="risk">Em risco</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead>Sessões</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.slice(0, 20).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${Math.min(student.progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm">{formatPercentage(student.progress)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.lastAccess 
                              ? student.lastAccess.toLocaleDateString("pt-BR") 
                              : "Nunca"}
                          </TableCell>
                          <TableCell>{student.totalSessions}</TableCell>
                          <TableCell>
                            {student.isAtRisk && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Em Risco
                              </Badge>
                            )}
                            {student.isTopPerformer && !student.isAtRisk && (
                              <Badge className="bg-yellow-500 gap-1">
                                <Star className="h-3 w-3" />
                                Destaque
                              </Badge>
                            )}
                            {!student.isAtRisk && !student.isTopPerformer && (
                              <Badge variant="outline">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alunos com Risco de Abandono
                  </CardTitle>
                  <CardDescription>
                    Inativos há mais de 14 dias ou com engajamento muito baixo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {atRiskStudents.length > 0 ? (
                    <div className="space-y-4">
                      {atRiskStudents.map((student) => (
                        <div key={student.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <Badge variant="destructive">
                              {student.daysSinceLastAccess} dias sem acesso
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            <span>Progresso: {formatPercentage(student.progress)}</span>
                            <span className="mx-2">•</span>
                            <span>Sessões: {student.totalSessions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum aluno em risco de abandono no momento!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-yellow-600 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Alunos Destaque
                  </CardTitle>
                  <CardDescription>
                    Top 10% em tempo de estudo ou progresso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topPerformers.length > 0 ? (
                    <div className="space-y-4">
                      {topPerformers.map((student, index) => (
                        <div key={student.id} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold">{student.name}</h4>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                            <Badge className="bg-yellow-500">
                              {formatPercentage(student.progress)} concluído
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm">
                            <span>Tempo médio: {student.avgSessionTime.toFixed(0)} min</span>
                            <span className="mx-2">•</span>
                            <span>Sessões: {student.totalSessions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum aluno destaque no momento.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
