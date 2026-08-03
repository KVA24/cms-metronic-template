import type {
  AuthSession,
  Brand,
  TenantBrandAssignment,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import type {
  TenantAssignedBrandItem,
  TenantAssignedBrandListResult,
  TenantAssignedBrandQuery,
  TenantAssignedBrandScope,
} from '../model/tenant-assigned-brand';

const NOW = '2026-08-03T12:00:00.000Z';

function contentLocale(session: AuthSession) {
  return session.locale === 'vi' ? 'vi-VN' : 'en-US';
}

function assertAccess(session: AuthSession) {
  if (
    session.portalType !== 'TENANT' ||
    !session.tenantId ||
    !session.permissions.includes('brands.view')
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
    ({ brandId: assignedBrandId }) => assignedBrandId === brandId,
  );
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!assignment || !brand) throw new Error('ASSIGNED_BRAND_NOT_FOUND');
  return { assignment, brand };
}

function activeOffer(offer: (typeof mockData.offers)[number]) {
  return (
    offer.status === 'ACTIVE' &&
    (!offer.startAt || offer.startAt <= NOW) &&
    (!offer.endAt || offer.endAt >= NOW)
  );
}

function mappings(brandId: string) {
  return mockData.brandCategoryMappings.filter(
    ({ brandId: mappedBrandId }) => mappedBrandId === brandId,
  );
}

function offers(assignment: TenantBrandAssignment) {
  const ids = new Set(assignment.offerIds);
  return mockData.offers.filter(
    ({ id, brandId }) => ids.has(id) && brandId === assignment.brandId,
  );
}

function project(
  session: AuthSession,
  assignment: TenantBrandAssignment,
  brand: Brand,
): TenantAssignedBrandItem {
  const brandMappings = mappings(brand.id);
  const brandOffers = offers(assignment);
  const hasEligibleContent =
    brandMappings.some(({ status }) => status === 'ACTIVE') ||
    brandOffers.some(activeOffer);
  const effectivelyVisible =
    assignment.showOnLanding && brand.status === 'ACTIVE' && hasEligibleContent;
  const offerVisibility = assignment.offerVisibility ?? {};
  return {
    id: brand.id,
    assignmentId: assignment.id,
    code: brand.code,
    name:
      brand.contents.find(({ locale }) => locale === contentLocale(session))
        ?.displayName || brand.name,
    status: brand.status,
    categoryCount: brandMappings.length,
    offerCount: brandOffers.length,
    customizedOfferCount: Object.keys(offerVisibility).filter((id) =>
      assignment.offerIds.includes(id),
    ).length,
    showOnLanding: assignment.showOnLanding,
    effectivelyVisible,
    isHot: Boolean(assignment.isHot && effectivelyVisible),
    earnConfigured: false,
    updatedBy: assignment.updatedBy ?? brand.updatedBy,
    updatedAt: assignment.updatedAt ?? brand.updatedAt,
    version: assignment.version ?? 1,
    canEdit: session.permissions.includes('brands.edit'),
  };
}

export const tenantAssignedBrandService = {
  async list(
    session: AuthSession,
    query: TenantAssignedBrandQuery,
  ): Promise<TenantAssignedBrandListResult> {
    assertAccess(session);
    const all: TenantAssignedBrandItem[] = [];
    const categoryOptions = new Map<string, string>();
    for (const assignment of assignments(session)) {
      const brand = mockData.brands.find(({ id }) => id === assignment.brandId);
      if (!brand) continue;
      for (const mapping of mappings(brand.id)) {
        const category = mockData.categories.find(
          ({ id }) => id === mapping.categoryId,
        );
        if (category) {
          const content =
            category.contents.find(
              ({ locale }) => locale === contentLocale(session),
            ) ?? category.contents[0];
          categoryOptions.set(category.id, content?.name ?? category.code);
        }
      }
      all.push(project(session, assignment, brand));
    }
    const metrics = {
      assignedBrands: all.length,
      visibleOnLanding: all.filter(
        ({ effectivelyVisible }) => effectivelyVisible,
      ).length,
      landingCoverage:
        all.length === 0
          ? 0
          : Number(
              (
                (all.filter(({ effectivelyVisible }) => effectivelyVisible)
                  .length /
                  all.length) *
                100
              ).toFixed(2),
            ),
    };
    const keyword = query.search?.trim().toLocaleLowerCase() ?? '';
    const filtered = all
      .filter((item) => {
        if (
          keyword &&
          ![item.code, item.name].some((value) =>
            value.toLocaleLowerCase().includes(keyword),
          )
        )
          return false;
        if (query.brandStatus && item.status !== query.brandStatus)
          return false;
        if (
          query.categoryId &&
          !mappings(item.id).some(
            ({ categoryId }) => categoryId === query.categoryId,
          )
        )
          return false;
        return true;
      })
      .sort((left, right) => left.name.localeCompare(right.name));
    const pageSize = Math.max(1, query.pageSize);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);
    const start = (page - 1) * pageSize;
    return structuredClone({
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      totalItems: filtered.length,
      totalPages,
      metrics,
      categoryOptions: [...categoryOptions].map(([id, name]) => ({ id, name })),
    });
  },

  async getScope(
    session: AuthSession,
    brandId: string,
  ): Promise<TenantAssignedBrandScope> {
    assertAccess(session);
    const { assignment, brand } = assignedContext(session, brandId);
    const offerVisibility = assignment.offerVisibility ?? {};
    const brandView = project(session, assignment, brand);
    return structuredClone({
      brand: brandView,
      categories: mappings(brand.id).map((mapping) => {
        const category = mockData.categories.find(
          ({ id }) => id === mapping.categoryId,
        );
        const categoryName =
          category?.contents.find(
            ({ locale }) => locale === contentLocale(session),
          )?.name ??
          category?.contents[0]?.name ??
          category?.code ??
          '—';
        return {
          id: mapping.id,
          brandCategory: mapping.brandCategoryName,
          affiliateCategory: categoryName,
          commissionType: mapping.commissionType,
          commissionValue: mapping.commissionValue,
          effectiveFrom: mapping.effectiveFrom,
          effectiveTo: mapping.effectiveTo,
          status: mapping.status,
        };
      }),
      offers: offers(assignment).map((offer) => {
        const configuredVisibility = offerVisibility[offer.id] ?? true;
        const eligible = activeOffer(offer);
        return {
          id: offer.id,
          code: offer.code,
          name:
            offer.contents.find(
              ({ locale }) => locale === contentLocale(session),
            )?.title || offer.title,
          commissionType: offer.commissionType,
          commissionValue: offer.commissionValue,
          configuredVisibility,
          effectivelyVisible:
            brandView.effectivelyVisible && configuredVisibility && eligible,
          customized: Object.hasOwn(offerVisibility, offer.id),
          effectiveFrom: offer.startAt,
          effectiveTo: offer.endAt,
          status: offer.status,
          canToggle: brandView.canEdit && eligible,
          expired: Boolean(offer.endAt && offer.endAt < NOW),
        };
      }),
    });
  },
};
