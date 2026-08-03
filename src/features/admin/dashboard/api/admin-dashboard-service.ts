import type { MockFileResult } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  canViewFinancialField,
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import type {
  AdminDashboardFilterOptions,
  AdminDashboardFinancialMetrics,
  AdminDashboardQuery,
  AdminDashboardView,
} from '../model/admin-dashboard';

const metrics = {
  validClicks: 184_920,
  orders: 7_842,
  conversionRate: 4.24,
  trackedGmv: 18_420_000_000,
  exceptions: 36,
};

const financial = {
  estimatedCommission: 642_800_000,
  estimatedTenantShare: 385_700_000,
  grossCommission: 1_240_000_000,
  tenantShare: 743_800_000,
  affiliateKeep: 496_200_000,
};

const trend = [
  ['2026-07-18', 72_000_000, 95_000_000, 57_000_000],
  ['2026-07-19', 81_000_000, 101_000_000, 61_000_000],
  ['2026-07-20', 65_000_000, 89_000_000, 53_000_000],
  ['2026-07-21', 92_000_000, 121_000_000, 73_000_000],
  ['2026-07-22', 104_000_000, 116_000_000, 70_000_000],
  ['2026-07-23', 109_000_000, 111_000_000, 67_000_000],
  ['2026-07-24', 88_000_000, 107_000_000, 64_000_000],
].map(([date, estimatedCommission, confirmedCommission, tenantShare]) => ({
  date: date as string,
  estimatedCommission: estimatedCommission as number,
  confirmedCommission: confirmedCommission as number,
  tenantShare: tenantShare as number,
}));

const topBrands = [
  {
    brandId: 'brand-foodnest',
    brandName: 'FoodNest',
    orders: 2_840,
    trackedGmv: 6_720_000_000,
    grossCommission: 418_000_000,
  },
  {
    brandId: 'brand-travelgo',
    brandName: 'TravelGo',
    orders: 2_105,
    trackedGmv: 5_940_000_000,
    grossCommission: 365_000_000,
  },
  {
    brandId: 'brand-stylehub',
    brandName: 'StyleHub',
    orders: 1_484,
    trackedGmv: 3_880_000_000,
    grossCommission: 241_000_000,
  },
];

function projectFinancial(
  roleCode: AdminRoleCode,
): AdminDashboardFinancialMetrics {
  const projection: AdminDashboardFinancialMetrics = {};

  if (canViewFinancialField(roleCode, 'grossCommission')) {
    projection.estimatedCommission = financial.estimatedCommission;
    projection.grossCommission = financial.grossCommission;
  }
  if (canViewFinancialField(roleCode, 'tenantShare')) {
    projection.estimatedTenantShare = financial.estimatedTenantShare;
    projection.tenantShare = financial.tenantShare;
  }
  if (canViewFinancialField(roleCode, 'affiliateKeep')) {
    projection.affiliateKeep = financial.affiliateKeep;
  }

  return projection;
}

function emptyView(
  query: AdminDashboardQuery,
  roleCode: AdminRoleCode,
): AdminDashboardView {
  return {
    query,
    roleCode,
    metrics: {
      validClicks: 0,
      orders: 0,
      conversionRate: 0,
      trackedGmv: 0,
      exceptions: 0,
    },
    financial: {},
    trend: [],
    topBrands: [],
    orderStatus: [],
  };
}

export const adminDashboardService = {
  async getFilterOptions(): Promise<AdminDashboardFilterOptions> {
    return structuredClone({
      tenants: mockData.tenants.map(({ id, name }) => ({ id, name })),
      brands: mockData.brands.map(({ id, name }) => ({ id, name })),
      categories: [
        { id: 'category-travel', name: 'Travel' },
        { id: 'category-food', name: 'Food & Dining' },
        { id: 'category-fashion', name: 'Fashion' },
      ],
      offers: mockData.offers.map(({ id, title }) => ({ id, name: title })),
    });
  },

  async getDashboard(
    query: AdminDashboardQuery,
    roleCode: AdminRoleCode,
  ): Promise<AdminDashboardView> {
    if (!hasPermission(roleCode, 'dashboard.view')) {
      throw new Error('FORBIDDEN');
    }

    if (
      query.tenantId &&
      !mockData.tenants.some((tenant) => tenant.id === query.tenantId)
    ) {
      return emptyView(query, roleCode);
    }

    return structuredClone({
      query,
      roleCode,
      metrics,
      financial: projectFinancial(roleCode),
      trend,
      topBrands,
      orderStatus: [
        { status: 'PENDING', count: 2_716 },
        { status: 'CONFIRMED', count: 4_892 },
        { status: 'CANCELLED', count: 234 },
      ],
    });
  },

  async exportDashboard(
    query: AdminDashboardQuery,
    roleCode: AdminRoleCode,
  ): Promise<MockFileResult> {
    if (!hasPermission(roleCode, 'dashboard.view')) {
      throw new Error('FORBIDDEN');
    }

    return {
      fileName: `admin-dashboard-${query.fromDate}-to-${query.toDate}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  },
};
