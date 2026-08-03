import type { AdminRoleCode } from '../../../../shared/permissions';

export interface AdminDashboardQuery {
  fromDate: string;
  toDate: string;
  tenantId?: string;
  brandId?: string;
  categoryId?: string;
  offerId?: string;
  orderStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export const ADMIN_DASHBOARD_DEFAULT_QUERY: AdminDashboardQuery = {
  fromDate: '2026-07-01',
  toDate: '2026-07-24',
};

export function readAdminDashboardQuery(
  searchParams: URLSearchParams,
): AdminDashboardQuery {
  const query: AdminDashboardQuery = {
    fromDate:
      searchParams.get('fromDate') ?? ADMIN_DASHBOARD_DEFAULT_QUERY.fromDate,
    toDate: searchParams.get('toDate') ?? ADMIN_DASHBOARD_DEFAULT_QUERY.toDate,
  };

  for (const field of [
    'tenantId',
    'brandId',
    'categoryId',
    'offerId',
  ] as const) {
    const value = searchParams.get(field);
    if (value) query[field] = value;
  }

  const status = searchParams.get('orderStatus');
  if (
    status === 'PENDING' ||
    status === 'CONFIRMED' ||
    status === 'CANCELLED'
  ) {
    query.orderStatus = status;
  }

  return query;
}

export interface AdminDashboardMetrics {
  validClicks: number;
  orders: number;
  conversionRate: number;
  trackedGmv: number;
  exceptions: number;
}

export interface AdminDashboardFinancialMetrics {
  estimatedCommission?: number;
  estimatedTenantShare?: number;
  grossCommission?: number;
  tenantShare?: number;
  affiliateKeep?: number;
}

export interface AdminDashboardTrendPoint {
  date: string;
  estimatedCommission: number;
  confirmedCommission: number;
  tenantShare: number;
}

export interface AdminDashboardTopBrand {
  brandId: string;
  brandName: string;
  orders: number;
  trackedGmv: number;
  grossCommission: number;
}

export interface AdminDashboardView {
  query: AdminDashboardQuery;
  roleCode: AdminRoleCode;
  metrics: AdminDashboardMetrics;
  financial: AdminDashboardFinancialMetrics;
  trend: AdminDashboardTrendPoint[];
  topBrands: AdminDashboardTopBrand[];
  orderStatus: Array<{
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    count: number;
  }>;
}

export interface AdminDashboardFilterOptions {
  tenants: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  offers: Array<{ id: string; name: string }>;
}
