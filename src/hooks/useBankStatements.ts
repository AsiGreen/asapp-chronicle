import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BankStatement } from "@/types/finance";

export const useBankStatements = (dateFrom?: Date, dateTo?: Date) => {
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchStatements();
  }, [dateFrom, dateTo]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("bank_statements")
        .select("*")
        .order("statement_date_from", { ascending: false });

      if (dateFrom) {
        query = query.gte("statement_date_from", dateFrom.toISOString().split('T')[0]);
      }
      if (dateTo) {
        query = query.lte("statement_date_to", dateTo.toISOString().split('T')[0]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setStatements((data || []) as BankStatement[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching bank statements:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchStatements();
  };

  return { statements, loading, error, refetch };
};
