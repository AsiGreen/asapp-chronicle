import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MonthlyIncomeExpense } from "@/types/finance";
import { formatCurrency } from "@/lib/financeUtils";

interface IncomeExpenseChartProps {
  data: MonthlyIncomeExpense[];
}

export const IncomeExpenseChart = ({ data }: IncomeExpenseChartProps) => {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Bar dataKey="income" fill="hsl(142, 76%, 36%)" name="Income" />
        <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
};
