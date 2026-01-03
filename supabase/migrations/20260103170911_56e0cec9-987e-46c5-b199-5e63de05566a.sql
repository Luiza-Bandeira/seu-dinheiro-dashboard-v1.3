-- Tabela para armazenar conquistas desbloqueadas pelos usuários
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Tabela para armazenar pontos ganhos
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para brindes disponíveis (gerenciado por admin)
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para resgates de brindes
CREATE TABLE public.user_reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reward_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements" ON public.user_achievements
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_points
CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON public.user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all points" ON public.user_points
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for rewards (todos podem ver brindes ativos)
CREATE POLICY "Everyone can view active rewards" ON public.rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_reward_claims
CREATE POLICY "Users can view own claims" ON public.user_reward_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claims" ON public.user_reward_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all claims" ON public.user_reward_claims
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update claims" ON public.user_reward_claims
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));