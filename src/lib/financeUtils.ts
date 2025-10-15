import { format } from "date-fns";
import { Transaction, CategoryTotal, MonthlyData } from "@/types/finance";
import { 
  Hotel, 
  Building, 
  Film, 
  UtensilsCrossed, 
  Heart, 
  MoreHorizontal, 
  Briefcase, 
  ShoppingBag, 
  Laptop, 
  Car, 
  Plane 
} from "lucide-react";

const iconMap: Record<string, any> = {
  Hotel,
  Building,
  Film,
  UtensilsCrossed,
  Heart,
  MoreHorizontal,
  Briefcase,
  ShoppingBag,
  Laptop,
  Car,
  Plane,
};

export const formatCurrency = (amount: number, currency: string = "ILS"): string => {
  if (currency === "ILS") {
    return `₪${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
};

export const formatDate = (date: string | Date, formatStr: string = "MMM d, yyyy"): string => {
  return format(new Date(date), formatStr);
};

export const getCategoryIcon = (iconName: string) => {
  return iconMap[iconName] || MoreHorizontal;
};

export const calculateTotalSpending = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, t) => sum + Number(t.amount_ils), 0);
};

export const calculateAverageSpending = (transactions: Transaction[]): number => {
  if (transactions.length === 0) return 0;
  return calculateTotalSpending(transactions) / transactions.length;
};

export const groupByCategory = (
  transactions: Transaction[],
  categoryColorMap: Map<string, string>
): CategoryTotal[] => {
  const categoryMap = new Map<string, number>();
  
  transactions.forEach((t) => {
    const current = categoryMap.get(t.category) || 0;
    categoryMap.set(t.category, current + Number(t.amount_ils));
  });

  return Array.from(categoryMap.entries())
    .map(([category, total]) => ({
      category,
      total,
      color: categoryColorMap.get(category) || "hsl(215, 20%, 65%)"
    }))
    .sort((a, b) => b.total - a.total);
};

export const groupByMonth = (transactions: Transaction[]): MonthlyData[] => {
  const monthMap = new Map<string, number>();
  
  transactions.forEach((t) => {
    const date = new Date(t.transaction_date);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const current = monthMap.get(monthKey) || 0;
    monthMap.set(monthKey, current + Number(t.amount_ils));
  });

  return Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .reverse();
};

export const getTopCategory = (categoryData: CategoryTotal[]): string => {
  return categoryData.length > 0 ? categoryData[0].category : "N/A";
};
