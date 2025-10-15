import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/financeUtils";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useUpdateCategory } from "@/hooks/useUpdateCategory";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { TransactionFilters } from "./TransactionFilters";
import { CategorySelector } from "./CategorySelector";
import { TransactionTableSkeleton } from "./LoadingStates";
import { DEFAULT_FILTERS } from "@/constants/finance";
import { FilterState } from "@/types/finance";

export const TransactionsTable = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useTransactions(filters);
  const { categories } = useCategories();
  const { filterOptions, refetch: refetchFilterOptions } = useFilterOptions();
  const { updateCategory } = useUpdateCategory();

  const handleCategoryUpdate = async (transactionId: string, newCategory: string) => {
    await updateCategory(transactionId, newCategory, () => {
      refetchTransactions();
      refetchFilterOptions();
    });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = 
    filters.category !== "all" || 
    filters.transactionType !== "all" || 
    filters.currency !== "all" || 
    !!filters.dateFrom || 
    !!filters.dateTo || 
    filters.merchantSearch !== "";

  if (transactionsLoading) {
    return <TransactionTableSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Recent Transactions
        </CardTitle>
        <CardDescription>
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} found
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TransactionFilters
          filters={filters}
          onFilterChange={setFilters}
          filterOptions={filterOptions}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet. Upload a statement to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">ILS Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell>{transaction.merchant_name}</TableCell>
                    <TableCell>
                      <CategorySelector
                        currentCategory={transaction.category}
                        availableCategories={categories}
                        onCategoryChange={(newCategory) => 
                          handleCategoryUpdate(transaction.id, newCategory)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.original_amount, transaction.original_currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.amount_ils)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.transaction_type === "refund" ? "secondary" : "default"}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
