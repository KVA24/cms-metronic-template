import type {
  PageResult,
  TransactionHistory,
  TransactionItemStatus,
  TransactionStatus,
} from '../../../../shared/contracts';

export interface TenantTransactionQuery {
  search?: string;
  brandId?: string;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'updatedAt' | 'id';
  sortDirection: 'asc' | 'desc';
}

export interface TenantTransactionListItem {
  id: string;
  brandOrderId: string;
  memberRef: string | null;
  brand: { id: string; name: string };
  status: TransactionStatus;
  finalAmount: number;
  currency: 'VND';
  estimatedTenantShare: number;
  actualTenantShare: number;
  commissionConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantTransactionListResult extends PageResult<TenantTransactionListItem> {
  canExport: boolean;
  brands: Array<{ id: string; name: string }>;
}

export interface TenantTransactionItemView {
  id: string;
  code: string;
  name: string;
  sku: string | null;
  quantity: number;
  originalAmount: number;
  finalAmount: number;
  offerCode: string | null;
  categoryCode: string | null;
  tenantShareSource:
    | 'OFFER'
    | 'CATEGORY'
    | 'TENANT_BRAND_DEFAULT'
    | 'ALL_TENANT_DEFAULT';
  tenantShareValue: number;
  tenantShareReference: string;
  tenantShare: number;
  status: TransactionItemStatus;
  confirmedAt: string | null;
  refundedAt: string | null;
}

export interface TenantTransactionHistoryView {
  id: string;
  transactionItemId: string | null;
  eventType: TransactionHistory['eventType'];
  eventAt: string;
  processingResult: TransactionHistory['processingResult'];
  createdBy: string;
}

export interface TenantTransactionDetail {
  header: TenantTransactionListItem & {
    userId: string | null;
    customerRef: string | null;
  };
  items: TenantTransactionItemView[];
  histories: TenantTransactionHistoryView[];
}

export const TENANT_TRANSACTION_DEFAULT_QUERY: TenantTransactionQuery = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

export function validateTenantTransactionDateRange(
  query: TenantTransactionQuery,
) {
  return query.dateFrom && query.dateTo && query.dateFrom > query.dateTo
    ? 'DATE_RANGE_INVALID'
    : null;
}
