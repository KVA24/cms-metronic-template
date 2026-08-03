import type { TransactionStatus } from '@/shared/contracts';

export interface AdminTransactionQuery {
  keyword: string;
  tenantId: string;
  brandId: string;
  status: 'ALL' | TransactionStatus;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortBy: 'updatedAt' | 'createdAt' | 'id';
  sortDirection: 'asc' | 'desc';
}

export const ADMIN_TRANSACTION_DEFAULT_QUERY: AdminTransactionQuery = {
  keyword: '',
  tenantId: '',
  brandId: '',
  status: 'ALL',
  dateFrom: '2026-07-05',
  dateTo: '2026-08-03',
  page: 1,
  pageSize: 10,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

export function validateTransactionDateRange(query: AdminTransactionQuery) {
  return query.dateFrom && query.dateTo && query.dateFrom > query.dateTo
    ? { dateTo: 'DATE_RANGE_INVALID' }
    : {};
}
