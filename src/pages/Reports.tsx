import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReportComplete } from "@/components/reports/FinancialReportComplete";
import { ProgressReport } from "@/components/reports/ProgressReport";
import { MonthlyReport } from "@/components/reports/MonthlyReport";
import { WeeklyReport } from "@/components/reports/WeeklyReport";
import { CategoryReport } from "@/components/reports/CategoryReport";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Reports() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-brand-blue text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onMenuClick={() => setIsOpen(!isOpen)} />
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-brand-blue mb-2">
                Relatórios Inteligentes
              </h1>
              <p className="text-muted-foreground">
                Análise completa das suas finanças com insights automáticos
              </p>
            </div>

            <Tabs defaultValue="financial" className="w-full">
              <TabsList className="grid w-full grid-cols-5 gap-2">
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="progress">Progresso</TabsTrigger>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="category">Categoria</TabsTrigger>
              </TabsList>

              <TabsContent value="financial" className="mt-6">
                <FinancialReportComplete userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                <ProgressReport userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="monthly" className="mt-6">
                <MonthlyReport userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="weekly" className="mt-6">
                <WeeklyReport userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="category" className="mt-6">
                <CategoryReport userId={user?.id || ""} />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
