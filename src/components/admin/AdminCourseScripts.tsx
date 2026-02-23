import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Video, 
  FileText, 
  CheckSquare, 
  Clock, 
  Target, 
  Users, 
  Lightbulb,
  CalendarDays,
  MessageSquare,
  Wrench
} from "lucide-react";

interface ModuleScript {
  number: number;
  title: string;
  objective: string;
  tools: string[];
  weekDuration: string;
  checklistGravacao: string[];
  perguntasFrequentes: string[];
  tarefaSemana: string;
  materialApoio: string[];
}

interface LiveScript {
  number: number;
  title: string;
  week: string;
  objective: string;
  roteiro: {
    tempo: string;
    atividade: string;
    notas: string;
  }[];
  dicas: string[];
}

const moduleScripts: ModuleScript[] = [
  {
    number: 1,
    title: "Colocando Tudo na Mesa",
    objective: "Reunir todas as informações financeiras em um só lugar para criar clareza sobre o ponto de partida.",
    tools: ["Bancos e Cartões", "Dívidas a Pagar", "Dívidas a Receber", "Patrimônio"],
    weekDuration: "Semana 1",
    checklistGravacao: [
      "Explicar a importância de ter todas as informações centralizadas",
      "Mostrar como cadastrar contas bancárias na ferramenta",
      "Demonstrar o cadastro de cartões de crédito com limites",
      "Ensinar a registrar dívidas a pagar e a receber",
      "Mostrar como o pagamento de dívidas gera automaticamente uma despesa no mês",
      "Demonstrar o cadastro de bens patrimoniais (imóveis, veículos, joias, etc.)",
      "Explicar como os bens patrimoniais impactam a Evolução do Patrimônio",
      "Enfatizar a organização de extratos e documentos",
    ],
    perguntasFrequentes: [
      "Devo cadastrar contas que quase não uso?",
      "Como lidar com cartões compartilhados?",
      "E se eu não souber o valor exato de uma dívida?",
      "Preciso cadastrar dívidas pequenas também?",
      "Devo cadastrar bens financiados? Como fica o valor?",
      "Quando pago uma dívida, ela aparece como despesa automaticamente?",
    ],
    tarefaSemana: "Cadastrar todos os bancos, cartões, dívidas e bens patrimoniais na ferramenta. Reunir extratos dos últimos 3 meses.",
    materialApoio: [
      "Checklist de Documentos Necessários (PDF)",
      "Guia de Organização de Extratos (PDF)",
      "Guia de Cadastro de Patrimônio (PDF)",
    ],
  },
  {
    number: 2,
    title: "Olhando o Dinheiro de Perto",
    objective: "Rastrear gastos e identificar padrões de comportamento financeiro.",
    tools: ["Orçamento", "Dashboard", "Relatórios"],
    weekDuration: "Semana 2",
    checklistGravacao: [
      "Explicar as categorias de despesas e como classificar",
      "Mostrar como lançar receitas e despesas no orçamento",
      "Demonstrar a análise de gráficos do dashboard",
      "Identificar os 'gastos invisíveis' mais comuns",
      "Ensinar a interpretar os relatórios de gastos por categoria",
    ],
    perguntasFrequentes: [
      "Em qual categoria devo colocar X gasto?",
      "Como lidar com gastos que se encaixam em várias categorias?",
      "Devo lançar gastos muito pequenos (ex: café)?",
      "Como identificar gastos que posso cortar?",
    ],
    tarefaSemana: "Lançar todos os gastos do mês atual. Analisar o gráfico de categorias e identificar 3 áreas de oportunidade.",
    materialApoio: [
      "Guia de Categorias de Despesas (PDF)",
      "Lista de Gastos Invisíveis (PDF)",
    ],
  },
  {
    number: 3,
    title: "Reorganizando a Vida Financeira",
    objective: "Criar estratégias de redução de gastos, negociar dívidas e entender o impacto dos pagamentos no orçamento.",
    tools: ["Metas de Redução", "Acompanhamento Semanal", "Gestão de Dívidas", "Evolução do Patrimônio"],
    weekDuration: "Semana 3",
    checklistGravacao: [
      "Ensinar a definir metas realistas de redução por categoria",
      "Mostrar a funcionalidade de acompanhamento semanal",
      "Apresentar técnicas de substituição inteligente de gastos",
      "Demonstrar scripts de negociação de dívidas",
      "Explicar a priorização de pagamento de dívidas",
      "Mostrar como pagamentos de dívidas aparecem automaticamente nas despesas do mês",
      "Demonstrar a tela de Evolução do Patrimônio e como dívidas pagas liberam patrimônio líquido",
    ],
    perguntasFrequentes: [
      "Quanto devo tentar reduzir em cada categoria?",
      "E se eu não conseguir cumprir a meta de redução?",
      "Como negociar dívidas antigas?",
      "Devo priorizar pagar dívidas ou guardar dinheiro?",
      "Quando pago uma dívida, como isso afeta meu patrimônio?",
    ],
    tarefaSemana: "Criar pelo menos 3 metas de redução. Usar um script para negociar uma dívida (se houver). Verificar a Evolução do Patrimônio.",
    materialApoio: [
      "Scripts de Negociação de Dívidas (PDF)",
      "Guia de Substituições Inteligentes (PDF)",
      "Guia de Evolução Patrimonial (PDF)",
    ],
  },
  {
    number: 4,
    title: "Planos e Sonhos",
    objective: "Alinhar metas financeiras com objetivos de vida e começar a planejar investimentos.",
    tools: ["Objetivos Financeiros", "Simulação de Aportes", "Investimentos"],
    weekDuration: "Semana 4",
    checklistGravacao: [
      "Ensinar a criar objetivos SMART para finanças",
      "Demonstrar a funcionalidade de objetivos na ferramenta",
      "Mostrar como usar a simulação de aportes mensais",
      "Introduzir conceitos básicos de investimentos",
      "Conectar valores pessoais com metas financeiras",
    ],
    perguntasFrequentes: [
      "Quanto devo guardar por mês?",
      "Qual a diferença entre poupança e investimento?",
      "Por onde começar a investir?",
      "E se eu não conseguir poupar o valor planejado?",
    ],
    tarefaSemana: "Criar pelo menos 2 objetivos financeiros na ferramenta. Fazer uma simulação de aportes para cada.",
    materialApoio: [
      "Workbook: Descobrindo seus Valores (PDF)",
      "Guia de Investimentos Básicos (PDF)",
    ],
  },
  {
    number: 5,
    title: "Autonomia e Rotina Financeira",
    objective: "Criar uma rotina sustentável de acompanhamento financeiro para longo prazo.",
    tools: ["Dashboard", "Relatórios", "Evolução do Patrimônio", "Todas as ferramentas integradas"],
    weekDuration: "Semana 5",
    checklistGravacao: [
      "Apresentar uma rotina semanal ideal de acompanhamento",
      "Ensinar a identificar sinais de alerta no orçamento",
      "Mostrar como ajustar o plano quando imprevistos acontecem",
      "Demonstrar como acompanhar a Evolução do Patrimônio (mensal, trimestral e anual)",
      "Explicar como bens + investimentos compõem o patrimônio total",
      "Reforçar a importância da consistência",
      "Celebrar o progresso e preparar para a autonomia",
    ],
    perguntasFrequentes: [
      "Quanto tempo devo dedicar por semana às finanças?",
      "O que fazer quando surgir um gasto inesperado?",
      "Como manter a motivação a longo prazo?",
      "Preciso continuar usando a ferramenta para sempre?",
      "Com que frequência devo atualizar o valor dos meus bens?",
    ],
    tarefaSemana: "Definir dia e horário fixo para revisão semanal. Fazer a primeira revisão completa usando o checklist. Verificar a Evolução do Patrimônio.",
    materialApoio: [
      "Checklist de Rotina Semanal (PDF)",
      "Calendário de Revisão Mensal (PDF)",
      "Guia de Sinais de Alerta (PDF)",
      "Guia de Acompanhamento Patrimonial (PDF)",
    ],
  },
];

const liveScripts: LiveScript[] = [
  {
    number: 1,
    title: "Encontro 1: Colocando na Mesa",
    week: "Semana 1",
    objective: "Acolher, apresentar o programa e resolver dúvidas do preenchimento inicial.",
    roteiro: [
      { tempo: "0-5min", atividade: "Boas-vindas", notas: "Apresentação pessoal, agradecimento pela presença, criar ambiente acolhedor" },
      { tempo: "5-15min", atividade: "Visão geral do programa", notas: "Explicar as 5 semanas, ferramentas disponíveis, como tirar máximo proveito" },
      { tempo: "15-25min", atividade: "Dúvidas sobre o preenchimento", notas: "Responder dúvidas sobre bancos, cartões, dívidas e patrimônio" },
      { tempo: "25-40min", atividade: "Demonstração ao vivo", notas: "Mostrar como preencher informações básicas e cadastrar bens patrimoniais na ferramenta" },
      { tempo: "40-50min", atividade: "Fluxo de pagamento de dívidas", notas: "Demonstrar como pagar dívida e ver a despesa gerada automaticamente" },
      { tempo: "50-55min", atividade: "Perguntas e respostas", notas: "Abrir para dúvidas gerais das pessoas participantes" },
      { tempo: "55-60min", atividade: "Tarefa da semana", notas: "Reforçar o que precisa estar pronto para a próxima semana, incluindo cadastro de patrimônio" },
    ],
    dicas: [
      "Começar pedindo que cada pessoa se apresente brevemente (nome e expectativa)",
      "Normalizar a sensação de 'bagunça financeira' no início",
      "Reforçar que não há julgamento sobre a situação atual",
      "Destacar a importância de cadastrar bens para ter visão completa do patrimônio",
    ],
  },
  {
    number: 2,
    title: "Encontro 2: Olhando de Perto",
    week: "Semana 2",
    objective: "Ensinar a analisar padrões de gastos e usar o orçamento.",
    roteiro: [
      { tempo: "0-5min", atividade: "Abertura", notas: "Como foi a semana? Conseguiram reunir os documentos?" },
      { tempo: "5-20min", atividade: "Padrões de gastos", notas: "Explicar como identificar para onde o dinheiro está indo" },
      { tempo: "20-35min", atividade: "Demonstração do orçamento", notas: "Mostrar ao vivo como lançar receitas e despesas" },
      { tempo: "35-50min", atividade: "Análise de casos", notas: "Analisar exemplos anonimizados de padrões de gastos" },
      { tempo: "50-55min", atividade: "Perguntas e respostas", notas: "Resolver dúvidas das pessoas participantes" },
      { tempo: "55-60min", atividade: "Liberação da sessão individual", notas: "Explicar que agora podem agendar a primeira sessão individual" },
    ],
    dicas: [
      "Ao final, lembrar que a sessão individual 1 está liberada",
      "Trazer exemplos reais (anonimizados) de descobertas comuns",
      "Focar na sensação de 'aha!' quando percebem os padrões",
    ],
  },
  {
    number: 3,
    title: "Encontro 3: Reorganizando",
    week: "Semana 3",
    objective: "Criar estratégias de redução e aprender a negociar dívidas.",
    roteiro: [
      { tempo: "0-5min", atividade: "Abertura", notas: "Check-in: como está o rastreamento de gastos?" },
      { tempo: "5-20min", atividade: "Metas de redução", notas: "Como definir limites por categoria sem sofrer" },
      { tempo: "20-35min", atividade: "Demonstração prática", notas: "Criar metas de redução ao vivo na ferramenta" },
      { tempo: "35-50min", atividade: "Negociação de dívidas", notas: "Scripts e técnicas para renegociar dívidas" },
      { tempo: "50-55min", atividade: "Perguntas e respostas", notas: "Resolver dúvidas das pessoas participantes" },
      { tempo: "55-60min", atividade: "Tarefa da semana", notas: "Criar pelo menos 3 metas de redução" },
    ],
    dicas: [
      "Fazer role-play de negociação de dívidas",
      "Celebrar pequenas vitórias de quem já conseguiu reduzir algo",
      "Normalizar a dificuldade de cortar gastos emocionais",
    ],
  },
  {
    number: 4,
    title: "Encontro 4: Planos e Sonhos",
    week: "Semana 4",
    objective: "Alinhar metas financeiras com objetivos de vida.",
    roteiro: [
      { tempo: "0-5min", atividade: "Abertura", notas: "Como está o progresso das metas de redução?" },
      { tempo: "5-20min", atividade: "Definindo objetivos", notas: "Como criar metas SMART para finanças" },
      { tempo: "20-35min", atividade: "Simulação de aportes", notas: "Demonstrar como calcular quanto poupar por mês" },
      { tempo: "35-50min", atividade: "Investimentos para iniciantes", notas: "Conceitos básicos para quem nunca investiu" },
      { tempo: "50-55min", atividade: "Perguntas e respostas", notas: "Resolver dúvidas das pessoas participantes" },
      { tempo: "55-60min", atividade: "Tarefa da semana", notas: "Criar pelo menos 2 objetivos financeiros" },
    ],
    dicas: [
      "Conectar objetivos financeiros com sonhos de vida",
      "Usar exemplos inspiradores de realizações possíveis",
      "Desmistificar investimentos (não precisa ser complicado)",
    ],
  },
  {
    number: 5,
    title: "Encontro 5: Autonomia",
    week: "Semana 5",
    objective: "Criar rotina sustentável e preparar para a autonomia.",
    roteiro: [
      { tempo: "0-5min", atividade: "Abertura", notas: "Celebrar o progresso de todas as pessoas" },
      { tempo: "5-20min", atividade: "Rotina financeira", notas: "Como criar hábitos semanais de acompanhamento" },
      { tempo: "20-35min", atividade: "Evolução do Patrimônio", notas: "Mostrar a tela de Evolução do Patrimônio e como interpretar os gráficos (mensal, trimestral, anual)" },
      { tempo: "35-50min", atividade: "Visão de longo prazo", notas: "Manter a clareza financeira, acompanhar investimentos e bens ao longo do tempo" },
      { tempo: "50-55min", atividade: "Perguntas e respostas", notas: "Resolver dúvidas finais" },
      { tempo: "55-60min", atividade: "Fechamento", notas: "Lembrar sobre a sessão individual de fechamento" },
    ],
    dicas: [
      "Momento emocional - reconhecer a jornada",
      "Pedir feedback sobre o programa",
      "Enfatizar que a sessão individual 2 é para consolidar o plano",
      "Mostrar como a Evolução do Patrimônio evidencia o progresso real",
    ],
  },
];

const individualSessions = [
  {
    number: 1,
    title: "Sessão Individual 1",
    disponibilidade: "Após Encontro ao Vivo 2",
    objetivo: "Análise personalizada do progresso e estratégias customizadas.",
    duracao: "30-45 minutos",
    topicos: [
      "Revisar o preenchimento das informações na ferramenta",
      "Verificar se o patrimônio (bens e investimentos) está cadastrado corretamente",
      "Analisar padrões específicos de gastos da pessoa",
      "Verificar se pagamentos de dívidas estão refletindo nas despesas",
      "Identificar oportunidades de economia personalizadas",
      "Responder dúvidas específicas sobre a situação financeira",
      "Definir próximos passos prioritários",
    ],
    perguntasGuia: [
      "Como você está se sentindo em relação à organização das informações?",
      "Qual foi a maior descoberta até agora sobre seus gastos?",
      "Tem alguma área que está achando mais difícil de controlar?",
      "Há alguma dívida específica que precisa de atenção especial?",
      "Você já cadastrou todos os seus bens no Patrimônio?",
    ],
  },
  {
    number: 2,
    title: "Sessão Individual 2 (Fechamento)",
    disponibilidade: "Semana 5",
    objetivo: "Consolidar o plano e preparar para a autonomia.",
    duracao: "30-45 minutos",
    topicos: [
      "Revisar todo o progresso desde o início do programa",
      "Avaliar as metas de redução e objetivos criados",
      "Analisar a Evolução do Patrimônio ao longo do programa",
      "Ajustar o plano conforme necessidades",
      "Definir rotina de acompanhamento pós-programa",
      "Celebrar conquistas e definir próximos passos",
    ],
    perguntasGuia: [
      "O que mudou desde que você começou o programa?",
      "Quais hábitos você pretende manter?",
      "Tem alguma meta que precisa de ajuste?",
      "Como você se sente sobre cuidar das finanças de forma autônoma?",
      "Como está a evolução do seu patrimônio desde o início?",
    ],
  },
];

export function AdminCourseScripts() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-blue">
            <BookOpen className="h-5 w-5" />
            Roteiros do Curso
          </CardTitle>
          <CardDescription>
            Guias completos para gravação de aulas e condução de encontros ao vivo
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="modules">Módulos (1-5)</TabsTrigger>
            <TabsTrigger value="lives">Encontros ao Vivo</TabsTrigger>
            <TabsTrigger value="individual">Sessões Individuais</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Visão Geral */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estrutura do Programa: 5 Semanas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {moduleScripts.map((module) => (
                  <div 
                    key={module.number}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-gradient-to-r from-background to-muted/30"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{module.number}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{module.title}</h3>
                        <Badge variant="outline">{module.weekDuration}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{module.objective}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {module.tools.map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            <Wrench className="h-3 w-3 mr-1" />
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-magenta" />
                  Encontros ao Vivo (Bônus)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {liveScripts.map((live) => (
                    <li key={live.number} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="w-8 justify-center">{live.number}</Badge>
                      <span>{live.title}</span>
                      <span className="text-muted-foreground">- {live.week}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-magenta" />
                  Sessões Individuais (Bônus)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {individualSessions.map((session) => (
                    <li key={session.number} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-8 justify-center">{session.number}</Badge>
                        <span className="font-medium">{session.title}</span>
                      </div>
                      <p className="text-muted-foreground ml-10 mt-1">{session.disponibilidade}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Módulos */}
        <TabsContent value="modules" className="mt-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {moduleScripts.map((module) => (
              <AccordionItem 
                key={module.number} 
                value={`module-${module.number}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge className="bg-primary">{module.weekDuration}</Badge>
                    <span className="font-semibold">Módulo {module.number}: {module.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Objetivo */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      Objetivo do Módulo
                    </h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {module.objective}
                    </p>
                  </div>

                  {/* Ferramentas */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Ferramentas Utilizadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {module.tools.map((tool) => (
                        <Badge key={tool} variant="secondary">{tool}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Checklist de Gravação */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-red-500" />
                      Checklist de Gravação
                    </h4>
                    <ul className="space-y-2">
                      {module.checklistGravacao.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Perguntas Frequentes */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Perguntas Frequentes (para antecipar)
                    </h4>
                    <ul className="space-y-2">
                      {module.perguntasFrequentes.map((pergunta, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span className="italic">{pergunta}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tarefa da Semana */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      Tarefa da Semana
                    </h4>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      {module.tarefaSemana}
                    </p>
                  </div>

                  {/* Material de Apoio */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Materiais de Apoio (PDFs)
                    </h4>
                    <ul className="space-y-1">
                      {module.materialApoio.map((material, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Encontros ao Vivo */}
        <TabsContent value="lives" className="mt-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {liveScripts.map((live) => (
              <AccordionItem 
                key={live.number} 
                value={`live-${live.number}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="bg-brand-magenta/10 text-brand-magenta border-brand-magenta">
                      {live.week}
                    </Badge>
                    <span className="font-semibold">{live.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Objetivo */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      Objetivo
                    </h4>
                    <p className="text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {live.objective}
                    </p>
                  </div>

                  {/* Roteiro */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-primary" />
                      Roteiro (60 minutos)
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium w-24">Tempo</th>
                            <th className="text-left p-3 font-medium w-40">Atividade</th>
                            <th className="text-left p-3 font-medium">Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {live.roteiro.map((item, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-3 font-mono text-xs">{item.tempo}</td>
                              <td className="p-3 font-medium">{item.atividade}</td>
                              <td className="p-3 text-muted-foreground">{item.notas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dicas */}
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Dicas para Condução
                    </h4>
                    <ul className="space-y-2">
                      {live.dicas.map((dica, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                          <span className="text-amber-600">💡</span>
                          <span>{dica}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Sessões Individuais */}
        <TabsContent value="individual" className="mt-6 space-y-6">
          {individualSessions.map((session) => (
            <Card key={session.number}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-brand-magenta" />
                    {session.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{session.disponibilidade}</Badge>
                    <Badge variant="secondary">{session.duracao}</Badge>
                  </div>
                </div>
                <CardDescription>{session.objetivo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tópicos */}
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                    Tópicos a Cobrir
                  </h4>
                  <ul className="space-y-2">
                    {session.topicos.map((topico, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{topico}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Perguntas Guia */}
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Perguntas-Guia
                  </h4>
                  <div className="grid gap-2">
                    {session.perguntasGuia.map((pergunta, i) => (
                      <div 
                        key={i} 
                        className="p-3 bg-muted/50 rounded-lg text-sm italic border-l-4 border-brand-magenta"
                      >
                        "{pergunta}"
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
