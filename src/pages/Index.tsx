import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Target, Eye, FolderOpen, Compass, RefreshCw, Users, GraduationCap, Quote, Clock, Star } from "lucide-react";
// Helper function to convert video URLs to embed format
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // Google Drive
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  
  // YouTube watch URL
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // YouTube short URL
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Already an embed URL
  return url;
};

// Helper function to format price
const formatPrice = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR');
};

const Index = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [price, setPrice] = useState<string>("1600");
  const [originalPrice, setOriginalPrice] = useState<string>("5894");
  const [installments, setInstallments] = useState<string>("12x de R$ 162,81");
  const [paymentLink, setPaymentLink] = useState<string>("https://mpago.la/1KiNKG2");
  const [specialCondition, setSpecialCondition] = useState<string>("janeiro");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Load settings from database
    const loadSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');
      
      if (data) {
        data.forEach(setting => {
          switch (setting.setting_key) {
            case 'landing_video_url':
              setVideoUrl(setting.setting_value || '');
              break;
            case 'landing_price':
              setPrice(setting.setting_value || '1600');
              break;
            case 'landing_original_price':
              setOriginalPrice(setting.setting_value || '5894');
              break;
            case 'landing_installments':
              setInstallments(setting.setting_value || '12x de R$ 162,81');
              break;
            case 'landing_payment_link':
              setPaymentLink(setting.setting_value || 'https://mpago.la/1KiNKG2');
              break;
            case 'landing_special_condition':
              setSpecialCondition(setting.setting_value || 'janeiro');
              break;
          }
        });
      }
    };
    loadSettings();
    return () => subscription.unsubscribe();
  }, [navigate]);
  const fadeInUp = {
    initial: {
      opacity: 0,
      y: 30
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true
    },
    transition: {
      duration: 0.6
    }
  };
  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: {
      once: true
    }
  };
  const staggerItem = {
    initial: {
      opacity: 0,
      y: 20
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true
    }
  };
  // paymentLink is now loaded from database
  const modules = [{
    number: 1,
    title: "Colocando Tudo na Mesa",
    description: "Reúna todos os seus documentos financeiros e tenha uma visão completa da sua situação atual. Extratos, faturas, financiamentos - tudo organizado.",
    icon: FolderOpen
  }, {
    number: 2,
    title: "Olhando o Dinheiro de Perto",
    description: "Analise cada entrada e saída. Entenda para onde seu dinheiro realmente vai e identifique padrões que você nunca percebeu.",
    icon: Eye
  }, {
    number: 3,
    title: "Reorganizando a Vida Financeira",
    description: "Estruture seu orçamento de forma sustentável. Crie um sistema que funciona para você, sem planilhas complicadas.",
    icon: RefreshCw
  }, {
    number: 4,
    title: "Planos e Sonhos",
    description: "Defina seus objetivos financeiros de curto, médio e longo prazo. Trace um caminho claro para realizá-los.",
    icon: Compass
  }, {
    number: 5,
    title: "Autonomia e Rotina Financeira",
    description: "Desenvolva hábitos financeiros saudáveis. Crie uma rotina simples de acompanhamento que você vai manter.",
    icon: Target
  }];
  const valueItems = [{
    title: "Sessões individuais de aplicação estratégica",
    subtitle: "Análise do seu cenário real e aplicação personalizada do método para resolver o seu problema financeiro específico.",
    price: "R$ 1.500"
  }, {
    title: "Encontros ao vivo durante o programa",
    subtitle: "Para tirar dúvidas com exemplos reais",
    price: "R$ 997"
  }, {
    title: "Suporte via WhatsApp por 1 ano",
    subtitle: "Acompanhamento contínuo",
    price: "R$ 1.200"
  }, {
    title: "Ferramentas e materiais exclusivos",
    subtitle: "Planilhas, templates e guias práticos",
    price: "R$ 1.200"
  }, {
    title: "Aulas gravadas + conteúdo periódico",
    subtitle: "Acesso completo durante o programa",
    price: "R$ 997"
  }];
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* SEÇÃO 1 — HERO */}
      <section className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-br from-brand-blue via-brand-blue/95 to-brand-blue/90 relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-pink rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-magenta rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center text-white relative z-10 w-full px-2">
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }}>
            <Badge className="bg-brand-magenta text-white px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-lg mb-4 sm:mb-6 capitalize">
              Condição Especial de {specialCondition}
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
              Seu Dinheiro na Mesa
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Um programa de clareza financeira para quem quer entender,
              organizar e assumir o controle do próprio dinheiro.
            </p>
            
            {/* Vídeo de Vendas */}
            {videoUrl && <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.6,
            delay: 0.3
          }} className="w-full max-w-3xl mx-auto mb-6 sm:mb-8 rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video">
                  <iframe src={getEmbedUrl(videoUrl)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Vídeo de apresentação" />
                </div>
              </motion.div>}
            
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.5
          }}>
              <Button size="lg" onClick={() => window.open(paymentLink, "_blank")} className="sm:px-12 py-6 sm:py-8 text-lg sm:text-xl bg-brand-magenta hover:bg-brand-magenta/90 rounded-2xl shadow-lg hover:shadow-xl transition-all px-[13px]">
                <ArrowRight className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                Quero minha clareza financeira
              </Button>
            </motion.div>
            
            <p className="text-xs sm:text-sm text-white/60 mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Acesso por 1 ano
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Aulas bônus das próximas turmas
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Atualizações inclusas
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 2 — IDENTIFICAÇÃO (Dores) */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-brand-pink/10">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-12 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue leading-tight">
              Você ganha dinheiro…<br />
              <span className="text-primary">mas nunca sabe exatamente pra onde ele vai?</span>
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="space-y-3 sm:space-y-4 max-w-xl mx-auto px-2">
            {["o dinheiro parece evaporar", "você sempre sente que está \"correndo atrás\"", "planilhas, apps, métodos… nada dura", "a vida financeira parece sempre confusa", "você trabalha, trabalha… mas não vê clareza"].map((pain, index) => <motion.div key={index} {...staggerItem} transition={{
            delay: index * 0.1
          }} className="flex items-center gap-3 sm:gap-4 bg-background/80 p-3 sm:p-4 rounded-2xl shadow-sm">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                </div>
                <p className="text-base sm:text-lg text-foreground">{pain}</p>
              </motion.div>)}
          </motion.div>

          <motion.div {...fadeInUp} transition={{
          delay: 0.6
        }} className="text-center mt-8 sm:mt-12 px-2">
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-brand-blue">
              ➡️ Isso não é falta de disciplina.<br />
              <span className="text-primary">É falta de visão.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 3 — VIRADA (Transformação) */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-brand-blue text-white">
        <div className="max-w-4xl mx-auto text-center px-2">
          <motion.h2 {...fadeInUp} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12 leading-tight">
            Quando você entende seu dinheiro…<br />
            <span className="text-brand-pink">tudo muda.</span>
          </motion.h2>

          <motion.div {...staggerContainer} className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
            {["Você muda como decide.", "Como compra.", "Como investe.", "Como vive."].map((phrase, index) => <motion.p key={index} {...staggerItem} transition={{
            delay: index * 0.15
          }} className="text-lg sm:text-xl md:text-2xl font-medium text-white/90">
                {phrase}
              </motion.p>)}
          </motion.div>

          <motion.p {...fadeInUp} transition={{
          delay: 0.8
        }} className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-pink">
            Clareza financeira é clareza de vida.
          </motion.p>
        </div>
      </section>

      {/* SEÇÃO 4 — APRESENTAÇÃO DO PROGRAMA */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <div className="bg-card p-6 sm:p-8 md:p-12 rounded-3xl shadow-lg border border-border/50 text-center mx-2">
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-pink/20 text-brand-blue font-medium text-sm rounded-full mb-4 sm:mb-6">
              O Programa
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-blue mb-3 sm:mb-4">
              Seu Dinheiro na Mesa
            </h2>
            <p className="text-lg sm:text-xl text-primary font-medium mb-4 sm:mb-6">
              Um programa individual de clareza financeira.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Criado e conduzido por uma economista, com metodologia simples, visual e humana — para pessoas que querem maturidade financeira sem complicação.
            </p>
          </div>
        </motion.div>
      </section>

      {/* SEÇÃO 5 — DETALHES DOS MÓDULOS */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-10 sm:mb-16 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-blue mb-3 sm:mb-4">
              Os 5 Módulos do Programa
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma jornada estruturada para você conquistar clareza e controle sobre suas finanças
            </p>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2">
            {modules.map((module, index) => <motion.div key={index} {...staggerItem} transition={{
            delay: index * 0.1
          }}>
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base sm:text-lg font-bold">
                        {module.number}
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center">
                        <module.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
                      </div>
                    </div>
                    <CardTitle className="text-brand-blue text-lg sm:text-xl">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <CardDescription className="text-sm sm:text-base leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 6 — BÔNUS */}
      <section className="py-20 px-6 bg-gradient-to-r from-brand-magenta/10 to-brand-pink/20">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <Badge className="bg-brand-magenta text-white text-lg px-4 py-2">
              <Star className="w-4 h-4 mr-2 inline" />
              Bônus Exclusivo
            </Badge>
          </motion.div>
          
          <motion.div {...fadeInUp} transition={{
          delay: 0.2
        }}>
            <Card className="border-2 border-brand-magenta/30 bg-gradient-to-br from-background to-brand-pink/5 overflow-hidden">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl md:text-3xl text-brand-magenta">
                  Encontros ao Vivo
                </CardTitle>
                <CardDescription className="text-lg">
                  Aulas semanais ao vivo para tirar dúvidas com exemplos reais
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-white/50 rounded-2xl">
                    <Clock className="w-10 h-10 text-brand-magenta mx-auto mb-3" />
                    <p className="text-3xl font-bold text-brand-magenta">1 ano</p>
                    <p className="text-muted-foreground">de acesso à plataforma</p>
                  </div>
                  <div className="text-center p-6 bg-white/50 rounded-2xl">
                    <Users className="w-10 h-10 text-brand-magenta mx-auto mb-3" />
                    <p className="text-2xl font-bold text-brand-magenta">Próximas turmas</p>
                    <p className="text-muted-foreground">acesso às aulas bônus</p>
                  </div>
                  <div className="text-center p-6 bg-white/50 rounded-2xl">
                    <RefreshCw className="w-10 h-10 text-brand-magenta mx-auto mb-3" />
                    <p className="text-2xl font-bold text-brand-magenta">Atualizações</p>
                    <p className="text-muted-foreground">conteúdos sempre atualizados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 7 — ACESSO ANUAL */}
      

      {/* SEÇÃO 8 — RESULTADOS */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              O que você conquista
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["clareza do dinheiro", "decisões seguras", "paz financeira", "rotina leve", "sistema simples", "direção real", "maturidade financeira", "controle total"].map((result, index) => <motion.div key={index} {...staggerItem} transition={{
            delay: index * 0.05
          }} className="bg-card p-4 rounded-2xl shadow-sm border border-brand-pink/30 flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-foreground">{result}</span>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 9 — PROVA SOCIAL */}
      <section className="py-20 px-6 bg-brand-pink/10">
        <div className="max-w-4xl mx-auto">
          <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.div {...staggerItem} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-4xl font-bold text-brand-blue mb-2">100+</p>
              <p className="text-muted-foreground">análises financeiras individuais</p>
            </motion.div>

            <motion.div {...staggerItem} transition={{
            delay: 0.1
          }} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GraduationCap className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-4xl font-bold text-brand-blue mb-2">Economista</p>
              <p className="text-muted-foreground">método criado por especialista</p>
            </motion.div>

            <motion.div {...staggerItem} transition={{
            delay: 0.2
          }} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Quote className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-4xl font-bold text-brand-blue mb-2">100%</p>
              <p className="text-muted-foreground">satisfação dos alunos</p>
            </motion.div>
          </motion.div>

          <motion.div {...fadeInUp} className="bg-card p-8 rounded-3xl shadow-sm border border-border/50 text-center max-w-2xl mx-auto">
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

      {/* SEÇÃO 10 — PARA QUEM É */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Para pessoas que querem:
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="space-y-4">
            {["clareza", "controle", "direção", "leveza", "decisão consciente", "organização real", "maturidade financeira"].map((item, index) => <motion.div key={index} {...staggerItem} transition={{
            delay: index * 0.08
          }} className="flex items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border/50">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-medium text-foreground">{item}</p>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 11 — O QUE VOCÊ RECEBE */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              O que você recebe
            </h2>
          </motion.div>

          <motion.div {...staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Sessões individuais", "Mapeamento completo", "Plano personalizado", "Estrutura organizada", "Acompanhamento de evolução", "Ferramentas fáceis", "Suporte humano", "Acesso por 1 ano"].map((benefit, index) => <motion.div key={index} {...staggerItem} transition={{
            delay: index * 0.08
          }} className="bg-card p-5 rounded-2xl shadow-sm border border-border/50 flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-foreground">{benefit}</p>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 12 — VALOR PERCEBIDO */}
      <section className="py-20 px-6 bg-gradient-to-b from-brand-pink/5 to-brand-pink/20">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge className="bg-brand-magenta text-white mb-4 px-4 py-2 capitalize">
              Condição Especial de {specialCondition}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Quanto vale realmente este programa?
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja o valor real do que você está recebendo
            </p>
          </motion.div>

          <motion.div {...fadeInUp} className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden">
            {/* Items list */}
            <div className="divide-y divide-border/50">
              {valueItems.map((item, index) => <motion.div key={index} initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="flex items-center justify-between p-5 md:p-6">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-brand-blue ml-4">
                    {item.price}
                  </p>
                </motion.div>)}
            </div>

            {/* Total section */}
            <div className="bg-gradient-to-r from-brand-pink/20 to-brand-pink/30 p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-semibold text-brand-blue">Valor Total Real:</p>
                <p className="text-2xl font-bold text-brand-blue line-through opacity-60">
                  R$ {formatPrice(originalPrice)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-brand-blue">Você paga apenas:</p>
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  R$ {formatPrice(price)}
                </p>
              </div>
              <p className="text-center mt-4 text-brand-magenta font-medium capitalize">
                Condição especial válida apenas em {specialCondition}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEÇÃO 13 — CTA FINAL */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-blue to-brand-blue/90">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center text-white">
          <Badge className="bg-brand-magenta mb-6 px-4 py-2 text-white capitalize">
            Condição Especial de {specialCondition}
          </Badge>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Comece sua jornada de clareza financeira
          </h2>
          
          <p className="text-xl text-white/80 mb-8">
            Clareza financeira está a um passo de distância.
          </p>
          
          {/* Pricing */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 inline-block">
            <p className="text-sm text-white/70 line-through mb-1">De R$ {formatPrice(originalPrice)}</p>
            <p className="text-4xl md:text-5xl font-bold text-white mb-2">
              R$ {formatPrice(price)}
            </p>
            <p className="text-lg text-brand-pink font-medium">
              ou {installments}
            </p>
          </div>

          <div className="flex flex-col gap-4 justify-center items-center">
            <Button size="lg" onClick={() => window.open(paymentLink, "_blank")} className="px-12 py-8 text-xl bg-brand-magenta hover:bg-brand-magenta/90 rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <ArrowRight className="w-6 h-6 mr-2" />
              Quero começar agora
            </Button>
            
            <p className="text-sm text-white/60 mt-4 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Acesso por 1 ano
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Aulas bônus das próximas turmas
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" /> Atualizações inclusas
              </span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2025 Seu Dinheiro na Mesa. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>;
};
export default Index;