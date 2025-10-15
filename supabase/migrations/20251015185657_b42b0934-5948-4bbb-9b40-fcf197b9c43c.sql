-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create statements table
CREATE TABLE public.statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  statement_date DATE NOT NULL,
  card_number TEXT NOT NULL,
  card_type TEXT,
  file_url TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  statement_id UUID REFERENCES public.statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  payment_date DATE,
  merchant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  original_amount NUMERIC NOT NULL,
  original_currency TEXT NOT NULL,
  exchange_rate NUMERIC,
  amount_ils NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  transaction_type TEXT NOT NULL DEFAULT 'regular',
  description TEXT,
  card_last_4 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchant_mappings table
CREATE TABLE public.merchant_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_pattern TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  confidence NUMERIC NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read, authenticated users can manage)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for statements
CREATE POLICY "Users can view their own statements"
  ON public.statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statements"
  ON public.statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statements"
  ON public.statements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statements"
  ON public.statements FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for merchant_mappings (public read, authenticated write)
CREATE POLICY "Anyone can view merchant mappings"
  ON public.merchant_mappings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert merchant mappings"
  ON public.merchant_mappings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update merchant mappings"
  ON public.merchant_mappings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete merchant mappings"
  ON public.merchant_mappings FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_statements_updated_at
  BEFORE UPDATE ON public.statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for credit card statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-card-statements', 'credit-card-statements', false);

-- Storage policies for credit-card-statements bucket
CREATE POLICY "Users can view their own statements"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'credit-card-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own statements"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'credit-card-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own statements"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'credit-card-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert default categories
INSERT INTO public.categories (name, icon, color) VALUES
  ('Transportation', 'Car', 'hsl(221, 83%, 53%)'),
  ('Accommodation', 'Hotel', 'hsl(262, 83%, 58%)'),
  ('Shopping', 'ShoppingBag', 'hsl(340, 82%, 52%)'),
  ('Food & Dining', 'UtensilsCrossed', 'hsl(24, 95%, 53%)'),
  ('Services', 'Briefcase', 'hsl(142, 71%, 45%)'),
  ('Entertainment', 'Film', 'hsl(280, 65%, 60%)'),
  ('Travel', 'Plane', 'hsl(199, 89%, 48%)'),
  ('Co-working', 'Building', 'hsl(43, 96%, 56%)'),
  ('Health & Wellness', 'Heart', 'hsl(0, 72%, 51%)'),
  ('Technology', 'Laptop', 'hsl(217, 91%, 60%)'),
  ('Other', 'MoreHorizontal', 'hsl(215, 20%, 65%)');