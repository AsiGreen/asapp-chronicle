import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IncomeOutcomeStats, Transaction, CategoryTotal, MonthlyIncomeExpense, TopSource } from "@/types/finance";
import { format } from "date-fns";

export const useIncomeOutcomeStats = (dateFrom?: Date, dateTo?: Date) => {
  const [stats, setStats] = useState<IncomeOutcomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchStats();
  }, [dateFrom, dateTo]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("transactions")
        .select("*");

      if (dateFrom) {
        query = query.gte("transaction_date", format(dateFrom, "yyyy-MM-dd"));
      }
      if (dateTo) {
        query = query.lte("transaction_date", format(dateTo, "yyyy-MM-dd"));
      }

      const { data: transactions, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const allTransactions = (transactions || []) as Transaction[];
      const incomeTransactions = allTransactions.filter(t => t.transaction_direction === 'income');
      const expenseTransactions = allTransactions.filter(t => t.transaction_direction === 'expense');

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount_ils), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount_ils), 0);
      const netCashflow = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

      // Group by category
      const incomeByCategory = groupByCategory(incomeTransactions);
      const expensesByCategory = groupByCategory(expenseTransactions);

      // Group by month
      const monthlyTrends = calculateMonthlyTrends(allTransactions);

      // Top income sources
      const topIncomeSources = calculateTopSources(incomeTransactions);

      setStats({
        totalIncome,
        totalExpenses,
        netCashflow,
        savingsRate,
        incomeByCategory,
        expensesByCategory,
        monthlyTrends,
        topIncomeSources,
        topExpenseCategories: expensesByCategory.slice(0, 5),
      });
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching income/outcome stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (transactions: Transaction[]): CategoryTotal[] => {
    const categoryMap = new Map<string, number>();
    
    transactions.forEach((t) => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + Number(t.amount_ils));
    });

    return Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const calculateMonthlyTrends = (transactions: Transaction[]): MonthlyIncomeExpense[] => {
    const monthMap = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach((t) => {
      const date = new Date(t.transaction_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const current = monthMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (t.transaction_direction === 'income') {
        current.income += Number(t.amount_ils);
      } else {
        current.expenses += Number(t.amount_ils);
      }
      
      monthMap.set(monthKey, current);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .reverse();
  };

  const calculateTopSources = (transactions: Transaction[]): TopSource[] => {
    const sourceMap = new Map<string, { amount: number; count: number; category: string }>();
    
    transactions.forEach((t) => {
      const current = sourceMap.get(t.merchant_name) || { amount: 0, count: 0, category: t.category };
      sourceMap.set(t.merchant_name, {
        amount: current.amount + Number(t.amount_ils),
        count: current.count + 1,
        category: t.category,
      });
    });

    return Array.from(sourceMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        category: data.category,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const refetch = () => {
    fetchStats();
  };

  return { stats, loading, error, refetch };
};
