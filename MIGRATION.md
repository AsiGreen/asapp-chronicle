# Complete Migration Guide: Lovable Cloud → Your Own Supabase

This document provides step-by-step instructions for migrating your Finance Tracker application from Lovable Cloud to your own Supabase instance.

---

## Table of Contents
1. [Database Schema Overview](#database-schema-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Step-by-Step Migration Process](#step-by-step-migration-process)
4. [Data Export and Import](#data-export-and-import)
5. [Edge Function Migration](#edge-function-migration)
6. [Frontend Code Changes](#frontend-code-changes)
7. [Testing Checklist](#testing-checklist)
8. [Rollback Plan](#rollback-plan)

---

## Database Schema Overview

Your application uses the following tables:

### **1. categories** (11 default categories)
- Stores spending categories with icons and colors
- Self-referential (can have parent categories)
- Public read access, authenticated write access

### **2. statements**
- Credit card statement metadata
- Links to storage bucket files
- User-specific with RLS policies
- Status tracking: `processing`, `completed`, `failed`

### **3. transactions**
- Individual transaction records extracted from statements
- User-specific with RLS policies
- Supports multiple currencies with exchange rates
- Tracks fees and transaction types (regular/refund)

### **4. merchant_mappings**
- Machine learning-style merchant categorization
- Links merchant patterns to categories
- Public read, authenticated write

### **Storage Buckets:**
- `credit-card-statements` (private, user-specific)

### **Edge Functions:**
- `process-statement` - AI-powered PDF parsing using Lovable AI (Gemini)

---

## Pre-Migration Checklist

Before starting migration, ensure you have:

- [ ] **Supabase Account** created at [supabase.com](https://supabase.com)
- [ ] **New Supabase Project** created
- [ ] **Supabase CLI** installed locally: `npm install -g supabase`
- [ ] **Project exported to GitHub** from Lovable
- [ ] **Repository cloned** locally
- [ ] **Node.js and npm** installed
- [ ] **Lovable AI API Key** (if keeping AI functionality) - or plan to switch to OpenAI
- [ ] **Backup of current data** (export from Lovable Cloud)

---

## Step-by-Step Migration Process

### Phase 1: Set Up Your Supabase Project

#### 1.1 Create Database Schema

Run this complete SQL migration in your Supabase SQL Editor:

```sql
-- =====================================================
-- FINANCE TRACKER - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Create the update_updated_at_column function first (used by triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  parent_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABLE: statements
-- =====================================================
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

-- =====================================================
-- TABLE: transactions
-- =====================================================
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

-- =====================================================
-- TABLE: merchant_mappings
-- =====================================================
CREATE TABLE public.merchant_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_pattern TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  confidence NUMERIC NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_mappings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: categories
-- =====================================================
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

-- =====================================================
-- RLS POLICIES: statements
-- =====================================================
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

-- =====================================================
-- RLS POLICIES: transactions
-- =====================================================
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

-- =====================================================
-- RLS POLICIES: merchant_mappings
-- =====================================================
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

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_statements_updated_at
  BEFORE UPDATE ON public.statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT CATEGORIES
-- =====================================================
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
```

#### 1.2 Create Storage Bucket

In Supabase Dashboard → Storage:

1. Create new bucket: `credit-card-statements`
2. **Make it PRIVATE** (uncheck "Public bucket")
3. Set up storage policies:

```sql
-- Storage policies for credit-card-statements bucket
CREATE POLICY "Users can view their own statements"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'credit-card-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own statements"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'credit-card-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own statements"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'credit-card-statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### 1.3 Configure Authentication

In Supabase Dashboard → Authentication → Settings:

1. **Enable Email provider** (should be on by default)
2. **Disable email confirmation** for easier testing:
   - Go to Authentication → Email Templates
   - Or set "Confirm email" to OFF in Auth settings
3. **Set Site URL** to your production domain (or localhost for testing)
4. **Add Redirect URLs** for your application

---

### Phase 2: Export Data from Lovable Cloud

You need to export your existing data. Since you can't directly access the Supabase dashboard, you'll need to use the Supabase client in a script or through the application itself.

#### Option A: Create a temporary data export page

Add this to your application temporarily:

```typescript
// Create: src/pages/ExportData.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function ExportData() {
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const { data: categories } = await supabase.from('categories').select('*');
      const { data: statements } = await supabase.from('statements').select('*');
      const { data: transactions } = await supabase.from('transactions').select('*');
      const { data: mappings } = await supabase.from('merchant_mappings').select('*');

      const exportData = {
        categories,
        statements,
        transactions,
        merchant_mappings: mappings,
        exported_at: new Date().toISOString()
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-data-export-${Date.now()}.json`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Export Data</h1>
      <Button onClick={exportData} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export All Data'}
      </Button>
    </div>
  );
}
```

Add route in `src/App.tsx`:
```typescript
<Route path="/export-data" element={<ExportData />} />
```

Then visit `/export-data` in your app to download your data.

#### Option B: Use Supabase CLI (if you have service role key access)

```bash
# This requires knowing your Lovable Cloud service role key
# Which you likely don't have direct access to
```

---

### Phase 3: Import Data to New Supabase

Once you have your exported JSON file:

1. **Manually insert data using Supabase Table Editor**, OR
2. **Create an import script:**

```sql
-- Example: Import categories (if not using defaults)
-- INSERT INTO categories (id, name, icon, color, parent_category_id, created_at)
-- VALUES (...); -- Use values from your export

-- Import statements
-- INSERT INTO statements (id, user_id, statement_date, ...)
-- VALUES (...);

-- Import transactions
-- INSERT INTO transactions (id, user_id, statement_id, ...)
-- VALUES (...);
```

**IMPORTANT**: You'll need to handle user_id mapping. The UUIDs from Lovable Cloud won't match your new Supabase auth users. Options:
- Have users re-sign up and manually re-upload their statements
- Create a mapping table for old_user_id → new_user_id
- Use the same auth provider (email) and manually link accounts

**Note**: File storage URLs will be different. You'll need to:
1. Download all PDFs from Lovable Cloud storage
2. Re-upload to your new Supabase storage bucket
3. Update `file_url` in the statements table

---

### Phase 4: Deploy Edge Function

#### 4.1 Install Supabase CLI

```bash
npm install -g supabase
```

#### 4.2 Link to Your Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

#### 4.3 Deploy the Edge Function

Your edge function code is already in `supabase/functions/process-statement/index.ts`.

```bash
# Deploy the function
supabase functions deploy process-statement

# Set required secrets
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key
```

**ALTERNATIVE**: If you want to switch to OpenAI instead of Lovable AI:

1. Replace the AI API call in `process-statement/index.ts`:

```typescript
// Replace Lovable AI call with OpenAI
const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4', // or gpt-4-turbo, gpt-3.5-turbo
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n--- CREDIT CARD STATEMENT TEXT ---\n${fullText}`
      }
    ],
    functions: [/* same function schema */],
    function_call: { name: 'extract_transactions' }
  }),
});
```

2. Set OpenAI API key:
```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

#### 4.4 Update Edge Function Configuration

Your `supabase/config.toml` should look like:

```toml
[functions.process-statement]
verify_jwt = true
```

---

### Phase 5: Update Frontend Code

#### 5.1 Update Environment Variables

Create a new `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

#### 5.2 Update Supabase Client (if needed)

The client in `src/integrations/supabase/client.ts` should work as-is:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

#### 5.3 Regenerate Types

```bash
# Generate new TypeScript types from your Supabase schema
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/integrations/supabase/types.ts
```

#### 5.4 No Code Changes Required!

Your application code doesn't need changes because you used the Supabase client abstraction. The same API calls work with both Lovable Cloud and your own Supabase instance.

---

### Phase 6: Deploy Your Application

#### Option A: Vercel
```bash
npm install -g vercel
vercel
# Follow prompts and add environment variables in Vercel dashboard
```

#### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy
# Add environment variables in Netlify dashboard
```

#### Option C: Any Static Host
```bash
npm run build
# Upload the dist/ folder to your hosting provider
```

---

## Testing Checklist

After migration, test these critical paths:

- [ ] **User Sign Up** - Create new account
- [ ] **User Login** - Sign in with email/password
- [ ] **Upload Statement** - Upload a PDF credit card statement
- [ ] **Statement Processing** - Verify edge function processes PDF
- [ ] **View Transactions** - Check transactions table populates
- [ ] **Edit Category** - Change a transaction's category
- [ ] **Filter Transactions** - Test all filter options
- [ ] **Dashboard Charts** - Verify pie chart and bar chart render
- [ ] **File Storage** - Check PDFs are accessible in storage
- [ ] **RLS Policies** - Verify users only see their own data
- [ ] **Logout/Login** - Verify session persistence

---

## Rollback Plan

If something goes wrong:

1. **Keep Lovable Cloud version running** - Don't delete your Lovable project
2. **Point DNS back** to Lovable deployment
3. **Debug issues** in your new Supabase instance
4. **Iterate** until migration is successful

---

## Common Issues and Solutions

### Issue: Users can't see their data
**Solution**: Check RLS policies are correctly applied and user is authenticated

### Issue: Edge function fails
**Solution**: Check function logs in Supabase Dashboard → Edge Functions → Logs

### Issue: File uploads fail
**Solution**: Verify storage bucket policies allow authenticated users to upload

### Issue: Types are mismatched
**Solution**: Regenerate types with `supabase gen types typescript`

### Issue: AI parsing doesn't work
**Solution**: Check API key is set correctly with `supabase secrets list`

---

## Estimated Migration Time

- **Database Setup**: 30 minutes
- **Data Export/Import**: 1-2 hours (depending on data volume)
- **Edge Function Deployment**: 30 minutes
- **Frontend Configuration**: 15 minutes
- **Testing**: 1-2 hours
- **Total**: 3-5 hours

---

## Summary

Your application is well-structured and follows Supabase best practices:
- ✅ Proper RLS policies on all tables
- ✅ User-specific data isolation
- ✅ Secure edge function with JWT verification
- ✅ Clean separation of concerns
- ✅ Type-safe database queries

The migration should be straightforward because you're using standard Supabase patterns. The only "special" part is the Lovable AI integration in the edge function, which you can easily swap for OpenAI if needed.

**Keep this document for future reference when you're ready to migrate!**
