import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, BusinessLookupResult } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";

export const useBusinessLookup = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BusinessLookupResult[]>([]);
  const { toast } = useToast();

  const lookupMerchants = async (transactions: Transaction[]) => {
    setLoading(true);
    setResults([]);

    const initialResults: BusinessLookupResult[] = transactions.map(t => ({
      transactionId: t.id,
      merchantName: t.merchant_name,
      businessName: '',
      businessType: '',
      suggestedCategory: '',
      currentCategory: t.category,
      confidence: 0,
      description: '',
      loading: true,
    }));

    setResults(initialResults);

    try {
      const lookupPromises = transactions.map(async (transaction) => {
        try {
          const { data, error } = await supabase.functions.invoke('lookup-merchant', {
            body: {
              merchantName: transaction.merchant_name,
              category: transaction.category,
              amount: transaction.original_amount,
              currency: transaction.original_currency,
            },
          });

          if (error) throw error;

          return {
            transactionId: transaction.id,
            merchantName: transaction.merchant_name,
            currentCategory: transaction.category,
            businessName: data.businessName || transaction.merchant_name,
            businessType: data.businessType || 'Unknown',
            suggestedCategory: data.suggestedCategory || transaction.category,
            confidence: data.confidence || 0,
            description: data.description || '',
            website: data.website,
            location: data.location,
            loading: false,
          };
        } catch (err) {
          console.error(`Error looking up ${transaction.merchant_name}:`, err);
          return {
            transactionId: transaction.id,
            merchantName: transaction.merchant_name,
            currentCategory: transaction.category,
            businessName: transaction.merchant_name,
            businessType: 'Unknown',
            suggestedCategory: transaction.category,
            confidence: 0,
            description: '',
            loading: false,
            error: err instanceof Error ? err.message : 'Lookup failed',
          };
        }
      });

      const completedResults = await Promise.all(lookupPromises);
      setResults(completedResults);
    } catch (error) {
      console.error('Error during business lookup:', error);
      toast({
        title: "Error",
        description: "Failed to lookup businesses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { lookupMerchants, loading, results };
};
