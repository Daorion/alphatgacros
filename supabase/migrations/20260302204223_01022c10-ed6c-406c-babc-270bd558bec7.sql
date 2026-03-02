
-- 1. Bank Accounts
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_type TEXT NOT NULL DEFAULT 'corrente',
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on bank_accounts"
  ON public.bank_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Financial Categories
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on financial_categories"
  ON public.financial_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Recurring Transactions (templates)
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category_id UUID REFERENCES public.financial_categories(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  frequency TEXT NOT NULL DEFAULT 'mensal' CHECK (frequency IN ('semanal', 'mensal', 'anual')),
  day_of_month INTEGER,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on recurring_transactions"
  ON public.recurring_transactions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Financial Transactions
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category_id UUID REFERENCES public.financial_categories(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_id UUID REFERENCES public.recurring_transactions(id),
  payment_method TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on financial_transactions"
  ON public.financial_transactions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.financial_categories (name, type, color) VALUES
  ('Mensalidades', 'receita', '#22c55e'),
  ('Wellhub/Gympass', 'receita', '#06b6d4'),
  ('TotalPass', 'receita', '#8b5cf6'),
  ('Matrícula', 'receita', '#f59e0b'),
  ('Vendas', 'receita', '#ec4899'),
  ('Aluguel', 'despesa', '#ef4444'),
  ('Energia', 'despesa', '#f97316'),
  ('Água', 'despesa', '#0ea5e9'),
  ('Internet', 'despesa', '#6366f1'),
  ('Salários', 'despesa', '#dc2626'),
  ('Equipamentos', 'despesa', '#a855f7'),
  ('Manutenção', 'despesa', '#64748b'),
  ('Marketing', 'despesa', '#e11d48'),
  ('Impostos', 'despesa', '#78716c'),
  ('Outros', 'despesa', '#94a3b8'),
  ('Outros', 'receita', '#a3e635');
