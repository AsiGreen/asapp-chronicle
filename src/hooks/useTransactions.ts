import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, FilterState } from "@/types/finance";
import { format } from "date-fns";
import { DEFAULT_TRANSACTION_LIMIT } from "@/constants/finance";

export const useTransactions = (filters: FilterState) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("transactions")
        .select("*");

      // Apply filters
      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.transactionType !== "all") {
        query = query.eq("transaction_type", filters.transactionType);
      }
      if (filters.currency !== "all") {
        query = query.eq("original_currency", filters.currency);
      }
      if (filters.dateFrom) {
        query = query.gte("transaction_date", format(filters.dateFrom, "yyyy-MM-dd"));
      }
      if (filters.dateTo) {
        query = query.lte("transaction_date", format(filters.dateTo, "yyyy-MM-dd"));
      }
      if (filters.merchantSearch) {
        query = query.ilike("merchant_name", `%${filters.merchantSearch}%`);
      }

      const { data, error: fetchError } = await query
        .order("transaction_date", { ascending: false })
        .limit(DEFAULT_TRANSACTION_LIMIT);

      if (fetchError) throw fetchError;
      setTransactions((data || []) as Transaction[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchTransactions();
  };

  return { transactions, loading, error, refetch };
};
