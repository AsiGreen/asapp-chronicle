import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, CategoryTotal, MonthlyData } from "@/types/finance";
import { 
  calculateTotalSpending, 
  calculateAverageSpending, 
  groupByCategory, 
  groupByMonth,
  getTopCategory 
} from "@/lib/financeUtils";

interface DashboardStats {
  totalSpending: number;
  transactionCount: number;
  averageSpending: number;
  topCategory: string;
  categoryData: CategoryTotal[];
  monthlyData: MonthlyData[];
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSpending: 0,
    transactionCount: 0,
    averageSpending: 0,
    topCategory: "N/A",
    categoryData: [],
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch all transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (transactionsError) throw transactionsError;

      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      // Cast transactions to proper type
      const typedTransactions = transactions as Transaction[];

      // Fetch categories for colors
      const { data: categories } = await supabase
        .from("categories")
        .select("name, color");

      const categoryColorMap = new Map(categories?.map(c => [c.name, c.color]) || []);

      // Calculate all stats
      const totalSpending = calculateTotalSpending(typedTransactions);
      const transactionCount = typedTransactions.length;
      const averageSpending = calculateAverageSpending(typedTransactions);
      const categoryData = groupByCategory(typedTransactions, categoryColorMap);
      const monthlyData = groupByMonth(typedTransactions);
      const topCategory = getTopCategory(categoryData);

      setStats({
        totalSpending,
        transactionCount,
        averageSpending,
        topCategory,
        categoryData,
        monthlyData,
      });
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDashboardStats();
  };

  return { stats, loading, error, refetch };
};
