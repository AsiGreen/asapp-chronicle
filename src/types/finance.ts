export interface Transaction {
  id: string;
  transaction_date: string;
  merchant_name: string;
  category: string;
  original_amount: number;
  original_currency: string;
  amount_ils: number;
  transaction_type: string;
  description?: string;
  card_last_4?: string;
  exchange_rate?: number;
  fee?: number;
  payment_date?: string;
  statement_id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parent_category_id?: string;
  created_at?: string;
}

export interface Statement {
  id: string;
  user_id: string;
  file_url: string;
  statement_date: string;
  card_number: string;
  card_type?: string;
  total_amount: number;
  status: 'processing' | 'completed' | 'failed';
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterState {
  category: string;
  transactionType: string;
  currency: string;
  dateFrom?: Date;
  dateTo?: Date;
  merchantSearch: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  amount: number;
}

export interface FilterOptions {
  categories: string[];
  currencies: string[];
}
