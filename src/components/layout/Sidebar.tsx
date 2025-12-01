import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, BookOpen, Wrench, BarChart3, X, User, Bell, History, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/library", icon: BookOpen, label: "Biblioteca" },
  { to: "/tools", icon: Wrench, label: "Ferramentas" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/history", icon: History, label: "Histórico Financeiro" },
  { to: "/notifications", icon: Bell, label: "Notificações" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .maybeSingle();
        
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdmin();
  }, []);

  // Fechar ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay - sempre presente */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - sempre retrátil, nunca fixa */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-0 left-0 h-full w-80 sm:w-64 bg-brand-blue text-white z-50 shadow-2xl rounded-r-2xl overflow-y-auto"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  "hover:bg-white/10",
                  isActive ? "bg-white/20 font-semibold" : "text-white/80"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Link Admin - apenas para administradores */}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-4 border-t border-white/10 pt-4",
                  "hover:bg-primary/20",
                  isActive ? "bg-primary/30 font-semibold" : "text-brand-pink"
                )
              }
            >
              <Shield className="h-5 w-5" />
              <span>Painel Admin</span>
            </NavLink>
          )}
        </nav>
      </motion.aside>
    </>
  );
}