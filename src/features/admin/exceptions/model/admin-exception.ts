import type { ExceptionGroup } from '@/shared/contracts';

export interface AdminExceptionQuery {
  keyword: string;
  tenantId: string;
  brandId: string;
  group: 'ALL' | ExceptionGroup;
  status: 'ALL' | 'OPEN' | 'RESOLVED';
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

export const EXCEPTION_GROUPS: ExceptionGroup[] = [
  'REQUEST_AUTHENTICATION',
  'CLICK_ELIGIBILITY',
  'BRAND_COMMISSION',
  'TENANT_SHARE',
  'CANCEL_REFUND',
  'TRANSACTION_PERSISTENCE',
];

export const ADMIN_EXCEPTION_DEFAULT_QUERY: AdminExceptionQuery = {
  keyword: '',
  tenantId: '',
  brandId: '',
  group: 'ALL',
  status: 'ALL',
  dateFrom: '2026-07-05',
  dateTo: '2026-08-03',
  page: 1,
  pageSize: 10,
};

export function validateExceptionDateRange(query: AdminExceptionQuery) {
  return query.dateFrom && query.dateTo && query.dateFrom > query.dateTo
    ? { dateTo: 'DATE_RANGE_INVALID' }
    : {};
}
