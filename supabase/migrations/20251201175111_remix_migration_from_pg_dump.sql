CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: content_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_type AS ENUM (
    'video',
    'pdf',
    'exercise',
    'checklist',
    'extra'
);


--
-- Name: finance_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.finance_type AS ENUM (
    'income',
    'fixed_expense',
    'variable_expense',
    'receivable',
    'debt'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: analytics_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_time integer DEFAULT 0,
    accessed_at timestamp with time zone DEFAULT now() NOT NULL,
    page_visited text
);


--
-- Name: banks_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banks_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    card_limit numeric DEFAULT 0,
    annual_fee numeric DEFAULT 0,
    interest_rate numeric DEFAULT 0,
    other_fees text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT banks_accounts_type_check CHECK ((type = ANY (ARRAY['conta'::text, 'cartao'::text, 'carteira_digital'::text])))
);


--
-- Name: contents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    module_id uuid,
    type public.content_type NOT NULL,
    title text NOT NULL,
    url text,
    description text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: finances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finances (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type public.finance_type NOT NULL,
    category text NOT NULL,
    value numeric(12,2) NOT NULL,
    description text,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    goal_name text NOT NULL,
    target_value numeric(12,2) NOT NULL,
    current_value numeric(12,2) DEFAULT 0,
    deadline date,
    status text DEFAULT 'in_progress'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT goals_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: investments_current; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investments_current (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    current_value numeric DEFAULT 0 NOT NULL,
    estimated_rate numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    payment_status text DEFAULT 'pending'::text,
    mercado_pago_payment_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    avatar_url text,
    phone text,
    profession text,
    is_admin boolean DEFAULT false,
    CONSTRAINT profiles_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    content_id uuid,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone
);


--
-- Name: reduction_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reduction_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    period_type text NOT NULL,
    target_value numeric NOT NULL,
    deadline date,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reduction_goals_period_type_check CHECK ((period_type = ANY (ARRAY['mensal'::text, 'semanal'::text]))),
    CONSTRAINT reduction_goals_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: weekly_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    week_start date NOT NULL,
    week_end date NOT NULL,
    total_spent numeric DEFAULT 0 NOT NULL,
    reduction_goal_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_access analytics_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_access
    ADD CONSTRAINT analytics_access_pkey PRIMARY KEY (id);


--
-- Name: banks_accounts banks_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks_accounts
    ADD CONSTRAINT banks_accounts_pkey PRIMARY KEY (id);


--
-- Name: contents contents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_pkey PRIMARY KEY (id);


--
-- Name: finances finances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finances
    ADD CONSTRAINT finances_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: investments_current investments_current_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments_current
    ADD CONSTRAINT investments_current_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (id);


--
-- Name: progress progress_user_id_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_content_id_key UNIQUE (user_id, content_id);


--
-- Name: reduction_goals reduction_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reduction_goals
    ADD CONSTRAINT reduction_goals_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: weekly_tracking weekly_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_tracking
    ADD CONSTRAINT weekly_tracking_pkey PRIMARY KEY (id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: banks_accounts update_banks_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_banks_accounts_updated_at BEFORE UPDATE ON public.banks_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: goals update_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: investments_current update_investments_current_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_investments_current_updated_at BEFORE UPDATE ON public.investments_current FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reduction_goals update_reduction_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reduction_goals_updated_at BEFORE UPDATE ON public.reduction_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contents contents_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: finances finances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finances
    ADD CONSTRAINT finances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: progress progress_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.contents(id) ON DELETE CASCADE;


--
-- Name: progress progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: weekly_tracking weekly_tracking_reduction_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_tracking
    ADD CONSTRAINT weekly_tracking_reduction_goal_id_fkey FOREIGN KEY (reduction_goal_id) REFERENCES public.reduction_goals(id) ON DELETE SET NULL;


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: analytics_access Admins can view all analytics_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics_access" ON public.analytics_access FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: finances Admins can view all finances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all finances" ON public.finances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: progress Admins can view all progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all progress" ON public.progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contents Paid users can view contents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Paid users can view contents" ON public.contents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.payment_status = 'approved'::text)))));


--
-- Name: modules Paid users can view modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Paid users can view modules" ON public.modules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.payment_status = 'approved'::text)))));


--
-- Name: banks_accounts Users can delete own banks_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own banks_accounts" ON public.banks_accounts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: finances Users can delete own finances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own finances" ON public.finances FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: goals Users can delete own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: investments_current Users can delete own investments_current; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own investments_current" ON public.investments_current FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reduction_goals Users can delete own reduction_goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own reduction_goals" ON public.reduction_goals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: weekly_tracking Users can delete own weekly_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own weekly_tracking" ON public.weekly_tracking FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: analytics_access Users can insert own analytics_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own analytics_access" ON public.analytics_access FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: banks_accounts Users can insert own banks_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own banks_accounts" ON public.banks_accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: finances Users can insert own finances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own finances" ON public.finances FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: goals Users can insert own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: investments_current Users can insert own investments_current; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own investments_current" ON public.investments_current FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Users can insert own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: progress Users can insert own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own progress" ON public.progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reduction_goals Users can insert own reduction_goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own reduction_goals" ON public.reduction_goals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: weekly_tracking Users can insert own weekly_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own weekly_tracking" ON public.weekly_tracking FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: banks_accounts Users can update own banks_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own banks_accounts" ON public.banks_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: finances Users can update own finances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own finances" ON public.finances FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: goals Users can update own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: investments_current Users can update own investments_current; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own investments_current" ON public.investments_current FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: progress Users can update own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own progress" ON public.progress FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: reduction_goals Users can update own reduction_goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reduction_goals" ON public.reduction_goals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: weekly_tracking Users can update own weekly_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own weekly_tracking" ON public.weekly_tracking FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: analytics_access Users can view own analytics_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own analytics_access" ON public.analytics_access FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: banks_accounts Users can view own banks_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own banks_accounts" ON public.banks_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: finances Users can view own finances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own finances" ON public.finances FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: goals Users can view own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: investments_current Users can view own investments_current; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own investments_current" ON public.investments_current FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: progress Users can view own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own progress" ON public.progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reduction_goals Users can view own reduction_goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own reduction_goals" ON public.reduction_goals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: weekly_tracking Users can view own weekly_tracking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own weekly_tracking" ON public.weekly_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analytics_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_access ENABLE ROW LEVEL SECURITY;

--
-- Name: banks_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banks_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: contents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

--
-- Name: finances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: investments_current; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.investments_current ENABLE ROW LEVEL SECURITY;

--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

--
-- Name: reduction_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reduction_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_tracking ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


