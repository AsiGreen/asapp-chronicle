-- Create bank_statements table
CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'pdf')),
  statement_date_from DATE NOT NULL,
  statement_date_to DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ILS',
  total_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_cashflow NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_statements
CREATE POLICY "Users can view their own bank statements"
  ON public.bank_statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank statements"
  ON public.bank_statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank statements"
  ON public.bank_statements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank statements"
  ON public.bank_statements FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_bank_statements_updated_at
  BEFORE UPDATE ON public.bank_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to transactions table
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS transaction_direction TEXT DEFAULT 'expense' CHECK (transaction_direction IN ('income', 'expense')),
  ADD COLUMN IF NOT EXISTS bank_statement_id UUID REFERENCES public.bank_statements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_bank TEXT;

-- Create income_categories table
CREATE TABLE IF NOT EXISTS public.income_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on income_categories
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for income_categories (public read, authenticated write)
CREATE POLICY "Anyone can view income categories"
  ON public.income_categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert income categories"
  ON public.income_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update income categories"
  ON public.income_categories FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete income categories"
  ON public.income_categories FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Seed income categories
INSERT INTO public.income_categories (name, icon, color) VALUES
  ('Salary', 'Briefcase', 'hsl(142, 76%, 36%)'),
  ('Freelance Income', 'Laptop', 'hsl(142, 70%, 45%)'),
  ('Gifts', 'Gift', 'hsl(270, 70%, 50%)'),
  ('Investment Returns', 'TrendingUp', 'hsl(217, 91%, 60%)'),
  ('Refunds', 'RotateCcw', 'hsl(47, 92%, 50%)'),
  ('Other Income', 'Plus', 'hsl(215, 20%, 65%)')
ON CONFLICT (name) DO NOTHING;

-- Create storage bucket for bank statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-statements', 'bank-statements', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bank-statements bucket
CREATE POLICY "Users can upload their own bank statements"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own bank statements"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own bank statements"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own bank statements"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bank-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );