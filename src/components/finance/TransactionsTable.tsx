import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Search, X } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/financeUtils";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useUpdateCategory } from "@/hooks/useUpdateCategory";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { useBusinessLookup } from "@/hooks/useBusinessLookup";
import { TransactionFilters } from "./TransactionFilters";
import { CategorySelector } from "./CategorySelector";
import { TransactionTableSkeleton } from "./LoadingStates";
import { BusinessLookupDialog } from "./BusinessLookupDialog";
import { DEFAULT_FILTERS } from "@/constants/finance";
import { FilterState } from "@/types/finance";

export const TransactionsTable = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showLookupDialog, setShowLookupDialog] = useState(false);
  
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useTransactions(filters);
  const { categories } = useCategories();
  const { filterOptions, refetch: refetchFilterOptions } = useFilterOptions();
  const { updateCategory } = useUpdateCategory();
  const { lookupMerchants, results } = useBusinessLookup();

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleLookupBusiness = async () => {
    const selectedTxns = transactions.filter(t => selectedTransactions.includes(t.id));
    await lookupMerchants(selectedTxns);
    setShowLookupDialog(true);
  };

  const handleClearSelection = () => {
    setSelectedTransactions([]);
  };

  const handleCategoryUpdateFromLookup = async (transactionId: string, newCategory: string) => {
    await handleCategoryUpdate(transactionId, newCategory);
    refetchTransactions();
    refetchFilterOptions();
  };

  const allSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const someSelected = selectedTransactions.length > 0 && !allSelected;

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
        {selectedTransactions.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedTransactions.length} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleLookupBusiness} size="sm" className="gap-2">
                <Search className="w-4 h-4" />
                Look Up Business
              </Button>
              <Button onClick={handleClearSelection} size="sm" variant="ghost" className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all transactions"
                      className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                    />
                  </TableHead>
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
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.includes(transaction.id)}
                        onCheckedChange={(checked) => 
                          handleSelectTransaction(transaction.id, checked as boolean)
                        }
                        aria-label={`Select ${transaction.merchant_name}`}
                      />
                    </TableCell>
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

      <BusinessLookupDialog
        open={showLookupDialog}
        onClose={() => setShowLookupDialog(false)}
        transactions={transactions.filter(t => selectedTransactions.includes(t.id))}
        results={results}
        onCategoryUpdate={handleCategoryUpdateFromLookup}
      />
    </Card>
  );
};
