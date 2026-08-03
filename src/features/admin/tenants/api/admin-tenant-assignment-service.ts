import { mockData } from '../../../../shared/mocks/mock-data';
import { hasPermission, type AdminRoleCode } from '../../../../shared/permissions';
import type {
  AdminTenantAssignmentDraft,
  AdminTenantAssignmentQuery,
  AdminTenantAssignmentRow,
} from '../model/admin-tenant-assignment';

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'tenants.assignments.view' | 'tenants.assignments.edit',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function getTenant(tenantId: string) {
  const tenant = mockData.tenants.find(({ id }) => id === tenantId);
  if (!tenant) throw new Error('TENANT_NOT_FOUND');
  return tenant;
}

function activeOffers(brandId: string) {
  return mockData.offers.filter(
    (offer) => offer.brandId === brandId && offer.status === 'ACTIVE',
  );
}

function categoryView(brandId: string) {
  return mockData.brandCategoryMappings
    .filter((mapping) => mapping.brandId === brandId)
    .flatMap((mapping) => {
      const category = mockData.categories.find(({ id }) => id === mapping.categoryId);
      const content = category?.contents.find(({ locale }) => locale === 'vi-VN');
      return category ? [{ id: category.id, name: content?.name ?? category.code }] : [];
    });
}

export const adminTenantAssignmentService = {
  async listAssignments(
    tenantId: string,
    query: AdminTenantAssignmentQuery,
    roleCode: AdminRoleCode,
  ) {
    assertPermission(roleCode, 'tenants.assignments.view');
    const tenant = getTenant(tenantId);
    const keyword = query.keyword.trim().toLowerCase();
    const rows = mockData.brands.reduce<AdminTenantAssignmentRow[]>((result, brand) => {
      const assignment = mockData.tenantBrandAssignments.find(
        (item) => item.tenantId === tenantId && item.brandId === brand.id,
      );
      const offers = activeOffers(brand.id);
      const assignedOfferIds = assignment?.offerIds.filter((id) =>
        offers.some((offer) => offer.id === id),
      ) ?? [];
      const assigned = Boolean(assignment);
      const scope = !assigned
        ? 'NOT_ASSIGNED'
        : assignedOfferIds.length === offers.length
          ? 'ALL_ACTIVE'
          : 'CUSTOM';
      const categories = categoryView(brand.id);
      if (keyword && ![brand.id, brand.name].some((value) => value.toLowerCase().includes(keyword))) return result;
      if (query.brandStatus !== 'ALL' && brand.status !== query.brandStatus) return result;
      if (query.categoryId && !categories.some(({ id }) => id === query.categoryId)) return result;
      if (query.assignment === 'ASSIGNED' && !assigned) return result;
      if (query.assignment === 'UNASSIGNED' && assigned) return result;
      if (query.assignment === 'CUSTOM' && scope !== 'CUSTOM') return result;
      result.push({ brand, categories, activeOffers: offers, assigned, assignedOfferIds, scope });
      return result;
    }, []);
    return structuredClone({
      tenant,
      rows,
      categories: mockData.categories.map((category) => ({
        id: category.id,
        name: category.contents.find(({ locale }) => locale === 'vi-VN')?.name ?? category.code,
      })),
      canEdit: hasPermission(roleCode, 'tenants.assignments.edit'),
    });
  },

  async saveAssignments(
    tenantId: string,
    drafts: AdminTenantAssignmentDraft[],
    roleCode: AdminRoleCode,
    actorId: string,
  ) {
    assertPermission(roleCode, 'tenants.assignments.edit');
    const tenant = getTenant(tenantId);
    if (tenant.status !== 'ACTIVE' && drafts.some(({ assigned }) => assigned))
      throw new Error('TENANT_NOT_ACTIVE');
    const uniqueBrands = new Set<string>();
    const normalized = drafts.map((draft) => {
      if (uniqueBrands.has(draft.brandId)) throw new Error('DUPLICATE_BRAND');
      uniqueBrands.add(draft.brandId);
      const brand = mockData.brands.find(({ id }) => id === draft.brandId);
      if (!brand) throw new Error('BRAND_NOT_FOUND');
      if (draft.assigned && brand.status !== 'ACTIVE')
        throw new Error('BRAND_NOT_ACTIVE');
      const allowedIds = new Set(activeOffers(brand.id).map(({ id }) => id));
      const offerIds = [...new Set(draft.offerIds)];
      if (draft.assigned && offerIds.some((id) => !allowedIds.has(id)))
        throw new Error('OFFER_NOT_ACTIVE');
      return { ...draft, offerIds: draft.assigned ? offerIds : [] };
    });
    normalized.forEach((draft) => {
      const index = mockData.tenantBrandAssignments.findIndex(
        (item) => item.tenantId === tenantId && item.brandId === draft.brandId,
      );
      if (!draft.assigned) {
        if (index >= 0) mockData.tenantBrandAssignments.splice(index, 1);
        return;
      }
      const next = {
        id: index >= 0
          ? mockData.tenantBrandAssignments[index].id
          : `assignment-${tenantId.replace('tenant-', '')}-${draft.brandId.replace('brand-', '')}`,
        tenantId,
        brandId: draft.brandId,
        offerIds: draft.offerIds,
        showOnLanding: index >= 0
          ? mockData.tenantBrandAssignments[index].showOnLanding
          : true,
        isHot: index >= 0 ? mockData.tenantBrandAssignments[index].isHot : false,
      };
      if (index >= 0) mockData.tenantBrandAssignments[index] = next;
      else mockData.tenantBrandAssignments.push(next);
    });
    mockData.auditRecords.push({
      id: `audit-assignment-${mockData.auditRecords.length + 1}`,
      actorId,
      action: 'SAVE_TENANT_ASSIGNMENTS',
      entityType: 'TENANT_ASSIGNMENT',
      entityId: tenantId,
      occurredAt: '2026-08-03T20:00:00.000Z',
    });
    return structuredClone(
      mockData.tenantBrandAssignments.filter((item) => item.tenantId === tenantId),
    );
  },
};
