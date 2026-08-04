import type { TenantRevenueShare } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  adminTenantRevenueSchema,
  type AdminTenantRevenueInput,
  type AdminTenantRevenueQuery,
} from '../model/admin-tenant-revenue';

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'tenants.revenue_share.view' | 'tenants.revenue_share.edit',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function assignment(tenantId: string, brandId: string) {
  return mockData.tenantBrandAssignments.find(
    (item) => item.tenantId === tenantId && item.brandId === brandId,
  );
}

function context(tenantId: string, brandId: string) {
  const tenant = mockData.tenants.find(({ id }) => id === tenantId);
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!tenant) throw new Error('TENANT_NOT_FOUND');
  if (!brand) throw new Error('BRAND_NOT_FOUND');
  const assigned = assignment(tenantId, brandId);
  if (!assigned) throw new Error('BRAND_NOT_ASSIGNED');
  const categories = mockData.brandCategoryMappings.flatMap((mapping) => {
    if (mapping.brandId !== brandId) return [];
    const category = mockData.categories.find(
      ({ id }) => id === mapping.categoryId,
    )!;
    return [
      {
        id: category.id,
        name:
          category.contents.find(({ locale }) => locale === 'vi-VN')?.name ??
          category.code,
      },
    ];
  });
  const offers = mockData.offers.flatMap(
    ({ id, brandId: offerBrandId, title, status }) =>
      offerBrandId === brandId ? [{ id, name: title, status }] : [],
  );
  return { tenant, brand, assigned, categories, offers };
}

export const adminTenantRevenueService = {
  async listRevenueShares(
    tenantId: string,
    query: AdminTenantRevenueQuery,
    roleCode: AdminRoleCode,
  ) {
    assertPermission(roleCode, 'tenants.revenue_share.view');
    const tenant = mockData.tenants.find(({ id }) => id === tenantId);
    if (!tenant) throw new Error('TENANT_NOT_FOUND');
    const keyword = query.keyword.trim().toLowerCase();
    const items = mockData.tenantBrandAssignments.flatMap((item) => {
      if (item.tenantId !== tenantId) return [];
      const brand = mockData.brands.find(({ id }) => id === item.brandId);
      if (!brand) return [];
      const config = mockData.tenantRevenueShares.find(
        (rule) => rule.tenantId === tenantId && rule.brandId === brand.id,
      );
      if (
        keyword &&
        ![brand.id, brand.name].some((value) =>
          value.toLowerCase().includes(keyword),
        )
      )
        return [];
      if (query.brandId && brand.id !== query.brandId) return [];
      if (query.config === 'CONFIGURED' && !config) return [];
      if (query.config === 'UNCONFIGURED' && config) return [];
      if (query.status !== 'ALL' && config?.status !== query.status) return [];
      return [
        {
          brand,
          visible: item.showOnLanding && brand.status === 'ACTIVE',
          configured: Boolean(config),
          brandRate: config?.brandRate ?? null,
          categoryOverrideCount:
            config?.overrides.filter(({ type }) => type === 'CATEGORY')
              .length ?? 0,
          offerOverrideCount:
            config?.overrides.filter(({ type }) => type === 'OFFER').length ??
            0,
          status: config?.status ?? null,
          updatedAt: config?.updatedAt ?? null,
        },
      ];
    });
    return structuredClone({
      tenant,
      items,
      canEdit: hasPermission(roleCode, 'tenants.revenue_share.edit'),
    });
  },

  async getRevenueShare(
    tenantId: string,
    brandId: string,
    roleCode: AdminRoleCode,
  ) {
    assertPermission(roleCode, 'tenants.revenue_share.view');
    const current = context(tenantId, brandId);
    const config =
      mockData.tenantRevenueShares.find(
        (rule) => rule.tenantId === tenantId && rule.brandId === brandId,
      ) ?? null;
    return structuredClone({
      ...current,
      visible:
        current.assigned.showOnLanding && current.brand.status === 'ACTIVE',
      config,
      canEdit: hasPermission(roleCode, 'tenants.revenue_share.edit'),
    });
  },

  async saveRevenueShare(
    tenantId: string,
    brandId: string,
    input: AdminTenantRevenueInput,
    expectedVersion: number | null,
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'tenants.revenue_share.edit');
    const currentContext = context(tenantId, brandId);
    const parsed = adminTenantRevenueSchema.parse(input);
    const current = mockData.tenantRevenueShares.find(
      (rule) => rule.tenantId === tenantId && rule.brandId === brandId,
    );
    if ((current?.version ?? null) !== expectedVersion)
      throw new Error('VERSION_CONFLICT');
    if (
      parsed.status === 'ACTIVE' &&
      (!currentContext.assigned.showOnLanding ||
        currentContext.brand.status !== 'ACTIVE')
    )
      throw new Error('BRAND_NOT_VISIBLE');
    const categoryIds = new Set(currentContext.categories.map(({ id }) => id));
    const offerIds = new Set(currentContext.offers.map(({ id }) => id));
    parsed.overrides.forEach((override) => {
      if (override.type === 'CATEGORY' && !categoryIds.has(override.targetId))
        throw new Error('TARGET_INVALID');
      if (override.type === 'OFFER' && !offerIds.has(override.targetId))
        throw new Error('TARGET_INVALID');
    });
    const sequence = mockData.tenantRevenueShares.length + 1;
    const next: TenantRevenueShare = {
      id:
        current?.id ??
        `revenue-${tenantId.replace('tenant-', '')}-${brandId.replace('brand-', '')}`,
      tenantId,
      brandId,
      brandRate: parsed.brandRate,
      effectiveFrom: parsed.effectiveFrom || null,
      status: parsed.status,
      overrides: parsed.overrides.map((override, index) => ({
        id: override.clientId.startsWith('revenue-')
          ? override.clientId
          : `revenue-override-${sequence}-${index + 1}`,
        type: override.type,
        targetId: override.targetId,
        rate: override.rate,
        status: override.status,
      })),
      updatedBy: actorId,
      updatedAt: `2026-08-03T20:${String(sequence).padStart(2, '0')}:00.000Z`,
      version: (current?.version ?? 0) + 1,
    };
    if (current) Object.assign(current, next);
    else mockData.tenantRevenueShares.push(next);
    mockData.auditRecords.push({
      id: `audit-revenue-${mockData.auditRecords.length + 1}`,
      actorId,
      action: 'SAVE_TENANT_REVENUE_SHARE',
      entityType: 'TENANT_REVENUE_SHARE',
      entityId: next.id,
      occurredAt: next.updatedAt,
    });
    return structuredClone(next);
  },
};

export function resolveTenantShareRate(
  config: TenantRevenueShare | null,
  categoryId: string | null,
  offerId: string | null,
  allTenantDefault: number,
) {
  if (!config || config.status !== 'ACTIVE') return allTenantDefault;
  const offer = config.overrides.find(
    (rule) =>
      rule.type === 'OFFER' &&
      rule.targetId === offerId &&
      rule.status === 'ACTIVE',
  );
  if (offer) return offer.rate;
  const category = config.overrides.find(
    (rule) =>
      rule.type === 'CATEGORY' &&
      rule.targetId === categoryId &&
      rule.status === 'ACTIVE',
  );
  return category?.rate ?? config.brandRate ?? allTenantDefault;
}
