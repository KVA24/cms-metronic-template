export const TENANT_DASHBOARD_RANGES = ['WEEK', 'MONTH', 'YEAR'] as const;

export type TenantDashboardRange = (typeof TENANT_DASHBOARD_RANGES)[number];

export interface TenantDashboardQuery {
  range: TenantDashboardRange;
  brandId?: string;
}

export interface TenantDashboardFilterOption {
  id: string;
  name: string;
}

export interface TenantDashboardMetrics {
  trackedClicks: number;
  attributedOrders: number;
  clickToOrderRate: number;
  revenue?: number;
  actualCommission?: number;
}

export interface TenantDashboardTrendPoint {
  bucket: string;
  revenue?: number;
  actualCommission?: number;
  orders: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export interface TenantDashboardTopBrand {
  brandId: string;
  brandName: string;
  orders: number;
  revenue?: number;
  actualCommission?: number;
}

export type TenantCommissionSource =
  | 'OFFER'
  | 'CATEGORY'
  | 'TENANT_BRAND_DEFAULT'
  | 'ALL_TENANT_DEFAULT';

export interface TenantCommissionDistribution {
  source: TenantCommissionSource;
  amount: number;
  percentage: number;
}

export interface TenantDashboardView {
  query: TenantDashboardQuery;
  generatedAt: string;
  tenantName: string;
  brandOptions: TenantDashboardFilterOption[];
  metrics: TenantDashboardMetrics;
  trend: TenantDashboardTrendPoint[];
  topBrands: TenantDashboardTopBrand[];
  commissionDistribution?: TenantCommissionDistribution[];
  hasFinancialAccess: boolean;
}

export const TENANT_DASHBOARD_DEFAULT_QUERY: TenantDashboardQuery = {
  range: 'MONTH',
};
