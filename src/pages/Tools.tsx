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
import { BasicInformation } from "@/components/tools/BasicInformation";
import { CurrentInvestments } from "@/components/tools/CurrentInvestments";
import { ReductionGoals } from "@/components/tools/ReductionGoals";
import { WeeklyTracking } from "@/components/tools/WeeklyTracking";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  CreditCard, 
  TrendingUp, 
  Calculator, 
  Target, 
  TrendingDown,
  Wallet
} from "lucide-react";

const TOOL_CARDS = [
  { value: "basic", label: "Informações Básicas", icon: Wallet, description: "Bancos, cartões e dívidas" },
  { value: "current-investments", label: "Investimentos", icon: TrendingUp, description: "Gerencie seus investimentos" },
  { value: "budget", label: "Orçamento", icon: Calculator, description: "Receitas e despesas" },
  { value: "goals", label: "Objetivos", icon: Target, description: "Metas financeiras" },
  { value: "reduction", label: "Redução Semanal", icon: TrendingDown, description: "Controle de gastos" },
];

export default function Tools() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const isMobile = useIsMobile();

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return <BasicInformation userId={user?.id || ""} />;
      case "current-investments":
        return <CurrentInvestments userId={user?.id || ""} />;
      case "budget":
        return <BudgetCalculator userId={user?.id || ""} />;
      case "goals":
        return (
          <>
            <GoalsManager userId={user?.id || ""} />
            <div className="mt-8">
              <InvestmentSimulator userId={user?.id || ""} />
            </div>
          </>
        );
      case "reduction":
        return (
          <>
            <ReductionGoals userId={user?.id || ""} />
            <div className="mt-6">
              <WeeklyTracking userId={user?.id || ""} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

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

            {isMobile ? (
              // Mobile: Card-based navigation
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {TOOL_CARDS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTab === tool.value;
                    return (
                      <motion.div
                        key={tool.value}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all rounded-2xl h-full ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50 hover:shadow-sm"
                          }`}
                          onClick={() => setActiveTab(tool.value)}
                        >
                          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                            <div className={`p-3 rounded-xl ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                              <Icon className={`h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <p className={`font-medium text-sm ${isActive ? "text-primary" : "text-foreground"}`}>
                                {tool.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {tool.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderTabContent()}
                </motion.div>
              </div>
            ) : (
              // Desktop: Tabs layout
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-5 gap-2">
                  {TOOL_CARDS.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <TabsTrigger 
                        key={tool.value} 
                        value={tool.value} 
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tool.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="basic" className="mt-6">
                  <BasicInformation userId={user?.id || ""} />
                </TabsContent>

                <TabsContent value="current-investments" className="mt-6">
                  <CurrentInvestments userId={user?.id || ""} />
                </TabsContent>

                <TabsContent value="budget" className="mt-6">
                  <BudgetCalculator userId={user?.id || ""} />
                </TabsContent>

                <TabsContent value="goals" className="mt-6">
                  <GoalsManager userId={user?.id || ""} />
                  <div className="mt-8">
                    <InvestmentSimulator userId={user?.id || ""} />
                  </div>
                </TabsContent>

                <TabsContent value="reduction" className="mt-6">
                  <ReductionGoals userId={user?.id || ""} />
                  <div className="mt-6">
                    <WeeklyTracking userId={user?.id || ""} />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
