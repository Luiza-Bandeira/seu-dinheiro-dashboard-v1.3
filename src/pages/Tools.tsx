import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetCalculator } from "@/components/tools/BudgetCalculator";
import { InvestmentSimulator } from "@/components/tools/InvestmentSimulator";
import { GoalsManager } from "@/components/tools/GoalsManager";
import { BanksAndCards } from "@/components/tools/BanksAndCards";
import { CurrentInvestments } from "@/components/tools/CurrentInvestments";
import { ReductionGoals } from "@/components/tools/ReductionGoals";
import { WeeklyTracking } from "@/components/tools/WeeklyTracking";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Tools() {
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
                Ferramentas Financeiras
              </h1>
              <p className="text-muted-foreground">
                Utilize nossas calculadoras e simuladores para gerenciar suas finanças
              </p>
            </div>

            <Tabs defaultValue="budget" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
                <TabsTrigger value="budget">Orçamento</TabsTrigger>
                <TabsTrigger value="investment">Simulador</TabsTrigger>
                <TabsTrigger value="goals">Metas</TabsTrigger>
                <TabsTrigger value="banks">Bancos</TabsTrigger>
                <TabsTrigger value="current-investments">Investimentos</TabsTrigger>
                <TabsTrigger value="reduction">Redução</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
              </TabsList>

              <TabsContent value="budget" className="mt-6">
                <BudgetCalculator userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="investment" className="mt-6">
                <InvestmentSimulator userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="goals" className="mt-6">
                <GoalsManager userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="banks" className="mt-6">
                <BanksAndCards userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="current-investments" className="mt-6">
                <CurrentInvestments userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="reduction" className="mt-6">
                <ReductionGoals userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="weekly" className="mt-6">
                <WeeklyTracking userId={user?.id || ""} />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </main>
    </div>
  );
}