import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FilterOptions } from "@/types/finance";

export const useFilterOptions = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    currencies: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("category, original_currency");

      if (fetchError) throw fetchError;

      const uniqueCategories = [...new Set(data?.map(t => t.category) || [])].sort();
      const uniqueCurrencies = [...new Set(data?.map(t => t.original_currency) || [])].sort();

      setFilterOptions({
        categories: uniqueCategories,
        currencies: uniqueCurrencies,
      });
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching filter options:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchFilterOptions();
  };

  return { filterOptions, loading, error, refetch };
};
