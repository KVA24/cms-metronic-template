import type { BrandCategoryMapping } from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  adminBrandMappingBatchSchema,
  getMappingEffectiveState,
  type AdminBrandMappingListResult,
  type AdminBrandMappingQuery,
  type AdminBrandMappingRowInput,
  type ParsedAdminBrandMappingRow,
} from '../model/admin-brand-mapping';

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'brands.view' | 'brands.edit',
) {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function getBrandOrThrow(brandId: string) {
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!brand) throw new Error('BRAND_NOT_FOUND');
  return brand;
}

function periodsOverlap(
  left: BrandCategoryMapping,
  right: BrandCategoryMapping,
): boolean {
  const leftFrom = left.effectiveFrom.slice(0, 10);
  const rightFrom = right.effectiveFrom.slice(0, 10);
  const leftTo = left.effectiveTo?.slice(0, 10) ?? '9999-12-31';
  const rightTo = right.effectiveTo?.slice(0, 10) ?? '9999-12-31';
  return leftFrom <= rightTo && rightFrom <= leftTo;
}

function toStoredMapping(
  brandId: string,
  row: ParsedAdminBrandMappingRow,
  actorId: string,
  existing?: BrandCategoryMapping,
  sequence = 1,
): BrandCategoryMapping {
  const occurredAt = `2026-08-03T${String(sequence).padStart(2, '0')}:45:00.000Z`;
  return {
    id: existing?.id ?? `mapping-${brandId.replace(/^brand-/, '')}-${sequence}`,
    brandId,
    categoryId: row.categoryId,
    brandCategoryCode: row.brandCategoryCode,
    brandCategoryName: row.brandCategoryName,
    isDefault: row.isDefault,
    commissionType: row.commissionType,
    commissionValue: row.commissionValue,
    effectiveFrom: `${row.effectiveFrom}T00:00:00.000Z`,
    effectiveTo: row.effectiveTo ? `${row.effectiveTo}T23:59:59.999Z` : null,
    status: row.status,
    createdBy: existing?.createdBy ?? actorId,
    createdAt: existing?.createdAt ?? occurredAt,
    updatedBy: actorId,
    updatedAt: occurredAt,
  };
}

function validateCandidate(
  brandStatus: 'ACTIVE' | 'INACTIVE' | 'DRAFT',
  mappings: BrandCategoryMapping[],
) {
  const activeDefaults = mappings.filter(
    ({ isDefault, status }) => isDefault && status === 'ACTIVE',
  );
  if (
    activeDefaults.length > 1 ||
    (brandStatus === 'ACTIVE' && activeDefaults.length !== 1)
  ) {
    throw new Error('BRAND_DEFAULT_CATEGORY_REQUIRED');
  }
  if (
    mappings.some(({ isDefault, status }) => isDefault && status !== 'ACTIVE')
  ) {
    throw new Error('DEFAULT_MUST_BE_ACTIVE');
  }
  const active = mappings.filter(({ status }) => status === 'ACTIVE');
  for (let leftIndex = 0; leftIndex < active.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < active.length;
      rightIndex += 1
    ) {
      const left = active[leftIndex];
      const right = active[rightIndex];
      if (
        left.brandCategoryCode.toLowerCase() ===
          right.brandCategoryCode.toLowerCase() &&
        periodsOverlap(left, right)
      ) {
        throw new Error('BRAND_CATEGORY_CODE_DUPLICATE');
      }
    }
  }
}

export const adminBrandMappingService = {
  async listMappings(
    brandId: string,
    query: AdminBrandMappingQuery,
    roleCode: AdminRoleCode,
  ): Promise<AdminBrandMappingListResult> {
    assertPermission(roleCode, 'brands.view');
    const brand = getBrandOrThrow(brandId);
    const keyword = query.keyword.trim().toLowerCase();
    const canEdit = hasPermission(roleCode, 'brands.edit');
    const items = mockData.brandCategoryMappings.reduce<
      AdminBrandMappingListResult['items']
    >((result, mapping) => {
      if (mapping.brandId !== brandId) return result;
      const category = mockData.categories.find(
        ({ id }) => id === mapping.categoryId,
      );
      if (!category) return result;
      const categoryName =
        category.contents.find(({ locale }) => locale === 'vi-VN')?.name ??
        category.code;
      const searchable = [
        mapping.id,
        mapping.brandCategoryCode,
        mapping.brandCategoryName,
      ].some((value) => value.toLowerCase().includes(keyword));
      if (keyword && !searchable) return result;
      if (query.categoryId && mapping.categoryId !== query.categoryId)
        return result;
      if (
        query.commissionType !== 'ALL' &&
        mapping.commissionType !== query.commissionType
      )
        return result;
      if (query.status !== 'ALL' && mapping.status !== query.status)
        return result;
      result.push({
        ...structuredClone(mapping),
        categoryName,
        categoryStatus: category.status,
        effectiveState: getMappingEffectiveState(mapping),
        canEdit,
      });
      return result;
    }, []);
    return structuredClone({
      brandId,
      brandName: brand.name,
      brandStatus: brand.status,
      items,
      categories: mockData.categories.reduce<
        AdminBrandMappingListResult['categories']
      >((result, category) => {
        if (category.status === 'ACTIVE') {
          result.push({
            id: category.id,
            name:
              category.contents.find(({ locale }) => locale === 'vi-VN')
                ?.name ?? category.code,
            status: category.status,
          });
        }
        return result;
      }, []),
      canEdit,
    });
  },

  async saveBatch(
    brandId: string,
    input: AdminBrandMappingRowInput[],
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<BrandCategoryMapping[]> {
    assertPermission(roleCode, 'brands.edit');
    const brand = getBrandOrThrow(brandId);
    const parsed = adminBrandMappingBatchSchema.safeParse(input);
    if (!parsed.success) throw new Error('MAPPING_BATCH_INVALID');

    const current = structuredClone(
      mockData.brandCategoryMappings.filter(
        (mapping) => mapping.brandId === brandId,
      ),
    );
    const submittedActiveDefaults = parsed.data.filter(
      ({ isDefault, status }) => isDefault && status === 'ACTIVE',
    );
    if (submittedActiveDefaults.length > 1) {
      throw new Error('BRAND_DEFAULT_CATEGORY_REQUIRED');
    }

    const saved: BrandCategoryMapping[] = [];
    parsed.data.forEach((row, index) => {
      const existingIndex = row.id
        ? current.findIndex(({ id }) => id === row.id)
        : -1;
      if (row.id && existingIndex < 0) throw new Error('MAPPING_NOT_FOUND');
      const mapping = toStoredMapping(
        brandId,
        row,
        actorId,
        existingIndex >= 0 ? current[existingIndex] : undefined,
        mockData.brandCategoryMappings.length + index + 1,
      );
      if (existingIndex >= 0) current[existingIndex] = mapping;
      else current.push(mapping);
      saved.push(mapping);
    });

    if (submittedActiveDefaults.length === 1) {
      const defaultId = saved.find(
        ({ isDefault, status }) => isDefault && status === 'ACTIVE',
      )?.id;
      current.forEach((mapping) => {
        if (mapping.id !== defaultId) mapping.isDefault = false;
      });
    }
    validateCandidate(brand.status, current);

    const otherBrands = mockData.brandCategoryMappings.filter(
      (mapping) => mapping.brandId !== brandId,
    );
    mockData.brandCategoryMappings.splice(
      0,
      mockData.brandCategoryMappings.length,
      ...otherBrands,
      ...current,
    );
    const auditSequence = mockData.auditRecords.length + 1;
    mockData.auditRecords.push({
      id: `audit-brand-mapping-${auditSequence}`,
      actorId,
      action: 'SAVE_BRAND_CATEGORY_MAPPINGS',
      entityType: 'BRAND_CATEGORY_MAPPING',
      entityId: brandId,
      occurredAt: `2026-08-03T${String(auditSequence).padStart(2, '0')}:50:00.000Z`,
    });
    return structuredClone(saved);
  },
};
