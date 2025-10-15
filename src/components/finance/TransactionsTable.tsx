import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Receipt, Search, X, Calendar as CalendarIcon, Hotel, Building, Film, UtensilsCrossed, Heart, MoreHorizontal, Briefcase, ShoppingBag, Laptop, Car, Plane } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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

interface Transaction {
  id: string;
  transaction_date: string;
  merchant_name: string;
  category: string;
  original_amount: number;
  original_currency: string;
  amount_ils: number;
  transaction_type: string;
}

export const TransactionsTable = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    transactionType: "all",
    currency: "all",
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    merchantSearch: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    currencies: [] as string[],
  });
  
  const [availableCategories, setAvailableCategories] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>>([]);

  useEffect(() => {
    fetchFilterOptions();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setAvailableCategories(data);
    }
  };

  const updateTransactionCategory = async (transactionId: string, newCategory: string) => {
    const { error } = await supabase
      .from("transactions")
      .update({ category: newCategory })
      .eq("id", transactionId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success",
      description: "Category updated successfully",
    });
    
    fetchTransactions();
    fetchFilterOptions();
  };

  const fetchFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("category, original_currency");

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(t => t.category) || [])].sort();
      const uniqueCurrencies = [...new Set(data?.map(t => t.original_currency) || [])].sort();
      
      setFilterOptions({
        categories: uniqueCategories,
        currencies: uniqueCurrencies,
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
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

      const { data, error } = await query
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: "all",
      transactionType: "all",
      currency: "all",
      dateFrom: undefined,
      dateTo: undefined,
      merchantSearch: "",
    });
  };

  const hasActiveFilters = filters.category !== "all" || 
    filters.transactionType !== "all" || 
    filters.currency !== "all" || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.merchantSearch;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
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
        {/* Filters Section */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.transactionType} onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.currency} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Currencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {filterOptions.currencies.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "Date from"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "Date to"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchant..."
                value={filters.merchantSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, merchantSearch: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
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
                      {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{transaction.merchant_name}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto font-normal hover:bg-transparent"
                          >
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-accent transition-colors"
                            >
                              {transaction.category}
                            </Badge>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-popover z-50">
                          <div className="grid gap-1 max-h-64 overflow-y-auto">
                            {availableCategories.map((cat) => {
                              const Icon = iconMap[cat.icon] || MoreHorizontal;
                              return (
                                <Button
                                  key={cat.id}
                                  variant="ghost"
                                  className="justify-start"
                                  onClick={() => updateTransactionCategory(transaction.id, cat.name)}
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  {cat.name}
                                </Button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.original_amount.toFixed(2)} {transaction.original_currency}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₪{transaction.amount_ils.toFixed(2)}
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