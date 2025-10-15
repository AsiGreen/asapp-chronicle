export const TRANSACTION_TYPES = {
  REGULAR: 'regular',
  REFUND: 'refund',
  ALL: 'all',
} as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ACCEPTED_FILE_TYPE = 'application/pdf';
export const DEFAULT_TRANSACTION_LIMIT = 50;

export const STATEMENT_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const DEFAULT_FILTERS = {
  category: 'all',
  transactionType: 'all',
  currency: 'all',
  dateFrom: undefined,
  dateTo: undefined,
  merchantSearch: '',
} as const;
