import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomeOutcomeStats } from "@/hooks/useIncomeOutcomeStats";
import { MetricCard } from "@/components/MetricCard";
import { TrendingUp, TrendingDown, Wallet, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/financeUtils";
import { CategoryPieChart } from "./CategoryPieChart";
import { IncomeExpenseChart } from "./IncomeExpenseChart";
import { TransactionTableSkeleton, DashboardCardsSkeleton } from "./LoadingStates";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export const IncomeOutcomeReport = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const { stats, loading } = useIncomeOutcomeStats(dateFrom, dateTo);

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardCardsSkeleton />
        <TransactionTableSkeleton />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Income"
          value={formatCurrency(stats.totalIncome)}
          change="+100%"
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          change="-100%"
          icon={TrendingDown}
          trend="down"
        />
        <MetricCard
          title="Net Cashflow"
          value={formatCurrency(stats.netCashflow)}
          change={stats.netCashflow >= 0 ? "+0%" : "-0%"}
          icon={Wallet}
          trend={stats.netCashflow >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Savings Rate"
          value={`${stats.savingsRate.toFixed(1)}%`}
          change={stats.savingsRate > 20 ? "+0%" : "0%"}
          icon={Percent}
          trend={stats.savingsRate > 20 ? "up" : "neutral"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income by Category</CardTitle>
            <CardDescription>Breakdown of income sources</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.incomeByCategory.length > 0 ? (
              <CategoryPieChart data={stats.incomeByCategory} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No income data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of spending</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.expensesByCategory.length > 0 ? (
              <CategoryPieChart data={stats.expensesByCategory} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No expense data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Income vs Expenses</CardTitle>
          <CardDescription>Track your cashflow over time</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.monthlyTrends.length > 0 ? (
            <IncomeExpenseChart data={stats.monthlyTrends} />
          ) : (
            <p className="text-center text-muted-foreground py-8">No monthly data</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Income Sources</CardTitle>
            <CardDescription>Your main income contributors</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topIncomeSources.length > 0 ? (
              <div className="space-y-3">
                {stats.topIncomeSources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-sm text-muted-foreground">{source.count} transaction(s)</p>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(source.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No income sources</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topExpenseCategories.length > 0 ? (
              <div className="space-y-3">
                {stats.topExpenseCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">{cat.category}</p>
                    <p className="font-bold text-red-600">{formatCurrency(cat.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No expense categories</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
