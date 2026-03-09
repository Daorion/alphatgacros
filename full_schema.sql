-- =============================================================
-- Alpha Cross – Full Schema Migration (consolidado)
-- Atualizado em 2026-03-09
-- =============================================================

-- 1. Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'client');

-- 2. Tables

-- profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text,
  avatar_url text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  plan_name text,
  plan_status text DEFAULT 'active',
  next_renewal date,
  last_login timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE (user_id, role)
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- murph_registrations
CREATE TABLE public.murph_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  cpf text NOT NULL,
  phone text NOT NULL,
  shirt_size text NOT NULL,
  receipt_url text,
  payment_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- weekly_workouts
CREATE TABLE public.weekly_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  week_label text,
  day_of_week integer NOT NULL,
  title text NOT NULL,
  description text,
  intensity text DEFAULT 'média',
  tags text[] DEFAULT '{}',
  warmup text,
  activation text,
  strength text,
  wod text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- bank_accounts
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text,
  account_type text NOT NULL DEFAULT 'corrente',
  balance numeric NOT NULL DEFAULT 0,
  color text DEFAULT '#3b82f6',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- financial_categories
CREATE TABLE public.financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  color text DEFAULT '#6366f1',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- recurring_transactions
CREATE TABLE public.recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  frequency text NOT NULL DEFAULT 'mensal',
  day_of_month integer,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  category_id uuid REFERENCES public.financial_categories(id),
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- financial_transactions
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category_id uuid REFERENCES public.financial_categories(id),
  bank_account_id uuid REFERENCES public.bank_accounts(id),
  payment_method text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_id uuid REFERENCES public.recurring_transactions(id),
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_conversations
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  week_start date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_messages
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Functions

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Triggers

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_workouts_updated_at
  BEFORE UPDATE ON public.weekly_workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS on all tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.murph_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- audit_logs
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- murph_registrations
CREATE POLICY "Users can view their own murph registrations" ON public.murph_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own murph registrations" ON public.murph_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own murph registrations" ON public.murph_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all murph registrations" ON public.murph_registrations FOR SELECT USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can update all murph registrations" ON public.murph_registrations FOR UPDATE USING (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'admin'));

-- weekly_workouts
CREATE POLICY "Authenticated users can view workouts" ON public.weekly_workouts FOR SELECT USING (true);
CREATE POLICY "Anyone can view workouts" ON public.weekly_workouts FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can do everything on workouts" ON public.weekly_workouts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- bank_accounts
CREATE POLICY "Admins can do everything on bank_accounts" ON public.bank_accounts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- financial_categories
CREATE POLICY "Admins can do everything on financial_categories" ON public.financial_categories FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- recurring_transactions
CREATE POLICY "Admins can do everything on recurring_transactions" ON public.recurring_transactions FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- financial_transactions
CREATE POLICY "Admins can do everything on financial_transactions" ON public.financial_transactions FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ai_conversations
CREATE POLICY "Users can manage their own conversations" ON public.ai_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_messages
CREATE POLICY "Users can manage messages of their conversations" ON public.ai_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- 7. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed – Financial categories
INSERT INTO public.financial_categories (name, type, color) VALUES
  ('Mensalidades', 'receita', '#22c55e'),
  ('Aulas avulsas', 'receita', '#3b82f6'),
  ('Vendas', 'receita', '#f59e0b'),
  ('Eventos', 'receita', '#8b5cf6'),
  ('Outros (receita)', 'receita', '#6366f1'),
  ('Aluguel', 'despesa', '#ef4444'),
  ('Salários', 'despesa', '#f97316'),
  ('Equipamentos', 'despesa', '#ec4899'),
  ('Manutenção', 'despesa', '#14b8a6'),
  ('Marketing', 'despesa', '#a855f7'),
  ('Outros (despesa)', 'despesa', '#64748b')
ON CONFLICT DO NOTHING;
