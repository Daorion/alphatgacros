-- =============================================================
-- Alpha Cross – Transferência Completa (Schema + Dados)
-- Gerado em: 2026-03-09
-- Execute este arquivo no SQL Editor do novo projeto Supabase
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

-- =============================================================
-- 8. DATA SEED - Dados atuais do banco
-- =============================================================

-- NOTA: Os dados de profiles e user_roles são criados automaticamente
-- pelo trigger on_auth_user_created quando um usuário se cadastra.
-- Após criar seu primeiro usuário, promova-o a admin:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('UUID-DO-USUARIO', 'admin') ON CONFLICT DO NOTHING;

-- =====================
-- financial_categories
-- =====================
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('c7c80767-1b12-4d98-849b-a5e8b0c61820', 'Mensalidades', 'receita', '#22c55e', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('d321ef1d-51d9-4302-8816-ede90507ce34', 'Wellhub/Gympass', 'receita', '#06b6d4', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('c84cd9f4-ee5c-4cae-9706-ce40ce9894fd', 'TotalPass', 'receita', '#8b5cf6', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('04fa1f08-e73e-47cb-9d7f-b919f8d6942a', 'Matrícula', 'receita', '#f59e0b', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('f1d42c20-3719-412e-9cbd-cce3fc80b97e', 'Vendas', 'receita', '#ec4899', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('1969094b-10dd-498b-adae-3cebf7e2fcf2', 'Aluguel', 'despesa', '#ef4444', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('bf2967fc-1258-4eb9-b052-2585aa1ed0c3', 'Energia', 'despesa', '#f97316', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('04a4fa71-09a5-47c0-bd2d-b18778e50084', 'Água', 'despesa', '#0ea5e9', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('4f0e7e4d-7cfc-4700-b3e6-fe00e325c849', 'Internet', 'despesa', '#6366f1', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('1d912a14-347f-45b4-ad8e-b6451f04d2d9', 'Salários', 'despesa', '#dc2626', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('a3c98502-9284-4206-b4ab-9396e5242c91', 'Equipamentos', 'despesa', '#a855f7', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('9a7cc3e3-3e07-4b2a-b96f-d78e8f989032', 'Manutenção', 'despesa', '#64748b', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('7c73106e-a13d-4f33-af9b-a774d050ba78', 'Marketing', 'despesa', '#e11d48', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('f5dac644-e360-4411-8d56-9e24120a185b', 'Impostos', 'despesa', '#78716c', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('4f6320d1-944b-4ee9-8d3c-30c77b272799', 'Outros', 'despesa', '#94a3b8', true, '2026-03-02 20:42:21.622966+00');
INSERT INTO public.financial_categories (id, name, type, color, is_active, created_at) VALUES ('996321fd-73c9-4d52-a9eb-da6eb481d273', 'Outros', 'receita', '#a3e635', true, '2026-03-02 20:42:21.622966+00');

-- =====================
-- recurring_transactions
-- =====================
INSERT INTO public.recurring_transactions (id, description, type, amount, frequency, day_of_month, start_date, end_date, category_id, bank_account_id, is_active, created_by, created_at) VALUES ('15ee5aee-58db-4c87-8d9c-d4b1138f6d48', 'NEXTFIT', 'despesa', 235.90, 'mensal', NULL, '2026-03-02', NULL, '4f6320d1-944b-4ee9-8d3c-30c77b272799', NULL, true, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:41:55.890729+00');
INSERT INTO public.recurring_transactions (id, description, type, amount, frequency, day_of_month, start_date, end_date, category_id, bank_account_id, is_active, created_by, created_at) VALUES ('3b1d6137-db14-4c44-88af-0867378bdf0c', 'CONTADORA', 'despesa', 300.00, 'mensal', NULL, '2026-03-02', NULL, '4f6320d1-944b-4ee9-8d3c-30c77b272799', NULL, true, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:03:55.169488+00');

-- =====================
-- financial_transactions
-- =====================
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('9279bb62-9a61-41cf-94d1-05c948655368', 'CONTA DE AGUA', 'despesa', 210.30, '2026-01-05', '04a4fa71-09a5-47c0-bd2d-b18778e50084', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:14:49.88366+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('5ea1fe0c-b2d8-4403-ba06-9276633ba819', 'CONTA DE AGUA', 'despesa', 284.96, '2026-02-05', '04a4fa71-09a5-47c0-bd2d-b18778e50084', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:15:20.394894+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('0bd5c518-cf55-40e2-8d12-6561629275c2', 'ERIKA', 'despesa', 1000.00, '2026-03-02', '1d912a14-347f-45b4-ad8e-b6451f04d2d9', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:07:55.071726+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('7f685505-0142-437c-b3f5-46a94af4785f', 'CARTAO CREDITO', 'despesa', 2000.00, '2026-03-02', '4f6320d1-944b-4ee9-8d3c-30c77b272799', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:08:55.355896+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('63e4ba12-5495-478d-9463-fa8c091922ea', 'CONTA DE AGUA', 'despesa', 211.75, '2026-03-05', '04a4fa71-09a5-47c0-bd2d-b18778e50084', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:16:26.405638+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('bdfc8efc-df17-4767-9122-1c79ba9658f5', 'CONTA DE ENERGIA', 'despesa', 793.54, '2026-03-16', 'bf2967fc-1258-4eb9-b052-2585aa1ed0c3', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:13:51.580052+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('9791f255-5b7b-40cd-926c-a4b060c9dbcb', 'KATRIEL', 'despesa', 1000.00, '2026-03-20', '1d912a14-347f-45b4-ad8e-b6451f04d2d9', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 23:07:33.755912+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('7ac8d2e4-e3f0-49c9-a0bc-c8b51265cc5a', 'ALUGUEL', 'despesa', 4442.00, '2026-03-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:06:35.033752+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('9a97929d-1393-4bb1-9e4c-74230bd4fa7c', 'ALUGUEL', 'despesa', 4442.00, '2026-04-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:10:06.310864+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('cc12f66a-7531-40d1-9440-5bd6eb4618fe', 'CREF - ANUIDADE 2026', 'despesa', 784.84, '2026-05-15', '4f6320d1-944b-4ee9-8d3c-30c77b272799', NULL, NULL, false, NULL, 'ANUIDADE 2026 - PAGANDO ATE 15/06 DESCONTO DE 50% - VALOR INTEGRAL: r$1.569,68', '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 21:24:11.202848+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('8589744e-9559-4988-8f6e-4210532dd4bf', 'ALIGUEL', 'despesa', 4442.00, '2026-05-29', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:10:44.809597+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('ee7f86e1-ef2a-4c39-8759-a181c15fea9d', 'ALUGUEL', 'despesa', 4442.00, '2026-06-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:11:15.180127+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('d2dc11ac-38a5-4fdb-a86c-3dba1a54b0f8', 'ALUGUEL', 'despesa', 4442.00, '2026-07-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:11:39.774292+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('b67a269e-af7a-4f5d-9c76-a55733348fb5', 'ALUGUEL', 'despesa', 4442.00, '2026-08-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:12:07.198564+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('b7b8b43d-1271-4316-9732-5cffb9f23aa4', 'ALUGUEL', 'despesa', 4442.00, '2026-09-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:12:31.33569+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('110e1b95-5e45-4d5a-bd43-3dfc145dc30e', 'ALUGUEL', 'despesa', 4442.00, '2026-10-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:12:59.401784+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('935f2276-7ce9-4c2e-8d2e-7fc0d578d31f', 'ALUGUEL', 'despesa', 4442.00, '2026-11-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:14:31.75093+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('2f2d045c-333a-4e22-83ab-43d3ba54df1b', 'ALUGUEL', 'despesa', 4442.00, '2026-12-30', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:15:13.516495+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('cb517acb-57e6-457b-810d-836950426dd9', 'ALUGUEL', 'despesa', 4442.00, '2027-01-29', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:15:48.072111+00');
INSERT INTO public.financial_transactions (id, description, type, amount, date, category_id, bank_account_id, payment_method, is_recurring, recurring_id, notes, created_by, created_at) VALUES ('c93433d8-aa7e-4485-b3fc-dec1ce68c0b3', 'ALUGUEL', 'despesa', 4442.00, '2027-02-26', '1969094b-10dd-498b-adae-3cebf7e2fcf2', NULL, NULL, false, NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-03-02 22:16:13.620676+00');

-- =====================
-- weekly_workouts (Semana 01 - Base, week_start: 2026-01-05)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('160aaaa0-a4aa-4f6d-b839-58e541019c94', '2026-01-05', 'Semana 01 - Base', 0, 'Força - Back Squat', NULL, 'alta', ARRAY['força','engine']::text[], '200 m Run
5 Min Mobilidade', '3 Rounds
10 Air Squat
10" Squat Hold', 'Back Squat
1 x 10 - 40%
2 x 6 - 50%
2 x 5 - 60%
2 x 3 - 70%

DB Lunges - deficit
3 x 10 (R/L)', 'FOR TIME
100 W. Lunges
4 Rounds:
10 Wall Ball
10 Burpee Box Jump Over
100 m Run
then...
100 W. Lunges', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('a2b921b2-c49c-4848-849b-273218bfd99a', '2026-01-05', 'Semana 01 - Base', 1, 'Core + Push', NULL, 'média', ARRAY['força','engine','ginástica']::text[], '200 m Run
5 min Mobilidade - Tórax', '3 Rounds
20 Jump Jack
10 Push-Up
10 Hollow Hold
10 Hollow Rock
10 Russian Twist
10 Zumbie Crunch', '4 Rounds
10 Floor Press
10 Shoulder Press
10 Triceps Francês DB', '3 Rounds FT
10 Power Clean 40/25 Kg
10 Step Box Over
10 Burpee Over Line
100 m Run
Time Cap 8 min', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('bb55274e-8f1f-4728-9db7-a54b4d11e349', '2026-01-05', 'Semana 01 - Base', 2, 'Potência - Clean', NULL, 'média', ARRAY['potência','engine']::text[], '200 m Run
5 Min Mobilidade', 'Core Edition
4 Rounds
10 V-Up
10 Hollow Hold
10 Hollow Rock
10 Russian Twist
10 Zumbie Crunch', 'Power Clean + Hang Clean
10 x 2 + 2 - máximo 60%
ATENÇÃO MÁXIMO 60%', 'AMRAP 10 min
5 Thrusters
5 Burpee O. Bar
200 m Run', 'COACH USEM O TEMPO PARA TÉCNICA', NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('e24ffd35-0629-4c07-b549-7d4787dfd628', '2026-01-05', 'Semana 01 - Base', 3, 'Força - Deadlift', NULL, 'média', ARRAY['força','engine']::text[], '200 m Run
5 Min Mobilidade', '3 Rounds
10 Muscle Clean
10 DB Push-Press
10 Hang Clean
10 Clean Pull', 'Deadlift
1 x 8 - 40%
2 x 6 - 50%
2 x 4 - 60%

Hip Thruster
3 x 8-10', '3 Round FT
5 Hang Power Clean 40/25 Kg
5 Wall Ball 20/16 Lbs
5 Devil Press
10 Push-up
100 m Run
Time Cap 9 min', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('9af2cccc-f85e-4ee3-bb1b-96059519f10a', '2026-01-05', 'Semana 01 - Base', 4, 'Engine + Ginástica', NULL, 'média', ARRAY['engine','ginástica']::text[], '200 m Run
5 Min Mobilidade', '3 Rounds
20 Dead March
10 Single Leg Glute Bridge (R/L)
20 Pass Lateral (R/L)', NULL, 'FOR TIME IN TRIO
20 Step Box syn
20 Goblet Squat Syn
20 Knees to Elbows/T2B
Time Cap 25 min', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('5d17917c-4482-4b89-a635-c2d6be628766', '2026-01-05', 'Semana 01 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'FOR TIME
15 KM Air Bike
enquanto isso:
4 Rounds
5 Hang Power Clean 40/25 Kg
5 Wall Ball 20/16 Lbs
5 Burpee O. Bar
200 m Run
Time Cap 9 min', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

-- =====================
-- weekly_workouts (Semana 02 - Base, week_start: 2026-01-12)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('5d3a880c-2818-4865-851f-dabe7afee37a', '2026-01-12', 'Semana 02 - Base', 0, 'Força - Back Squat', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
3 Shuttle Run
5 Sprow

3 Rounds
10 Air Squat
5 Lunges (R/L)
5 Step Box', 'Back Squat
3 x 5 - 50%
3 x 5 - 60%
3 x 5 - 70%

Ao final de cada série realize 40 m de DB W. Lunges', 'FOR TIME
12 9 6 3
Burpee Step Box Over
100 m Run', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('f9b9385d-476d-4baf-ac88-cbd625f4fd3d', '2026-01-12', 'Semana 02 - Base', 1, 'Ginástica + Core', NULL, 'média', ARRAY['ginástica','engine']::text[], '5 min Mobilidade', '2 Rounds
15" Core Anti Rotação
15 Cat Cow
10 Dead Bug

3 Rounds
10" Hollow Hold
10 Hollow Rock
10" Arch Hold
10 Super Man', '3 Rounds
3 Strict Knee Raises
5 Kipping
3 Leg Raises', '7 Rounds FT
5 Knee Raises/Leg Raises/T2B
10 Hang DB Snatch
15 Air Squat
100 m Run
Time Cap 10 min', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('a6a55bf2-3cd1-4dd5-998d-9ea995fc0564', '2026-01-12', 'Semana 02 - Base', 2, 'Potência - Snatch', NULL, 'média', ARRAY['potência','skill','engine']::text[], '200 m Run', '3 Rounds
5 Hang Snatch
5 Balance Snatch
5 OHS', 'Balance Snatch + OHS
3 x 3 + 3 - 40%

Hang Power Snatch + OHS
3 x 3 + 3 - 40%

Power Snatch
3 x 5 - 50%

Stiff carga moderada', 'FOR TIME
3 6 9 12
Power Snatch 40/25 Kg
100 m Plate Overhead Walk 10 Kg
then...
20 Burpee O. Bar
Time Cap 10 min', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('27d13de9-ba01-4a3b-8ddc-164aa8418336', '2026-01-12', 'Semana 02 - Base', 3, 'Força - Pull', NULL, 'média', ARRAY['força','engine','ginástica']::text[], '5 Min Mobilidade', '3 Rounds
10" Dead Hang
10 Scap Pull', '4 Rounds
5 Strict Pull-up (segurar a descida)
10 Curved Row
10 DB Lateral Raise
10 Biceps Curl''s', 'AMRAP 12 min
5 Pull-Up
5 Thrusters 50/35 Kg
5 Burpee O. Bar
100 m Run', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('223d54d5-f68c-4d5b-bfd1-c0617cda8ad7', '2026-01-12', 'Semana 02 - Base', 4, 'Força - Deadlift', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min Mobilidade', '3 Rounds
10 Stiff
10 Kang Squat
10 Squat', 'Deadlift
3 x 5 - 50%
3 x 5 - 60%
3 x 5 - 70%

Hip Thruster + Stiff
3 x 8-10 + 8-10', '4 Rounds FT
2 Deadlift 80/60
4 Burpee O. Bar
6 Box Jump Over
8 Wall Ball
100 m Run
Time Cap 9 min', NULL, NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('e562ec95-1b35-465b-ace7-e1fa46c9dac9', '2026-01-12', 'Semana 02 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'ENDURANCE LONGO', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 22:25:03.04706+00', '2026-02-23 22:25:03.04706+00');

-- =====================
-- weekly_workouts (Semana 1/5 BASE, week_start: 2026-01-13)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('16773b09-4ac1-4ea8-8cc8-c350e4e1cd09', '2026-01-13', 'Semana 1/5 BASE', 0, 'Força + Endurance', NULL, 'alta', ARRAY['força','engine']::text[], 'MOBILIDADE', '2 ROUNDS
10 AIR SQUAT
10 JUMP SQUAT
10" ISOMETRIA', 'A-) BACK SQUAT
4 X 10
aumente a carga até achar uma carga para 10 RM

B-) Z PRESS
4 X 10 + 2 WALL CLIMBER
dumbel ou Barra

C-) CORE
3 X
30" PRANCHA
30 ABMT', '7 ROUNDS FT
100 M RUN
10 WALL BALL
5 DEVIL PRESS 1 DB', NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-02-23 12:21:31.612842+00', '2026-02-23 12:21:31.612842+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('e2905b0e-533a-4d45-a3d8-744617f82684', '2026-01-13', 'Semana 1/5 BASE', 1, 'Snatch + Endurance', NULL, 'alta', ARRAY['força','engine','skill']::text[], 'MOBILIDADE', '2 Rounds
10 Bom dia
10 Back squat + press', 'Snatch
A cada 1 min por 3 min
2 Power Snatch + 2 Hang P. snatch 40%

A cada 1 min por 9 min
3 Power Snatch + Hang Power Snatch 50%

A cada 1 min por 5 min
4 Snatch Pull 70% 1 rm', 'in Dupla
10 Rounds
4 Snatch 40/35 Kg
6 Box Jump Over
100 m Run', NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-02-23 12:21:31.612842+00', '2026-02-23 12:21:31.612842+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('3ef5f2b2-581e-4010-b899-b970de51c39f', '2026-01-13', 'Semana 1/5 BASE', 2, 'Força + WOD em Dupla', NULL, 'alta', ARRAY['força','engine']::text[], '500 M Run
Mobilidade', NULL, 'FORÇA
PUSH-UP C/ BAND + SHOULDER PRESS C/ DB
3 X 10 + 10', '400m Run
5 rounds (in Dupla)
20 Back Squat
20 ktb Swing 24/20 Kg
20 Wall Ball 20/16 Lbs
20 Thrusters 40/35 Kg
400 m Run
* a Cada 5 Reps troca', NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-02-23 12:21:31.612842+00', '2026-02-23 12:21:31.612842+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('727bb52c-6ba2-46bd-8350-5af766d36546', '2026-01-13', 'Semana 1/5 BASE', 3, 'Força + Endurance', NULL, 'alta', ARRAY['força','engine']::text[], '300 M RUN
3 X
10 Back Squat
10 Stif
20 Passada Lateral (band)', NULL, 'A-) DEADLIFT + Hip Thruster
4 X 10 + 10
aumente a carga até achar 10 RM

B-) STRICT PULL UP + REMADA CURVADA
4 X 5 + 10

C-) CORE
4 Rounds
10 HOLLOW ROCK
10 TUCK-UP
10" HOLLOW HOLD', '5 ROUNDS
3 DEADLIFT
6 PULL-UP
9 BURPEE OVER BAR
100 M RUN
DESCAN 1 MIN', NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-02-23 12:21:31.612842+00', '2026-02-23 12:21:31.612842+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('627e9468-9f37-4cdd-a20b-83272fcfccf1', '2026-01-13', 'Semana 1/5 BASE', 4, 'Força + Endurance', NULL, 'alta', ARRAY['força','engine','skill']::text[], '200 M RUN
Mobilidade
3 ROUNDS
10 Jump Squat
10" Isometria (Squat)
30 Mountain Climber', NULL, 'FORÇA
Elevação Lateral de Ombro
4 x 12
Remada Alta
4 x 10

Power Clean + Hang Squat Clean + Push Jerk
4 x 3 + 3 + 3', '3 Rounds
300 m Run
2 Bear Complex 40/35 kG
10 Burpee O bar
Então ...
150 wall ball
* Bear Complex
1 power clean
1 front squat
1 push Press
1 back Squat
1 push Press', NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-02-23 12:21:31.612842+00', '2026-02-23 12:21:31.612842+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('f779b047-4591-4bf6-b2fd-6062fdc97080', '2026-01-13', 'Semana 1/5 BASE', 5, 'Skill', NULL, 'média', ARRAY['skill']::text[], NULL, NULL, 'Pull-up
Snatch', NULL, NULL, '46909ae8-57de-47ac-8f56-79d79f8213c8', '2026-02-23 12:21:31.612842+00', '2026-02-23 12:21:31.612842+00');

-- =====================
-- weekly_workouts (Semana 03 - Base, week_start: 2026-01-19)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('7e3cfbf2-050b-4457-8d12-a43820332d34', '2026-01-19', 'Semana 03 - Base', 0, 'Força - Back Squat', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
3 Shuttle Run
5 Sprow

3 Rounds
10 Air Squat
5 Lunges (R/L)
5 Step Box', 'Back Squat
2 x 3 - 50%
2 x 3 - 60%
5 x 3 - 70%

DB Lunges - deficit
3 x 10 (R/L)', 'FOR TIME
100 W. Lunges
4 Rounds:
10 Wall Ball
10 Burpee Box Jump Over
100 m Run
then...
100 W. Lunges', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('63e5b34e-5a15-44a1-9820-8f6f7e383cf6', '2026-01-19', 'Semana 03 - Base', 1, 'Core + Bench Press', NULL, 'média', ARRAY['ginástica','força']::text[], '5 min Mobilidade', '3 Rounds
20" Plank
20" Reverse Plank
20 Lateral Plank R/L

3 Rounds
10" Knee Raises Hold
10 Knee Raises
10 Leg Raises', 'Bench Press
2 x 3 - 50%
2 x 3 - 60%
5 x 3 - 70% com pause', 'AMRAP 12 MIN
1 T2B/Leg Raises
1 HSPU/Push-up and release
1 Shuttle Run
Aumente 1 rep a cada round', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('52b391e0-05bf-4df0-9ed4-591e137ea357', '2026-01-19', 'Semana 03 - Base', 2, 'Potência - Clean', NULL, 'média', ARRAY['potência','engine']::text[], '5 Min Mobilidade', '3 Rounds
5 Deadlift Clean
5 Clean Pull
5 Clean High Pull
5 Drop Clean', 'Clean Pull + Hang Power Clean
5 x 3 + 1 - 40%

Power Clean
5 x 3 - 50%

Squat Clean
5 x 2 - 60%', 'FOR TIME
12 9 6 3
Power Clean 50/35 Kg
Burpee Double Jump Over
then...
50 Wall Ball
Aumente 10 kg a cada rodada', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('3a4866a7-1824-4c96-8117-cc62925342c6', '2026-01-19', 'Semana 03 - Base', 3, 'Engine - Trio', NULL, 'alta', ARRAY['engine','ginástica']::text[], '5 Min Mobilidade', '3 Rounds
10 KTB Pendulum (R/L)
5 Turkish Get-Up (TGU) (R/L)
10 KTB Swing', NULL, '5 RDS FT IN TRIO
300 m Run syncro
30 Pull-up (10 cada)
30 Box Jump Over Step Down
30 Devil Press 1DB 22/15 Kg
Cada componente do trio executa 5 reps por vez
Time Cap 15 min', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('45b9b0ee-cf08-4062-9fb2-46ce29e1e0f0', '2026-01-19', 'Semana 03 - Base', 4, 'Força - Deadlift', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min Mobilidade', '3 Rounds
10 Leg Raise unilateral
10 Stiff with plate
20 Dead March', 'Deadlift
2 x 3 - 50%
2 x 3 - 60%
5 x 3 - 70% com pause

2DB Bulgarian Split Squat
3 x 8 (R/L)', '10 Rounds FT
3 Deadlift 50/35 Kg
3 Hang Clean
3 Thrusters
3 Burpee
100 m Run', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('948fcd82-8071-4d25-8df7-cb259c64b715', '2026-01-19', 'Semana 03 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'ENDURANCE LONGO', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

-- =====================
-- weekly_workouts (Semana 04 - Base, week_start: 2026-01-26)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('f7301c30-3e47-46f8-8b69-ad89d1935183', '2026-01-26', 'Semana 04 - Base', 0, 'Força - Back Squat', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
20 Air Squat
20 m W. Lunges
10 Jump Squat', 'Back Squat
2 x 5 - 50%
2 x 5 - 60%
3 x 5 - 70%

DB Lunges - deficit
3 x 10 (R/L)', 'FOR TIME
50 m W. Lunges 1 DB front rack
3 Rounds:
20 Wall Ball
20 Step Box c/WB
30 Burpee', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('3c42c13d-0ed3-47ad-bce7-5327bfa7ff04', '2026-01-26', 'Semana 04 - Base', 1, 'Força - Back Squat II', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
20 Air Squat
20 m W. Lunges
10 Jump Squat
5 Tall Clean
5 Drop Clean', 'Back Squat
2 x 5 - 50%
2 x 5 - 60%
3 x 5 - 70%

DB Lunges - deficit
3 x 10 (R/L)', 'FOR TIME
50 m W. Lunges 1 DB front rack
3 Rounds:
20 Wall Ball
20 Step Box c/WB
30 Burpee', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('8a522f52-63d9-4d6a-888a-143535c4c58e', '2026-01-26', 'Semana 04 - Base', 2, 'Potência - Clean', NULL, 'média', ARRAY['potência','engine']::text[], '5 Min Mobilidade', '3 Rounds
5 Clean Pull
5 Tall Clean
5 Drop Clean', 'Clean Pull
5 x 3 - 50% do seu Clean

Hang Clean
2 x 5 - 50%
4 x 3 - 60%

Squat Clean
5 x 2 - 60%', '3 Rounds FT
30 Pull-up (10 cada)
20 Burpee O. Bar 2 Syn
15 Clean 50/35 Kg (5 cada)
then...
50 Front Squat', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('a032fe4b-9d90-4ed5-90dd-4726c2885255', '2026-01-26', 'Semana 04 - Base', 3, 'Core Edition', NULL, 'média', ARRAY['ginástica','engine']::text[], '5 Min Mobilidade', 'A cada 20 seg por 4 min:
1 Shuttle Run
2 Sprow

Core Edition
3 Rounds
10 V-Up
20 Flutter Kick
10 Side Jack Knife (R/L)
10 Dead Bug (R/L)
10 Pulse-Up', NULL, '4 RDS FT IN TRIO
6 Wall Walking
15 T2B/Leg Raises/Knee Raises
30 Hang DB Snatch 22/15
45 Burpee Box Jump Over
30 Thrusters 50/35 Kg
30 Burpee O. Bar', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('e2536d06-bc4a-4047-9a26-d0608df6a66f', '2026-01-26', 'Semana 04 - Base', 4, 'Sessão Moromba', NULL, 'média', ARRAY['força']::text[], '5 Min Mobilidade', '3 Rounds
20" Glute Bridge Hold
20 Hip Thrusters
10 Tall Plank Leg Lift (R/L)', 'Sessão Moromba
4 Rounds
10 Front Squat
10 Bulgarian Split Squat (R/L)
10 Hip Thrusters
20 Goblet Squat', 'FOR TIME
100 m Run
30 Burpee O. Bar
100 m Run', NULL, NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('20a551e0-0d2f-435c-855d-6fedce87025b', '2026-01-26', 'Semana 04 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'ENDURANCE LONGO', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 22:31:00.977838+00', '2026-02-23 22:31:00.977838+00');

-- =====================
-- weekly_workouts (Semana 05 - Base, week_start: 2026-02-02)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('32bdc882-2d11-480a-a792-eef34ee8a20b', '2026-02-02', 'Semana 05 - Base', 0, 'Força - Deadlift', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
10 Good Morning
20 Dead March
10 Cossack Squat', 'Deadlift
2 x 5 - 50%
2 x 5 - 60%
3 x 5 - 70%

Hip Thruster unilateral
3 x 10 (R/L)', 'FOR TIME
20 Burpee O. Bar
10 Rounds FT:
5 Deadlift 80/65 Kg
10 Push-Up
15 Air Squat
then...
20 Burpee O. Bar', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('45052cf9-d1f7-4948-a098-3b25dcd29214', '2026-02-02', 'Semana 05 - Base', 1, 'Engine - EMOM', NULL, 'média', ARRAY['engine']::text[], '5 Min de Mobilidade', '4 Rounds
20" Star Plank
20 Mountain Climber
20 Russian Twist
10 Zumbie Crunch', NULL, 'EMOM IN 30 MIN
1º min: 300 m Air Bike
2º min: 15 Box Jump Over
3º min: 20 Sit-up ABMT
4º min: 10 Hang 1DB Thrusters
5º min: 15 Wall Ball
6º min: Rest', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('c8d073dd-8919-4cce-9887-e09303a13efe', '2026-02-02', 'Semana 05 - Base', 2, 'Leg Day', NULL, 'alta', ARRAY['força','engine']::text[], '200 m Run
5 Min Mobilidade', '3 Rounds
10" Squat Hold
10 Air Squat
10 Squat Jump', 'Leg Day
4 Rounds
10 Back Squat 60%
10 Back Lunges - deficit
10 Nordic Reverse
20 m W. Lunges', 'FOR TIME
50 Wall Ball
then...
20 Burpee O. Bar
then...
50 Wall Ball', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('26172edb-a64d-43cb-97a0-3b4af6d76fd7', '2026-02-02', 'Semana 05 - Base', 3, 'Força - Pull', NULL, 'média', ARRAY['força','engine']::text[], '200 m Run
5 Min Mobilidade', '3 Rounds
20 Jump Jack
10 Gorilla Row DB
10 Reverse Fly', '4 Rounds
5 Strict Pull-up
10 DB Row Curved Unilateral
10 Lateral Side Raises', '3 Rounds FT
100 m Farm Walk 1 DB
10 Goblet Squat
20 m W. Lunges front rack 1 DB', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('13693b87-938f-4dd6-bbca-0d5bc90d4537', '2026-02-02', 'Semana 05 - Base', 4, 'Potência - Clean & Jerk', NULL, 'alta', ARRAY['potência','skill','engine']::text[], '200 m Run
5 Min Mobilidade', '3 Rounds
5 Muscle Clean
5 Front Squat
5 Push Press', 'Clean and Jerk
Power Clean + Push Press + Jerk
3 x 2 + 1 + 1 - 40%
3 x 1 + 1 + 1 - 50%

Hang Clean + Jerk
3 x 2 + 1 - 50%
2 x 2 + 1 - 60%
2 x 1 + 1 - 70%', '4 RDS FT IN DUPLA
100 m Run syn
30 Hang DB Snatch
10 Burpee O. Line syn
20 Pull-up
then...
12 9 6 3
Burpee O. Bar syn
Power Clean 60/45 Kg
then...
50 Wall Ball', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('0be163c2-d04f-4ed2-8c44-ee025d0e6f73', '2026-02-02', 'Semana 05 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'ENDURANCE LONGO', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

-- =====================
-- weekly_workouts (Semana 06 - Base, week_start: 2026-02-09)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('3652b24f-7576-4bc1-a3c0-b36dd4f14437', '2026-02-09', 'Semana 06 - Base', 0, 'Força - Back Squat', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
5 Muscle Clean
10 Back Squat
10 Back Lunges - alt', 'Back Squat
2 x 2 - 50%
2 x 2 - 60%
2 x 3 - 70%', 'EMOM in 8 min
5 Clean com 70%
5 BMU/Burpee Pull-up

3 RDS FOR TIME
5 Clean 50/35 Kg
10 Push-up
15 Air Squat
5 Burpee Double Jump Over
100 m Run', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('f7134eda-e567-465b-819c-825219dfb446', '2026-02-09', 'Semana 06 - Base', 1, 'Ginástica - Strict', NULL, 'média', ARRAY['ginástica','engine']::text[], '5 Min de Mobilidade', '3 Rounds
10" Hollow Hold
10 Hollow Rock
10" Arch Hold
10 Arch Rock', 'EMOM in 6 min
5 Strict Pull-up
3 Strict Toes to Bar', 'AMRAP 5 MIN
5 Chest to Bar/Pull-up
10 Box Jump Over
rest 2 min

AMRAP 5 MIN
5 T2B/Leg Raises
10 Burpee Box Jump Over - Step Downs', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('a143c7e9-8c59-4836-8082-cdc750294a80', '2026-02-09', 'Semana 06 - Base', 2, 'Força - Deadlift', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min Mobilidade', '3 Rounds
10 Stiff
10 Seated Leg Raises
20 Leg Raise Over DB', 'Deadlift
2 x 2 - 50% + 20 Pass Lateral
2 x 2 - 60% + 20 Pass Lateral
2 x 3 - 70% + 20 Pass Lateral', 'FOR TIME
3 6 9 12 9 6 3
Deadlift 80/65 Kg
Squat Jump To Plate
HSPU/2x Push-up and release
100 m Run', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('c8732819-8e6e-4e5f-928c-a6f9eb295ff2', '2026-02-09', 'Semana 06 - Base', 3, 'Shoulder Press + Legs', NULL, 'média', ARRAY['força','engine']::text[], '5 Min Mobilidade', '3 Rounds
3 Shuttle Run
10 Push-Up
20 m W. Lunges', 'Shoulder Press
2 x 2 - 50%
2 x 2 - 60%
2 x 3 - 70%

3 Rounds
8 Front Squat
8 Hip Thrusters
8 Lunges com Deficit (R/L)
20 Pass Lateral', 'FOR TIME
30 DB Thrusters 1 DB
30 Hang DB Snatch 22,5/15 Kg
30 Box Jump Over Step Down
200 m Run c/ Ball
100 m Burpee Broad Jump', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('6b6a0307-6b42-4c66-8405-ac02dc0141ed', '2026-02-09', 'Semana 06 - Base', 4, 'Engine - Dupla', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', '3 Rounds
10" Glute Bridge Hold
10 Hip Thrusters
10 Tall Plank Leg Lift (R/L)', NULL, '4 RDS FT IN DUPLA
200 m Run syn
200 m W. Lunges DB suitcase
200 m Run syn
200 m Farm Walk syn
200 m Run syn
100 Wall Ball', NULL, NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('99fd9f5b-347f-45d9-9dbb-c2f87c41bed3', '2026-02-09', 'Semana 06 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'ENDURANCE LONGO', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 23:11:17.875347+00', '2026-02-23 23:11:17.875347+00');

-- =====================
-- weekly_workouts (Semana 07 - Base, week_start: 2026-02-16)
-- =====================
INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('b3d2a050-9305-4069-bfcd-305c55952c52', '2026-02-16', 'Semana 07 - Base', 0, 'Força - Back Squat MAX', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
20" Squat Hold
10 Jump Squat
3 Shuttle Run', 'Back Squat
2 x 5 - 50%
2 x 4 - 60%
2 x 3 - 70%
2 x 2 - 80%
2 x 1 - 90%', '4 RDS FOR TIME
10 Thrusters 40/25 Kg
10 Burpee O. Bar
100 m Run', NULL, NULL, '2026-02-23 23:24:11.996386+00', '2026-02-23 23:24:11.996386+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('1bc52d9c-68ef-4c12-9dda-f995a917ca91', '2026-02-16', 'Semana 07 - Base', 1, 'Força - Bench Press MAX', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min de Mobilidade', '3 Rounds
20 Jump Jack
5 Push-up 3 tempo
10 Push Press', 'Bench Press
2 x 5 - 50%
2 x 4 - 60%
2 x 3 - 70%
3 x 2 - 80%
3 x 1 - 90%', '4 Rounds FT in dupla
100 m Over Head Walking 2 DB
20 Hang DB Clean 2DB
20 DB Shoulder To Over Head 2DB
20 HSPU ou 2x Push-up and release
20 Burpee O. Line', NULL, NULL, '2026-02-23 23:24:11.996386+00', '2026-02-23 23:24:11.996386+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('bbfa4d17-d158-4a5d-9edf-fc8a325b19f5', '2026-02-16', 'Semana 07 - Base', 2, 'Força - Deadlift', NULL, 'alta', ARRAY['força','engine']::text[], '5 Min Mobilidade', '3 Rounds
10 Stiff
10 Seated Leg Raises
20 Leg Raise Over DB', 'Deadlift
2 x 2 - 50% + 20 Pass Lateral
2 x 2 - 60% + 20 Pass Lateral
2 x 3 - 70% + 20 Pass Lateral', 'FOR TIME
3 6 9 12 9 6 3
Deadlift 80/65 Kg
Squat Jump To Plate
HSPU/2x Push-up and release
100 m Run', NULL, NULL, '2026-02-23 23:24:11.996386+00', '2026-02-23 23:24:11.996386+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('c53b38d3-7f95-46c5-a328-c649c446b065', '2026-02-16', 'Semana 07 - Base', 3, 'Shoulder Press + Legs', NULL, 'média', ARRAY['força','engine']::text[], '5 Min Mobilidade', '3 Rounds
3 Shuttle Run
10 Push-UP
20 m W. Lunges', 'Shoulder Press
2 x 2 - 50%
2 x 2 - 60%
2 x 3 - 70%

3 Rounds
8 Front Squat
8 Hip Thrusters
8 Lunges com Deficit (R/L)
20 Pass Lateral', 'FOR TIME
30 DB Thrusters 1 DB
30 Hang DB Snatch 22,5/15 Kg
30 Box Jump Over Step Down
200 m Run c/ Ball
100 m Burpee Broad Jump', NULL, NULL, '2026-02-23 23:24:11.996386+00', '2026-02-23 23:24:11.996386+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('daf79165-1032-4e86-b6db-a4bcf3eff515', '2026-02-16', 'Semana 07 - Base', 4, 'Engine - Dupla', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', '3 Rounds
10" Glute Bridge Hold
10 Hip Thrusters
10 Tall Plank Leg Lift (R/L)', NULL, '4 RDS FT IN DUPLA
200 m Run syn
200 m W. Lunges DB suitcase
200 m Run syn
200 m Farm Walk syn
200 m Run syn
100 Wall Ball', NULL, NULL, '2026-02-23 23:24:11.996386+00', '2026-02-23 23:24:11.996386+00');

INSERT INTO public.weekly_workouts (id, week_start, week_label, day_of_week, title, description, intensity, tags, warmup, activation, strength, wod, notes, created_by, created_at, updated_at) VALUES ('fbfc81ee-0282-450c-af55-108926c8416e', '2026-02-16', 'Semana 07 - Base', 5, 'Treino Longo', NULL, 'alta', ARRAY['engine']::text[], '5 Min Mobilidade', NULL, NULL, 'ENDURANCE LONGO', 'O BÁSICO FUNCIONA!', NULL, '2026-02-23 23:24:11.996386+00', '2026-02-23 23:24:11.996386+00');

-- =============================================================
-- FIM DA TRANSFERÊNCIA
-- =============================================================
