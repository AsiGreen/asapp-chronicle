-- First, remove statement_id references from transactions table
ALTER TABLE public.transactions DROP COLUMN IF EXISTS statement_id;

-- Drop the statements table (credit card statements)
DROP TABLE IF EXISTS public.statements CASCADE;

-- Delete all objects from credit-card-statements bucket first
DELETE FROM storage.objects WHERE bucket_id = 'credit-card-statements';

-- Now delete the bucket
DELETE FROM storage.buckets WHERE id = 'credit-card-statements';