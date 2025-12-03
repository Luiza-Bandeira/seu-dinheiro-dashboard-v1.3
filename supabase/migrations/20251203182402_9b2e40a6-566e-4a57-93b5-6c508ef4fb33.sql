-- Admins podem inserir notificações para qualquer usuário
CREATE POLICY "Admins can insert notifications for any user"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem gerenciar módulos - CRUD completo
CREATE POLICY "Admins can insert modules"
ON public.modules FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update modules"
ON public.modules FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete modules"
ON public.modules FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem gerenciar conteúdos - CRUD completo
CREATE POLICY "Admins can insert contents"
ON public.contents FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contents"
ON public.contents FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contents"
ON public.contents FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem visualizar todos os módulos
CREATE POLICY "Admins can view all modules"
ON public.modules FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem visualizar todos os conteúdos
CREATE POLICY "Admins can view all contents"
ON public.contents FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));