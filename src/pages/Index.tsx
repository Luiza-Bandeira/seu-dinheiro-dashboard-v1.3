import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  ArrowRight, 
  Target, 
  Eye, 
  FolderOpen, 
  Compass, 
  RefreshCw,
  Users,
  GraduationCap,
  Quote
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: { staggerChildren: 0.1 }
    },
    viewport: { once: true }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true }
  };

  const paymentLink = "https://mpago.la/1KiNKG2";

  const valueItems = [
    { title: "3 Sessões individuais", subtitle: "(R$ 500 cada)", price: "R$ 1.500" },
    { title: "Encontros ao vivo durante o programa", subtitle: "Para tirar dúvidas com exemplos reais", price: "R$ 997" },
    { title: "Suporte via WhatsApp por 1 ano", subtitle: "Acompanhamento contínuo", price: "R$ 1.200" },
    { title: "Ferramentas e materiais exclusivos", subtitle: "Planilhas, templates e guias práticos", price: "R$ 1.200" },
    { title: "Aulas gravadas + conteúdo periódico", subtitle: "Acesso completo durante o programa", price: "R$ 997" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* SEÇÃO 1 — HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-pink/10 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto space-y-8"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-brand-blue leading-tight">
            Seu Dinheiro na Mesa
          </h1>
          <p className="text-xl md:text-2xl text-brand-blue/80 font-medium">
            Porque entender seu dinheiro muda tudo.
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Clareza financeira real, simples e possível — pra você finalmente saber o que está fazendo com o seu dinheiro.
          </p>
          <div className="flex flex-col gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => window.open(paymentLink, "_blank")} 
              className="px-8 py-7 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              👉 Quero colocar meu dinheiro na mesa
            </Button>
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 2 — IDENTIFICAÇÃO (Dores) */}
      <section className="py-20 px-6 bg-brand-pink/10">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue leading-tight">
              Você ganha dinheiro…<br />
              <span className="text-primary">mas nunca sabe exatamente pra onde ele vai?</span>
            </h2>
          </motion.div>

          <motion.div 
            {...staggerContainer}
            className="space-y-4 max-w-xl mx-auto"
          >
            {[
              "o dinheiro parece evaporar",
              "você sempre sente que está \"correndo atrás\"",
              "planilhas, apps, métodos… nada dura",
              "a vida financeira parece sempre confusa",
              "você trabalha, trabalha… mas não vê clareza"
            ].map((pain, index) => (
              <motion.div
                key={index}
                {...staggerItem}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 bg-background/80 p-4 rounded-2xl shadow-sm"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-lg text-foreground">{pain}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.6 }}
            className="text-center mt-12"
          >
            <p className="text-xl md:text-2xl font-semibold text-brand-blue">
              ➡️ Isso não é falta de disciplina.<br />
              <span className="text-primary">É falta de visão.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 3 — VIRADA (Transformação) */}
      <section className="py-20 px-6 bg-brand-blue text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            {...fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 leading-tight"
          >
            Quando você entende seu dinheiro…<br />
            <span className="text-brand-pink">tudo muda.</span>
          </motion.h2>

          <motion.div 
            {...staggerContainer}
            className="space-y-4 mb-12"
          >
            {[
              "Você muda como decide.",
              "Como compra.",
              "Como investe.",
              "Como vive."
            ].map((phrase, index) => (
              <motion.p
                key={index}
                {...staggerItem}
                transition={{ delay: index * 0.15 }}
                className="text-xl md:text-2xl font-medium text-white/90"
              >
                {phrase}
              </motion.p>
            ))}
          </motion.div>

          <motion.p 
            {...fadeInUp}
            transition={{ delay: 0.8 }}
            className="text-2xl md:text-3xl font-bold text-brand-pink"
          >
            Clareza financeira é clareza de vida.
          </motion.p>
        </div>
      </section>

      {/* SEÇÃO 4 — APRESENTAÇÃO DO PROGRAMA */}
      <section className="py-20 px-6">
        <motion.div 
          {...fadeInUp}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card p-8 md:p-12 rounded-3xl shadow-lg border border-border/50 text-center">
            <span className="inline-block px-4 py-2 bg-brand-pink/20 text-brand-blue font-medium text-sm rounded-full mb-6">
              O Programa
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Seu Dinheiro na Mesa
            </h2>
            <p className="text-xl text-primary font-medium mb-6">
              Um programa individual de clareza financeira.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Criado e conduzido por uma economista, com metodologia simples, visual e humana — para pessoas que querem maturidade financeira sem complicação.
            </p>
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 5 — MÉTODO EM 5 ETAPAS */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              O Método em 5 Etapas
            </h2>
            <p className="text-lg text-muted-foreground">
              Uma jornada estruturada para sua clareza financeira
            </p>
          </motion.div>

          <motion.div 
            {...staggerContainer}
            className="grid grid-cols-1 md:grid-cols-5 gap-6"
          >
            {[
              { icon: FolderOpen, title: "Colocando Tudo na Mesa", step: 1 },
              { icon: Eye, title: "Olhando o Dinheiro de Perto", step: 2 },
              { icon: RefreshCw, title: "Reorganizando a Vida Financeira", step: 3 },
              { icon: Compass, title: "Direção de Vida e Dinheiro", step: 4 },
              { icon: Target, title: "Acompanhamento Rotineiro", step: 5 }
            ].map((item, index) => (
              <motion.div
                key={index}
                {...staggerItem}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 text-center h-full flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-7 h-7 text-brand-blue" />
                  </div>
                  <h3 className="font-semibold text-brand-blue text-sm leading-tight">
                    {item.title}
                  </h3>
                </div>
                {index < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-brand-pink" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 6 — RESULTADOS */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              O que você conquista
            </h2>
          </motion.div>

          <motion.div 
            {...staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              "clareza do dinheiro",
              "decisões seguras",
              "paz financeira",
              "rotina leve",
              "sistema simples",
              "direção real",
              "maturidade financeira"
            ].map((result, index) => (
              <motion.div
                key={index}
                {...staggerItem}
                transition={{ delay: index * 0.05 }}
                className="bg-card p-4 rounded-2xl shadow-sm border border-brand-pink/30 flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-foreground">{result}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 7 — PROVA SOCIAL */}
      <section className="py-20 px-6 bg-brand-pink/10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            {...staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            <motion.div {...staggerItem} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-4xl font-bold text-brand-blue mb-2">100+</p>
              <p className="text-muted-foreground">análises financeiras individuais</p>
            </motion.div>

            <motion.div {...staggerItem} transition={{ delay: 0.1 }} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GraduationCap className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-4xl font-bold text-brand-blue mb-2">Economista</p>
              <p className="text-muted-foreground">método criado por especialista</p>
            </motion.div>

            <motion.div {...staggerItem} transition={{ delay: 0.2 }} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Quote className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-4xl font-bold text-brand-blue mb-2">100%</p>
              <p className="text-muted-foreground">satisfação dos alunos</p>
            </motion.div>
          </motion.div>

          <motion.div 
            {...fadeInUp}
            className="bg-card p-8 rounded-3xl shadow-sm border border-border/50 text-center max-w-2xl mx-auto"
          >
            <Quote className="w-10 h-10 text-brand-pink mx-auto mb-4" />
            <p className="text-xl md:text-2xl italic text-brand-blue font-medium mb-4">
              "Eu nunca tinha visto meu dinheiro desse jeito."
            </p>
            <p className="text-muted-foreground">
              — Frase mais comum nas sessões
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 8 — PARA QUEM É */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Para pessoas que querem:
            </h2>
          </motion.div>

          <motion.div 
            {...staggerContainer}
            className="space-y-4"
          >
            {[
              "clareza",
              "controle",
              "direção",
              "leveza",
              "decisão consciente",
              "organização real",
              "maturidade financeira"
            ].map((item, index) => (
              <motion.div
                key={index}
                {...staggerItem}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border/50"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-medium text-foreground">{item}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 9 — O QUE VOCÊ RECEBE */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              O que você recebe
            </h2>
          </motion.div>

          <motion.div 
            {...staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {[
              "Sessões individuais",
              "Mapeamento completo",
              "Plano personalizado",
              "Estrutura organizada",
              "Acompanhamento de evolução",
              "Ferramentas fáceis",
              "Suporte humano"
            ].map((benefit, index) => (
              <motion.div
                key={index}
                {...staggerItem}
                transition={{ delay: index * 0.08 }}
                className="bg-card p-5 rounded-2xl shadow-sm border border-border/50 flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-foreground">{benefit}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 10 — VALOR PERCEBIDO */}
      <section className="py-20 px-6 bg-gradient-to-b from-brand-pink/5 to-brand-pink/20">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Quanto vale realmente este programa?
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja o valor real do que você está recebendo
            </p>
          </motion.div>

          <motion.div 
            {...fadeInUp}
            className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden"
          >
            {/* Items list */}
            <div className="divide-y divide-border/50">
              {valueItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-5 md:p-6"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-brand-blue ml-4">
                    {item.price}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Total section */}
            <div className="bg-gradient-to-r from-brand-pink/20 to-brand-pink/30 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-semibold text-brand-blue">Valor Total Real:</p>
                <p className="text-2xl font-bold text-brand-blue line-through opacity-60">
                  R$ 8.000
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-brand-blue">Você paga apenas:</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  R$ 1.600
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 11 — CTA FINAL */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-blue to-brand-blue/90">
        <motion.div 
          {...fadeInUp}
          className="max-w-3xl mx-auto text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para colocar seu dinheiro na mesa?
          </h2>
          <p className="text-xl text-white/80 mb-4">
            Clareza financeira está a um passo de distância.
          </p>
          
          {/* Pricing */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 inline-block">
            <p className="text-3xl md:text-4xl font-bold text-white mb-2">
              R$ 1.600 <span className="text-lg font-normal text-white/70">à vista</span>
            </p>
            <p className="text-lg text-white/80">
              ou <span className="font-semibold">12x de R$ 162,81</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => window.open(paymentLink, "_blank")} 
              className="px-10 py-8 text-xl bg-white text-brand-blue hover:bg-white/90 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <ArrowRight className="w-6 h-6 mr-2" />
              Quero colocar meu dinheiro na mesa
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2024 Seu Dinheiro na Mesa. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
