import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentContent } from "@/components/dashboard/RecentContent";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { ExpensesByCategory } from "@/components/dashboard/ExpensesByCategory";
import { QuickTransactionForm } from "@/components/tools/QuickTransactionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useSidebar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMobile = useIsMobile();

  const handleTransactionSuccess = () => {
    setTransactionModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

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
      } else {
        setUser(session.user);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-brand-blue mb-2">
                  Olá, {user?.user_metadata?.full_name || "Membro"}! 👋
                </h1>
                <p className="text-muted-foreground">
                  Bem-vindo à sua área de membros. Continue sua jornada de educação financeira.
                </p>
              </div>
              <Button 
                onClick={() => setTransactionModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-5 w-5" />
                Adicionar Lançamento
              </Button>
            </div>

            {/* Transaction Modal - Dialog for desktop, Drawer for mobile */}
            {isMobile ? (
              <Drawer open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
                <DrawerContent className="max-h-[85vh]">
                  <DrawerHeader>
                    <DrawerTitle className="text-brand-blue">Adicionar Lançamento</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 overflow-y-auto flex-1">
                    <QuickTransactionForm 
                      userId={user?.id || ""} 
                      onSuccess={handleTransactionSuccess}
                      showTitle={false}
                      compact
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-brand-blue flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Adicionar Lançamento
                    </DialogTitle>
                  </DialogHeader>
                  <QuickTransactionForm 
                    userId={user?.id || ""} 
                    onSuccess={handleTransactionSuccess}
                    showTitle={false}
                    compact
                  />
                </DialogContent>
              </Dialog>
            )}

            <DashboardStats userId={user?.id || ""} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentContent userId={user?.id || ""} />
              <FinancialSummary userId={user?.id || ""} refreshKey={refreshKey} />
              <ExpensesByCategory userId={user?.id || ""} refreshKey={refreshKey} />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}