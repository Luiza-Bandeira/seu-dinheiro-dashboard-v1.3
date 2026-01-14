-- Criar tabela de configurações do site
CREATE TABLE public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração inicial do vídeo
INSERT INTO public.site_settings (setting_key, setting_value) 
VALUES ('landing_video_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ');

-- Habilitar RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler as configurações (necessário para a landing page pública)
CREATE POLICY "Anyone can read site_settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Apenas admins podem inserir configurações
CREATE POLICY "Admins can insert site_settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar configurações
CREATE POLICY "Admins can update site_settings" 
ON public.site_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar configurações
CREATE POLICY "Admins can delete site_settings" 
ON public.site_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();