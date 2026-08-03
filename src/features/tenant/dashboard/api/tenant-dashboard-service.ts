import type { AuthSession } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  TENANT_DASHBOARD_RANGES,
  type TenantCommissionDistribution,
  type TenantDashboardMetrics,
  type TenantDashboardQuery,
  type TenantDashboardRange,
  type TenantDashboardTopBrand,
  type TenantDashboardTrendPoint,
  type TenantDashboardView,
} from '../model/tenant-dashboard';

interface TenantDashboardSeed {
  trackedClicks: number;
  attributedOrders: number;
  revenue: number;
  actualCommission: number;
  trendValues: readonly number[];
  distribution: readonly [TenantCommissionDistribution['source'], number][];
}

const seeds: Record<
  string,
  Partial<Record<TenantDashboardRange, TenantDashboardSeed>>
> = {
  'tenant-lotus': {
    WEEK: {
      trackedClicks: 4_870,
      attributedOrders: 214,
      revenue: 408_000_000,
      actualCommission: 18_700_000,
      trendValues: [42, 55, 48, 61, 74, 69, 83],
      distribution: [
        ['OFFER', 8_000_000],
        ['CATEGORY', 4_500_000],
        ['TENANT_BRAND_DEFAULT', 3_700_000],
        ['ALL_TENANT_DEFAULT', 2_500_000],
      ],
    },
    MONTH: {
      trackedClicks: 18_420,
      attributedOrders: 792,
      revenue: 1_584_000_000,
      actualCommission: 72_600_000,
      trendValues: [
        42, 38, 51, 47, 59, 63, 55, 68, 72, 61, 77, 81, 74, 69, 86, 91, 84, 96,
        89, 103, 98, 107, 101, 114, 109, 121, 118, 126, 132, 125, 139,
      ],
      distribution: [
        ['OFFER', 30_000_000],
        ['CATEGORY', 18_000_000],
        ['TENANT_BRAND_DEFAULT', 14_600_000],
        ['ALL_TENANT_DEFAULT', 10_000_000],
      ],
    },
    YEAR: {
      trackedClicks: 162_800,
      attributedOrders: 6_954,
      revenue: 13_920_000_000,
      actualCommission: 638_400_000,
      trendValues: [72, 78, 83, 89, 94, 101, 108, 113, 119, 126, 131, 139],
      distribution: [
        ['OFFER', 270_000_000],
        ['CATEGORY', 151_000_000],
        ['TENANT_BRAND_DEFAULT', 127_400_000],
        ['ALL_TENANT_DEFAULT', 90_000_000],
      ],
    },
  },
  'tenant-bamboo': {
    WEEK: {
      trackedClicks: 2_160,
      attributedOrders: 96,
      revenue: 326_000_000,
      actualCommission: 12_900_000,
      trendValues: [26, 31, 29, 38, 35, 42, 47],
      distribution: [
        ['OFFER', 5_000_000],
        ['CATEGORY', 3_200_000],
        ['TENANT_BRAND_DEFAULT', 2_700_000],
        ['ALL_TENANT_DEFAULT', 2_000_000],
      ],
    },
    MONTH: {
      trackedClicks: 8_740,
      attributedOrders: 381,
      revenue: 1_296_000_000,
      actualCommission: 51_800_000,
      trendValues: [
        26, 31, 29, 38, 35, 42, 47, 44, 51, 49, 56, 53, 61, 58, 64, 67, 63, 71,
        68, 75, 73, 79, 76, 82, 85, 81, 88, 91, 87, 94, 98,
      ],
      distribution: [
        ['OFFER', 21_800_000],
        ['CATEGORY', 12_000_000],
        ['TENANT_BRAND_DEFAULT', 10_000_000],
        ['ALL_TENANT_DEFAULT', 8_000_000],
      ],
    },
  },
};

function assertAccess(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('dashboard.view')
  ) {
    throw new Error('FORBIDDEN');
  }

  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
  return tenant;
}

function isRange(value: string): value is TenantDashboardRange {
  return TENANT_DASHBOARD_RANGES.includes(value as TenantDashboardRange);
}

function buckets(range: TenantDashboardRange, count: number) {
  if (range === 'WEEK')
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (range === 'YEAR')
    return Array.from({ length: count }, (_, index) => `M${index + 1}`);
  return Array.from({ length: count }, (_, index) =>
    String(index + 1).padStart(2, '0'),
  );
}

function projectTrend(
  seed: TenantDashboardSeed,
  range: TenantDashboardRange,
  financial: boolean,
): TenantDashboardTrendPoint[] {
  const allocate = (total: number) => {
    const weightTotal = seed.trendValues.reduce((sum, value) => sum + value, 0);
    let allocated = 0;
    return seed.trendValues.map((weight, index) => {
      const value =
        index === seed.trendValues.length - 1
          ? total - allocated
          : Math.floor((total * weight) / weightTotal);
      allocated += value;
      return value;
    });
  };
  const orderValues = allocate(seed.attributedOrders);
  const revenueValues = allocate(seed.revenue);
  const commissionValues = allocate(seed.actualCommission);

  return buckets(range, seed.trendValues.length).map((bucket, index) => {
    const orders = orderValues[index];
    const confirmed = Math.floor(orders * 0.65);
    const cancelled = Math.floor(orders * 0.05);
    return {
      bucket,
      orders,
      pending: orders - confirmed - cancelled,
      confirmed,
      cancelled,
      ...(financial
        ? {
            revenue: revenueValues[index],
            actualCommission: commissionValues[index],
          }
        : {}),
    };
  });
}

function emptyView(
  query: TenantDashboardQuery,
  tenantName: string,
  brandOptions: Array<{ id: string; name: string }>,
  financial: boolean,
): TenantDashboardView {
  return {
    query,
    generatedAt: '2026-08-03T09:30:00.000Z',
    tenantName,
    brandOptions,
    metrics: { trackedClicks: 0, attributedOrders: 0, clickToOrderRate: 0 },
    trend: [],
    topBrands: [],
    ...(financial
      ? {
          commissionDistribution: [
            'OFFER',
            'CATEGORY',
            'TENANT_BRAND_DEFAULT',
            'ALL_TENANT_DEFAULT',
          ].map((source) => ({
            source: source as TenantCommissionDistribution['source'],
            amount: 0,
            percentage: 0,
          })),
        }
      : {}),
    hasFinancialAccess: financial,
  };
}

export const tenantDashboardService = {
  async getDashboard(
    session: AuthSession,
    query: TenantDashboardQuery,
  ): Promise<TenantDashboardView> {
    const tenant = assertAccess(session);
    if (!isRange(query.range)) throw new Error('INVALID_DATE_RANGE');

    const brandOptions: Array<{ id: string; name: string }> = [];
    for (const assignment of mockData.tenantBrandAssignments) {
      if (assignment.tenantId !== session.tenantId) continue;
      const brand = mockData.brands.find(({ id }) => id === assignment.brandId);
      if (brand) brandOptions.push({ id: brand.id, name: brand.name });
    }

    if (query.brandId && !brandOptions.some(({ id }) => id === query.brandId)) {
      throw new Error('INVALID_BRAND');
    }

    const financial = ['TENANT_ADMIN', 'TENANT_FINANCE'].includes(
      session.roleCode,
    );
    const seed = seeds[session.tenantId]?.[query.range];
    if (!seed) return emptyView(query, tenant.name, brandOptions, financial);

    const metrics: TenantDashboardMetrics = {
      trackedClicks: seed.trackedClicks,
      attributedOrders: seed.attributedOrders,
      clickToOrderRate: Number(
        ((seed.attributedOrders / seed.trackedClicks) * 100).toFixed(1),
      ),
      ...(financial
        ? { revenue: seed.revenue, actualCommission: seed.actualCommission }
        : {}),
    };
    const distribution = seed.distribution.map(([source, amount]) => ({
      source,
      amount,
      percentage: Number(((amount / seed.actualCommission) * 100).toFixed(1)),
    }));
    const brandName =
      brandOptions.find(({ id }) => id === query.brandId)?.name ??
      brandOptions[0]?.name ??
      '';
    const topBrands: TenantDashboardTopBrand[] = brandName
      ? [
          {
            brandId: query.brandId ?? brandOptions[0].id,
            brandName,
            orders: seed.attributedOrders,
            ...(financial
              ? {
                  revenue: seed.revenue,
                  actualCommission: seed.actualCommission,
                }
              : {}),
          },
        ]
      : [];

    return structuredClone({
      query,
      generatedAt: '2026-08-03T09:30:00.000Z',
      tenantName: tenant.name,
      brandOptions,
      metrics,
      trend: projectTrend(seed, query.range, financial),
      topBrands,
      ...(financial ? { commissionDistribution: distribution } : {}),
      hasFinancialAccess: financial,
    });
  },
};
