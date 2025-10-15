import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Receipt, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CategoryTotal {
  category: string;
  total: number;
  color: string;
}

interface MonthlyData {
  month: string;
  amount: number;
}

export const FinanceDashboard = () => {
  const [totalSpending, setTotalSpending] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [topCategory, setTopCategory] = useState<string>("");
  const [categoryData, setCategoryData] = useState<CategoryTotal[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate total spending
      const total = transactions.reduce((sum, t) => sum + Number(t.amount_ils), 0);
      setTotalSpending(total);
      setTransactionCount(transactions.length);

      // Group by category
      const categoryMap = new Map<string, number>();
      transactions.forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + Number(t.amount_ils));
      });

      // Fetch categories for colors
      const { data: categories } = await supabase
        .from("categories")
        .select("name, color");

      const categoryColorMap = new Map(categories?.map(c => [c.name, c.color]) || []);

      // Convert to array and sort
      const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
        .map(([category, total]) => ({
          category,
          total,
          color: categoryColorMap.get(category) || "hsl(215, 20%, 65%)"
        }))
        .sort((a, b) => b.total - a.total);

      setCategoryData(categoryTotals);
      if (categoryTotals.length > 0) {
        setTopCategory(categoryTotals[0].category);
      }

      // Group by month
      const monthMap = new Map<string, number>();
      transactions.forEach((t) => {
        const date = new Date(t.transaction_date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const current = monthMap.get(monthKey) || 0;
        monthMap.set(monthKey, current + Number(t.amount_ils));
      });

      const monthlyTotals: MonthlyData[] = Array.from(monthMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .reverse();

      setMonthlyData(monthlyTotals);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalSpending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCount}</div>
            <p className="text-xs text-muted-foreground">Total recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCategory || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Most spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{transactionCount > 0 ? (totalSpending / transactionCount).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {categoryData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};