
-- Atualizar módulos existentes com novos títulos e descrições
UPDATE modules SET 
  title = 'Colocando Tudo na Mesa',
  description = 'Reúna todas as suas informações financeiras em um só lugar. Cadastre bancos, cartões e dívidas para ter clareza do ponto de partida.'
WHERE order_index = 1;

UPDATE modules SET 
  title = 'Olhando o Dinheiro de Perto',
  description = 'Entenda para onde seu dinheiro está indo. Rastreie gastos, identifique padrões e descubra oportunidades de ajuste.'
WHERE order_index = 2;

UPDATE modules SET 
  title = 'Reorganizando a Vida Financeira',
  description = 'Crie estratégias inteligentes para ajustar seus gastos. Defina metas de redução e aprenda a negociar dívidas.'
WHERE order_index = 3;

-- Criar novos módulos 4, 5 e Bonus
INSERT INTO modules (title, description, order_index) VALUES
  ('Planos e Sonhos', 'Alinhe suas metas financeiras com seus objetivos de vida. Defina para onde quer ir e quanto precisa poupar.', 4),
  ('Autonomia e Rotina Financeira', 'Construa uma rotina sustentável de acompanhamento para manter o controle a longo prazo.', 5),
  ('Encontros ao Vivo (Bônus)', 'Gravações dos encontros ao vivo realizados durante a turma e agendamento de sessões individuais.', 6);

-- Limpar conteúdos existentes para reorganizar
DELETE FROM contents;

-- Módulo 1: Colocando Tudo na Mesa
INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Boas-vindas ao Programa', 'Apresentação do programa e o que esperar da sua jornada financeira', 'video', NULL, 1 FROM modules WHERE order_index = 1;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Materiais Necessários', 'O que você precisa reunir antes de começar', 'video', NULL, 2 FROM modules WHERE order_index = 1;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Documento Base do Planejamento', 'Como usar o documento base para organização inicial', 'video', NULL, 3 FROM modules WHERE order_index = 1;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Documento Base (PDF)', 'Planilha para organização inicial das suas finanças', 'pdf', NULL, 4 FROM modules WHERE order_index = 1;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Tutorial: Cadastrando Bancos e Cartões', 'Como usar a ferramenta para cadastrar suas contas', 'video', NULL, 5 FROM modules WHERE order_index = 1;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Checklist de Documentos', 'Lista completa do que você precisa reunir', 'pdf', NULL, 6 FROM modules WHERE order_index = 1;

-- Módulo 2: Olhando o Dinheiro de Perto
INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Identificando Padrões de Gastos', 'Como analisar para onde o dinheiro vai', 'video', NULL, 1 FROM modules WHERE order_index = 2;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Categorias que Drenam Dinheiro', 'Os vilões do orçamento que você precisa conhecer', 'video', NULL, 2 FROM modules WHERE order_index = 2;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Tutorial: Usando o Orçamento', 'Como lançar receitas e despesas na ferramenta', 'video', NULL, 3 FROM modules WHERE order_index = 2;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Analisando seus Gráficos', 'Como interpretar o dashboard e tomar decisões', 'video', NULL, 4 FROM modules WHERE order_index = 2;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Guia de Categorias', 'Classificação detalhada de despesas', 'pdf', NULL, 5 FROM modules WHERE order_index = 2;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Lista de Gastos Invisíveis', 'Gastos que passam despercebidos no dia a dia', 'pdf', NULL, 6 FROM modules WHERE order_index = 2;

-- Módulo 3: Reorganizando a Vida Financeira
INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Definindo Metas de Redução', 'Como criar limites saudáveis por categoria', 'video', NULL, 1 FROM modules WHERE order_index = 3;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Redução Sem Sofrimento', 'Estratégias inteligentes de corte de gastos', 'video', NULL, 2 FROM modules WHERE order_index = 3;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Tutorial: Metas de Redução na Ferramenta', 'Como usar a funcionalidade de metas', 'video', NULL, 3 FROM modules WHERE order_index = 3;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Negociando Dívidas', 'Scripts e técnicas de negociação', 'video', NULL, 4 FROM modules WHERE order_index = 3;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Scripts de Negociação', 'Modelos prontos para usar em negociações', 'pdf', NULL, 5 FROM modules WHERE order_index = 3;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Guia de Substituições Inteligentes', 'Trocar sem perder qualidade de vida', 'pdf', NULL, 6 FROM modules WHERE order_index = 3;

-- Módulo 4: Planos e Sonhos
INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Definindo Objetivos Claros', 'Como criar metas SMART para suas finanças', 'video', NULL, 1 FROM modules WHERE order_index = 4;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Tutorial: Objetivos na Ferramenta', 'Como usar a funcionalidade de objetivos', 'video', NULL, 2 FROM modules WHERE order_index = 4;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Simulação de Aportes Mensais', 'Quanto poupar para alcançar cada meta', 'video', NULL, 3 FROM modules WHERE order_index = 4;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Investimentos para Iniciantes', 'Primeiros passos no mundo dos investimentos', 'video', NULL, 4 FROM modules WHERE order_index = 4;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Workbook: Descobrindo seus Valores', 'Exercício de autoconhecimento financeiro', 'pdf', NULL, 5 FROM modules WHERE order_index = 4;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Guia de Investimentos Básicos', 'Conceitos fundamentais para começar', 'pdf', NULL, 6 FROM modules WHERE order_index = 4;

-- Módulo 5: Autonomia e Rotina Financeira
INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Criando sua Rotina Financeira', 'Hábitos semanais que funcionam', 'video', NULL, 1 FROM modules WHERE order_index = 5;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Ajustando o Plano', 'Como adaptar quando imprevistos acontecem', 'video', NULL, 2 FROM modules WHERE order_index = 5;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Visão de Longo Prazo', 'Mantendo a clareza por meses e anos', 'video', NULL, 3 FROM modules WHERE order_index = 5;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Checklist de Rotina Semanal', 'O que fazer toda semana para manter o controle', 'pdf', NULL, 4 FROM modules WHERE order_index = 5;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Calendário de Revisão Mensal', 'Template de acompanhamento mensal', 'pdf', NULL, 5 FROM modules WHERE order_index = 5;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Guia de Sinais de Alerta', 'Quando intervir no plano financeiro', 'pdf', NULL, 6 FROM modules WHERE order_index = 5;

-- Módulo 6: Encontros ao Vivo (Bônus)
INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Encontro 1: Colocando na Mesa', 'Gravação do tira-dúvidas da Semana 1', 'video', NULL, 1 FROM modules WHERE order_index = 6;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Encontro 2: Olhando de Perto', 'Gravação do tira-dúvidas da Semana 2', 'video', NULL, 2 FROM modules WHERE order_index = 6;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Agendar Sessão Individual 1', 'Agende sua primeira sessão individual com a especialista', 'extra', 'https://wa.me/5538999273737?text=Finalizei%20o%20segundo%20encontro%20ao%20vivo%20do%20programa%20Seu%20Dinheiro%20na%20Mesa%20e%20quero%20agendar%20minha%20primeira%20sess%C3%A3o%20individual', 3 FROM modules WHERE order_index = 6;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Encontro 3: Reorganizando', 'Gravação do tira-dúvidas da Semana 3', 'video', NULL, 4 FROM modules WHERE order_index = 6;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Encontro 4: Planos e Sonhos', 'Gravação do tira-dúvidas da Semana 4', 'video', NULL, 5 FROM modules WHERE order_index = 6;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Encontro 5: Autonomia', 'Gravação do tira-dúvidas da Semana 5', 'video', NULL, 6 FROM modules WHERE order_index = 6;

INSERT INTO contents (module_id, title, description, type, url, order_index)
SELECT id, 'Agendar Sessão Individual 2 (Fechamento)', 'Agende sua sessão de fechamento com a especialista', 'extra', 'https://wa.me/5538999273737?text=Estou%20na%20%C3%BAltima%20semana%20do%20programa%20Seu%20Dinheiro%20na%20Mesa%20e%20quero%20agendar%20minha%20sess%C3%A3o%20de%20fechamento', 7 FROM modules WHERE order_index = 6;
