import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard");
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="inline-block px-4 py-2 bg-brand-pink/20 rounded-full text-brand-blue font-medium text-sm mb-4">
              Educação Financeira de Qualidade
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-brand-blue leading-tight">
              Economiza
              <br />
              <span className="text-primary">Seu Dinheiro na Mesa</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transforme sua relação com o dinheiro através de conteúdos estruturados,
              ferramentas práticas e acompanhamento personalizado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="px-8 py-6 text-lg">
                Começar Agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="px-8 py-6 text-lg border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
              >
                Já sou membro
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-brand-blue mb-4">O que você vai encontrar</h2>
            <p className="text-lg text-muted-foreground">
              Uma plataforma completa para sua educação financeira
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Conteúdos Estruturados",
                description:
                  "Vídeos, PDFs, exercícios e checklists organizados em módulos progressivos",
                color: "bg-brand-blue",
              },
              {
                icon: TrendingUp,
                title: "Ferramentas Interativas",
                description:
                  "Calculadoras de orçamento, simuladores de investimento e controle de metas",
                color: "bg-primary",
              },
              {
                icon: Target,
                title: "Acompanhamento Personalizado",
                description:
                  "Monitore seu progresso e alcance seus objetivos financeiros de forma clara",
                color: "bg-brand-pink",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-card p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-primary rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-4xl font-bold mb-4">Pronto para transformar suas finanças?</h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de pessoas que já estão no controle do seu dinheiro
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="px-8 py-6 text-lg bg-white text-primary hover:bg-white/90"
          >
            Começar Minha Jornada
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2024 Economiza. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
