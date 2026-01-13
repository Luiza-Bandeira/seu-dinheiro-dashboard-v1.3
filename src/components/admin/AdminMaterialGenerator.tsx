import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { FileText, Download, CheckCircle2, Clock, RefreshCw, Save, Copy, Link } from "lucide-react";
import { motion } from "framer-motion";
import {
  generateChecklistPDF,
  generateGuidePDF,
  generateWorkbookPDF,
  generateScriptPDF,
  generateSubstitutionPDF,
  generateAlertGuidePDF,
  generateCalendarPDF,
  generateInvestmentGuidePDF,
} from "@/utils/pdfTemplates";

interface Content {
  id: string;
  title: string;
  type: string;
  url: string | null;
  module_id: string | null;
  order_index: number;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

// Material data definitions
const MATERIAL_DATA = {
  "Checklist de Documentos Necessários": {
    type: "checklist",
    items: [
      "Extratos bancários dos últimos 3 meses",
      "Faturas de cartão de crédito (últimos 3 meses)",
      "Comprovantes de renda (contracheques, pró-labore)",
      "Boletos de contas fixas (aluguel, água, luz, internet)",
      "Contratos de empréstimos ou financiamentos",
      "Lista de aplicações financeiras (se houver)",
      "Anotações de gastos em dinheiro",
      "Login e senha do internet banking",
      "Extrato do FGTS (se aplicável)",
      "Declaração do IR do ano anterior",
    ],
  },
  "Guia de Categorias": {
    type: "guide",
    sections: [
      {
        title: "RECEITAS",
        items: ["Salário", "Freelance/Extra", "Rendimentos", "Pensão/Benefícios", "Outras Receitas"],
      },
      {
        title: "DESPESAS FIXAS",
        items: ["Moradia (aluguel, condomínio)", "Transporte (combustível, transporte público)", "Educação", "Saúde", "Seguros"],
      },
      {
        title: "DESPESAS VARIÁVEIS",
        items: ["Alimentação", "Lazer", "Vestuário", "Cuidados Pessoais", "Compras diversas"],
      },
    ],
  },
  "Lista de Gastos Invisíveis": {
    type: "checklist",
    items: [
      "Assinaturas de streaming (Netflix, Spotify, etc)",
      "Aplicativos com cobrança mensal",
      "Taxas bancárias",
      "Seguros automáticos",
      "Cafezinho diário",
      "Delivery frequente",
      "Compras por impulso online",
      "Juros de cartão de crédito",
      "Multas e encargos por atraso",
      "Compras parceladas esquecidas",
      "Mensalidades de academia não utilizadas",
      "Planos de celular acima do necessário",
    ],
  },
  "Scripts de Negociação": {
    type: "script",
    scripts: [
      {
        title: "Renegociação de Dívida",
        script: [
          "\"Olá, meu nome é [SEU NOME] e sou cliente há [TEMPO].",
          "Estou passando por uma reorganização financeira e gostaria de negociar minha dívida de R$ [VALOR].",
          "Qual a melhor condição que vocês podem oferecer para pagamento à vista com desconto?",
          "Se não for possível à vista, aceito parcelar em até [X] vezes sem juros.\"",
        ],
        tips: [
          "Ligue no início do mês, quando há mais flexibilidade",
          "Tenha o valor que pode pagar já definido",
          "Peça sempre o desconto à vista primeiro",
        ],
      },
      {
        title: "Cancelamento de Serviço",
        script: [
          "\"Gostaria de cancelar meu plano. Estou reorganizando minhas finanças e preciso reduzir gastos.",
          "Vocês têm algum plano mais econômico ou benefício de fidelidade que possa me ajudar a continuar?\"",
        ],
        tips: [
          "Empresas preferem reter clientes - use isso a seu favor",
          "Esteja preparado para realmente cancelar se não houver oferta",
        ],
      },
      {
        title: "Negociação de Desconto",
        script: [
          "\"Vi que vocês têm uma promoção interessante. Sou cliente há bastante tempo e gostaria de saber se posso ter acesso a esse benefício também.",
          "Se não for possível, vou precisar avaliar outras opções no mercado.\"",
        ],
        tips: [
          "Pesquise os preços dos concorrentes antes",
          "Mencione sua fidelidade como cliente",
        ],
      },
    ],
  },
  "Guia de Substituições Inteligentes": {
    type: "substitution",
    items: [
      { from: "Delivery diário", to: "Marmita caseira", savings: "R$ 400/mês" },
      { from: "Academia cara", to: "Exercícios ao ar livre", savings: "R$ 150/mês" },
      { from: "TV a cabo completa", to: "Streaming básico", savings: "R$ 200/mês" },
      { from: "Café de cafeteria", to: "Café de casa", savings: "R$ 180/mês" },
      { from: "Compras por impulso", to: "Lista de espera 48h", savings: "R$ 300/mês" },
      { from: "Produtos de marca", to: "Marcas alternativas", savings: "R$ 150/mês" },
      { from: "Carro para tudo", to: "Transporte público + apps", savings: "R$ 500/mês" },
      { from: "Almoço fora", to: "Levar marmita", savings: "R$ 350/mês" },
      { from: "Compras no cartão", to: "Compras no débito/dinheiro", savings: "Evita juros" },
      { from: "Várias assinaturas", to: "Rodízio de serviços", savings: "R$ 80/mês" },
    ],
  },
  "Workbook: Descobrindo seus Valores": {
    type: "workbook",
    exercises: [
      {
        title: "O que realmente importa?",
        instructions: "Liste 5 coisas que você não abre mão na vida, independente da sua situação financeira:",
        fields: [
          { label: "1.", lines: 1 },
          { label: "2.", lines: 1 },
          { label: "3.", lines: 1 },
          { label: "4.", lines: 1 },
          { label: "5.", lines: 1 },
        ],
      },
      {
        title: "Seus sonhos",
        instructions: "O que você quer conquistar?",
        fields: [
          { label: "Em 6 meses:", lines: 2 },
          { label: "Em 1 ano:", lines: 2 },
          { label: "Em 5 anos:", lines: 2 },
        ],
      },
      {
        title: "Quanto custa seu sonho?",
        instructions: "Escolha seu principal objetivo e calcule:",
        fields: [
          { label: "Nome do objetivo:", lines: 1 },
          { label: "Valor necessário: R$", lines: 1 },
          { label: "Prazo para conquistar:", lines: 1 },
          { label: "Quanto precisa poupar por mês: R$", lines: 1 },
        ],
      },
      {
        title: "Reflexão",
        instructions: "Responda honestamente:",
        fields: [
          { label: "O que te impede de alcançar esse objetivo hoje?", lines: 3 },
          { label: "O que você está disposto a mudar para chegar lá?", lines: 3 },
        ],
      },
    ],
  },
  "Guia de Investimentos Básicos": {
    type: "investment",
    steps: [
      {
        title: "RESERVA DE EMERGÊNCIA",
        objective: "6 meses de gastos mensais guardados",
        where: "Tesouro Selic ou CDB 100% CDI",
        why: "Segurança e liquidez diária",
      },
      {
        title: "OBJETIVOS DE CURTO PRAZO (até 2 anos)",
        objective: "Viagem, compras planejadas",
        where: "CDB, LCI, LCA",
        why: "Rendimento acima da poupança com baixo risco",
      },
      {
        title: "OBJETIVOS DE MÉDIO PRAZO (2 a 5 anos)",
        objective: "Entrada de imóvel, carro",
        where: "Tesouro IPCA+, Fundos de Renda Fixa",
        why: "Proteção contra inflação",
      },
      {
        title: "OBJETIVOS DE LONGO PRAZO (mais de 5 anos)",
        objective: "Aposentadoria, independência financeira",
        where: "Ações (ETFs), Fundos Imobiliários",
        why: "Maior potencial de retorno",
      },
    ],
  },
  "Checklist de Rotina Semanal": {
    type: "calendar",
    weeklyTasks: [
      "Registrar gastos não lançados",
      "Verificar saldo das contas",
      "Conferir faturas próximas do vencimento",
      "Avaliar progresso das metas de redução",
      "Celebrar pequenas conquistas!",
    ],
    biweeklyTasks: [
      "Analisar gráficos do dashboard",
      "Ajustar orçamento se necessário",
      "Revisar metas de economia",
    ],
    monthlyTasks: [
      "Fazer fechamento completo",
      "Atualizar objetivos financeiros",
      "Planejar o próximo mês",
      "Verificar investimentos",
      "Revisar assinaturas e serviços",
    ],
  },
  "Calendário de Revisão Mensal": {
    type: "calendar",
    weeklyTasks: [
      "Sexta-feira: Registrar gastos da semana",
    ],
    biweeklyTasks: [
      "Dia 15: Revisar orcamento quinzenal",
    ],
    monthlyTasks: [
      "Dia 28: Revisao de metas",
      "Dia 30: Fechamento mensal",
      "Atualizar planilha de investimentos",
      "Verificar progresso dos objetivos",
    ],
  },
  "Guia de Sinais de Alerta": {
    type: "alert",
    levels: [
      {
        level: "ALERTA AMARELO (atenção)",
        color: [234, 179, 8] as [number, number, number],
        items: [
          "Gastou mais que o planejado em uma categoria",
          "Não conseguiu poupar este mês",
          "Esqueceu de registrar gastos por mais de 3 dias",
        ],
      },
      {
        level: "ALERTA LARANJA (agir logo)",
        color: [249, 115, 22] as [number, number, number],
        items: [
          "Usou o cartão de crédito sem planejamento",
          "Atrasou alguma conta",
          "Precisou usar reserva de emergência",
        ],
      },
      {
        level: "ALERTA VERMELHO (urgente)",
        color: [239, 68, 68] as [number, number, number],
        items: [
          "Não está conseguindo pagar contas básicas",
          "Dívidas estão aumentando",
          "Ansiedade financeira frequente",
        ],
      },
    ],
    whatToDo: [
      "Pare e revise seu orçamento",
      "Identifique onde está o problema",
      "Ajuste as metas de redução",
      "Se precisar, busque ajuda profissional",
    ],
  },
};

export function AdminMaterialGenerator() {
  const [contents, setContents] = useState<Content[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [savingUrl, setSavingUrl] = useState<string | null>(null);

  useEffect(() => {
    loadContents();
  }, []);

  // Inicializar URLs quando contents carregar
  useEffect(() => {
    const initialUrls: Record<string, string> = {};
    contents.forEach(c => {
      initialUrls[c.id] = c.url || "";
    });
    setUrls(initialUrls);
  }, [contents]);

  const loadContents = async () => {
    setLoading(true);
    const [contentsRes, modulesRes] = await Promise.all([
      supabase
        .from("contents")
        .select("*")
        .eq("type", "pdf")
        .order("order_index"),
      supabase.from("modules").select("*").order("order_index"),
    ]);

    if (contentsRes.data) setContents(contentsRes.data);
    if (modulesRes.data) setModules(modulesRes.data);
    setLoading(false);
  };

  const getModuleName = (moduleId: string | null) => {
    if (!moduleId) return "Sem modulo";
    const module = modules.find((m) => m.id === moduleId);
    return module ? module.title : "Modulo desconhecido";
  };

  const saveUrl = async (contentId: string) => {
    setSavingUrl(contentId);
    const url = urls[contentId]?.trim() || null;
    
    const { error } = await supabase
      .from("contents")
      .update({ url })
      .eq("id", contentId);
      
    if (error) {
      toast({
        title: "Erro ao salvar URL",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "URL salva!",
        description: "A biblioteca foi atualizada automaticamente.",
      });
      await loadContents();
    }
    setSavingUrl(null);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: "A URL foi copiada para a area de transferencia.",
    });
  };

  const generatePDF = async (content: Content) => {
    setGenerating(content.id);
    
    try {
      const materialData = MATERIAL_DATA[content.title as keyof typeof MATERIAL_DATA];
      
      if (!materialData) {
        toast({
          title: "Material não encontrado",
          description: `Não há template definido para "${content.title}"`,
          variant: "destructive",
        });
        setGenerating(null);
        return;
      }

      let doc;
      const options = { title: content.title, subtitle: "Material exclusivo do programa Seu Dinheiro na Mesa" };

      switch (materialData.type) {
        case "checklist":
          doc = generateChecklistPDF((materialData as any).items, options);
          break;
        case "guide":
          doc = generateGuidePDF((materialData as any).sections, options);
          break;
        case "workbook":
          doc = generateWorkbookPDF((materialData as any).exercises, options);
          break;
        case "script":
          doc = generateScriptPDF((materialData as any).scripts, options);
          break;
        case "substitution":
          doc = generateSubstitutionPDF((materialData as any).items, options);
          break;
        case "investment":
          doc = generateInvestmentGuidePDF((materialData as any).steps, options);
          break;
        case "calendar":
          doc = generateCalendarPDF(
            (materialData as any).weeklyTasks,
            (materialData as any).biweeklyTasks,
            (materialData as any).monthlyTasks,
            options
          );
          break;
        case "alert":
          doc = generateAlertGuidePDF(
            (materialData as any).levels,
            (materialData as any).whatToDo,
            options
          );
          break;
        default:
          throw new Error("Tipo de material não suportado");
      }

      // Generate filename
      const filename = content.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Save PDF
      doc.save(`${filename}.pdf`);

      toast({
        title: "PDF gerado com sucesso!",
        description: `O arquivo "${content.title}" foi baixado.`,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o material.",
        variant: "destructive",
      });
    }

    setGenerating(null);
  };

  const generateAllPDFs = async () => {
    for (const content of contents) {
      if (MATERIAL_DATA[content.title as keyof typeof MATERIAL_DATA]) {
        await generatePDF(content);
        // Small delay between generations
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    
    toast({
      title: "Todos os PDFs gerados!",
      description: "Todos os materiais disponíveis foram baixados.",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando materiais...</p>
        </CardContent>
      </Card>
    );
  }

  const pdfContents = contents.filter(
    (c) => c.type === "pdf" && MATERIAL_DATA[c.title as keyof typeof MATERIAL_DATA]
  );
  const otherContents = contents.filter(
    (c) => c.type === "pdf" && !MATERIAL_DATA[c.title as keyof typeof MATERIAL_DATA]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-blue flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerador de Materiais Complementares
              </CardTitle>
              <CardDescription>
                Gere os PDFs com a identidade visual Economiza
              </CardDescription>
            </div>
            <Button onClick={generateAllPDFs} className="gap-2">
              <Download className="h-4 w-4" />
              Gerar Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {pdfContents.map((content, index) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-xl bg-card hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{content.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getModuleName(content.module_id)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        content.url
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      {content.url ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          URL salva
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Sem URL
                        </>
                      )}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generatePDF(content)}
                      disabled={generating === content.id}
                      className="gap-2"
                    >
                      {generating === content.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Gerar PDF
                    </Button>
                  </div>
                </div>
                
                {/* Campo de URL */}
                <div className="flex items-center gap-2 pl-14">
                  <div className="flex-1 relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cole a URL do PDF (Google Drive, etc.)"
                      value={urls[content.id] || ""}
                      onChange={(e) => setUrls(prev => ({ ...prev, [content.id]: e.target.value }))}
                      className="pl-9 text-sm"
                    />
                  </div>
                  {urls[content.id] && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(urls[content.id])}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => saveUrl(content.id)}
                    disabled={savingUrl === content.id || urls[content.id] === (content.url || "")}
                    className="gap-2 shrink-0"
                  >
                    {savingUrl === content.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar URL
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {otherContents.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Materiais sem template definido
              </h4>
              <div className="grid gap-2">
                {otherContents.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{content.title}</span>
                    </div>
                    <Badge variant="secondary">Template pendente</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-blue">Instrucoes</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Clique em <strong>"Gerar PDF"</strong> para baixar cada material
            </li>
            <li>
              Faca upload do PDF para o Google Drive e copie o link de compartilhamento
            </li>
            <li>
              Cole a URL no campo correspondente e clique em <strong>"Salvar URL"</strong>
            </li>
            <li>
              A biblioteca sera atualizada automaticamente e os alunos poderao acessar
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
