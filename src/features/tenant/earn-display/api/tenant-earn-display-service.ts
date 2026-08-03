import type {
  AuthSession,
  Brand,
  TenantBrandAssignment,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type {
  TenantEarnBrandContext,
  TenantEarnDisplayListItem,
  TenantEarnDisplayListResult,
  TenantEarnDisplayQuery,
} from '../model/tenant-earn-display';

function assertView(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('earn_display.view')
  )
    throw new Error('FORBIDDEN');
  const tenant = mockData.tenants.find(({ id }) => id === session.tenantId);
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('FORBIDDEN');
}

function assignments(session: AuthSession) {
  return mockData.tenantBrandAssignments.filter(
    ({ tenantId }) => tenantId === session.tenantId,
  );
}

function assignedContext(session: AuthSession, brandId: string) {
  const assignment = assignments(session).find(
    ({ brandId: id }) => id === brandId,
  );
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!assignment || !brand) throw new Error('EARN_BRAND_NOT_FOUND');
  return { assignment, brand };
}

function nameFor(session: AuthSession, brand: Brand) {
  const locale = session.locale === 'vi' ? 'vi-VN' : 'en-US';
  return (
    brand.contents.find((content) => content.locale === locale)?.displayName ||
    brand.name
  );
}

function configs(session: AuthSession, brandId: string) {
  return mockData.earnDisplays.filter(
    (config) =>
      config.tenantId === session.tenantId && config.brandId === brandId,
  );
}

function project(
  session: AuthSession,
  assignment: TenantBrandAssignment,
  brand: Brand,
): TenantEarnDisplayListItem {
  const allConfigs = configs(session, brand.id);
  const brandConfig = allConfigs.find(
    ({ targetType }) => targetType === 'BRAND',
  );
  const canMutate =
    session.permissions.includes('earn_display.create') ||
    session.permissions.includes('earn_display.edit');
  return {
    brandId: brand.id,
    code: brand.code,
    name: nameFor(session, brand),
    logoUrl: brand.logo?.url ?? null,
    brandStatus: brand.status,
    textEn: brandConfig?.textEn ?? null,
    textVi: brandConfig?.textVi ?? null,
    configurationStatus:
      allConfigs.length > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
    canConfigure: brand.status === 'ACTIVE' && canMutate,
  };
}

export const tenantEarnDisplayService = {
  async list(
    session: AuthSession,
    query: TenantEarnDisplayQuery,
  ): Promise<TenantEarnDisplayListResult> {
    assertView(session);
    const keyword = query.search?.trim().toLocaleLowerCase() ?? '';
    const rows = assignments(session)
      .flatMap((assignment) => {
        const brand = mockData.brands.find(
          ({ id }) => id === assignment.brandId,
        );
        if (!brand) return [];
        const item = project(session, assignment, brand);
        if (
          keyword &&
          ![item.code, item.name].some((value) =>
            value.toLocaleLowerCase().includes(keyword),
          )
        )
          return [];
        if (
          query.configurationStatus &&
          item.configurationStatus !== query.configurationStatus
        )
          return [];
        return [item];
      })
      .sort((left, right) => left.name.localeCompare(right.name));
    const pageSize = Math.max(1, query.pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);
    const start = (page - 1) * pageSize;
    return structuredClone({
      items: rows.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: rows.length,
      totalPages,
    });
  },

  async getBrandContext(
    session: AuthSession,
    brandId: string,
  ): Promise<TenantEarnBrandContext> {
    assertView(session);
    const { assignment, brand } = assignedContext(session, brandId);
    if (brand.status !== 'ACTIVE') throw new Error('BRAND_NOT_ACTIVE');
    const allConfigs = configs(session, brandId);
    return structuredClone({
      brand: project(session, assignment, brand),
      brandConfiguration:
        allConfigs.find(({ targetType }) => targetType === 'BRAND') ?? null,
      categoryCount: mockData.brandCategoryMappings.filter(
        ({ brandId: id }) => id === brandId,
      ).length,
      offerCount: mockData.offers.filter(
        ({ id, brandId: idBrand }) =>
          idBrand === brandId && assignment.offerIds.includes(id),
      ).length,
    });
  },
};
