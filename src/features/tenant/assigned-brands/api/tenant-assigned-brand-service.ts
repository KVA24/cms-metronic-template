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

function assertEdit(session: AuthSession) {
  assertAccess(session);
  if (!session.permissions.includes('brands.edit'))
    throw new Error('FORBIDDEN');
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

function eligibleBrand(assignment: TenantBrandAssignment, brand: Brand) {
  return (
    brand.status === 'ACTIVE' &&
    (mappings(brand.id).some(({ status }) => status === 'ACTIVE') ||
      offers(assignment).some(activeOffer))
  );
}

function assertVersion(
  assignment: TenantBrandAssignment,
  expectedVersion: number,
) {
  if ((assignment.version ?? 1) !== expectedVersion)
    throw new Error('VERSION_CONFLICT');
}

function recordMutation(
  session: AuthSession,
  assignment: TenantBrandAssignment,
  action: string,
  before: Record<string, unknown>,
) {
  assignment.updatedBy = session.user.id;
  assignment.updatedAt = '2026-08-03T21:00:00.000Z';
  assignment.version = (assignment.version ?? 1) + 1;
  mockData.auditRecords.push({
    id: `audit-tenant-brand-${mockData.auditRecords.length + 1}`,
    actorId: session.user.id,
    action,
    entityType: 'TENANT_BRAND_ASSIGNMENT',
    entityId: assignment.id,
    occurredAt: assignment.updatedAt,
    before,
    after: {
      showOnLanding: assignment.showOnLanding,
      isHot: assignment.isHot,
      offerVisibility: structuredClone(assignment.offerVisibility ?? {}),
      version: assignment.version,
    },
  });
}

function project(
  session: AuthSession,
  assignment: TenantBrandAssignment,
  brand: Brand,
): TenantAssignedBrandItem {
  const brandMappings = mappings(brand.id);
  const brandOffers = offers(assignment);
  const effectivelyVisible =
    assignment.showOnLanding && eligibleBrand(assignment, brand);
  const offerVisibility = assignment.offerVisibility ?? {};
  const assignedOfferIds = new Set(assignment.offerIds);
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
      assignedOfferIds.has(id),
    ).length,
    showOnLanding: assignment.showOnLanding,
    effectivelyVisible,
    isHot: Boolean(assignment.isHot && effectivelyVisible),
    earnConfigured: mockData.earnDisplays.some(
      ({ tenantId, brandId }) =>
        tenantId === session.tenantId && brandId === brand.id,
    ),
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

  async setBrandVisibility(
    session: AuthSession,
    brandId: string,
    value: boolean,
    expectedVersion: number,
  ): Promise<TenantAssignedBrandItem> {
    assertEdit(session);
    const { assignment, brand } = assignedContext(session, brandId);
    assertVersion(assignment, expectedVersion);
    if (value && !eligibleBrand(assignment, brand))
      throw new Error('BRAND_NOT_ELIGIBLE');
    const before = {
      showOnLanding: assignment.showOnLanding,
      isHot: assignment.isHot,
      version: assignment.version ?? 1,
    };
    assignment.showOnLanding = value;
    if (!value) assignment.isHot = false;
    recordMutation(session, assignment, 'SET_TENANT_BRAND_VISIBILITY', before);
    return structuredClone(project(session, assignment, brand));
  },

  async setHot(
    session: AuthSession,
    brandId: string,
    value: boolean,
    expectedVersion: number,
  ): Promise<TenantAssignedBrandItem> {
    assertEdit(session);
    const { assignment, brand } = assignedContext(session, brandId);
    assertVersion(assignment, expectedVersion);
    if (
      value &&
      (!assignment.showOnLanding || !eligibleBrand(assignment, brand))
    )
      throw new Error('BRAND_NOT_VISIBLE');
    const before = {
      showOnLanding: assignment.showOnLanding,
      isHot: assignment.isHot,
      version: assignment.version ?? 1,
    };
    assignment.isHot = value;
    recordMutation(session, assignment, 'SET_TENANT_BRAND_HOT', before);
    return structuredClone(project(session, assignment, brand));
  },

  async setOfferVisibility(
    session: AuthSession,
    brandId: string,
    offerId: string,
    value: boolean,
    expectedVersion: number,
  ): Promise<TenantAssignedBrandScope> {
    assertEdit(session);
    const { assignment } = assignedContext(session, brandId);
    assertVersion(assignment, expectedVersion);
    const offer = offers(assignment).find(({ id }) => id === offerId);
    if (!offer) throw new Error('OFFER_NOT_ASSIGNED');
    if (!activeOffer(offer)) throw new Error('OFFER_NOT_ELIGIBLE');
    const before = {
      offerVisibility: structuredClone(assignment.offerVisibility ?? {}),
      version: assignment.version ?? 1,
    };
    assignment.offerVisibility = {
      ...assignment.offerVisibility,
      [offerId]: value,
    };
    recordMutation(session, assignment, 'SET_TENANT_OFFER_VISIBILITY', before);
    return this.getScope(session, brandId);
  },
};
