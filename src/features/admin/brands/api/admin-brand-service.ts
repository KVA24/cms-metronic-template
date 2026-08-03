import type {
  AssetMetadata,
  Brand,
  ContentLocale,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import {
  adminBrandSchema,
  type AdminBrandInput,
  type AdminBrandDetailView,
  type AdminBrandListItem,
  type AdminBrandListResult,
  type AdminBrandQuery,
  type BrandLogoUploadInput,
} from '../model/admin-brand';

function resolveBrandContent(brand: Brand, locale: ContentLocale) {
  return (
    brand.contents.find(
      (content) => content.locale === locale && content.displayName,
    ) ?? brand.contents.find((content) => content.locale === 'vi-VN')!
  );
}

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'brands.view' | 'brands.create' | 'brands.edit',
): void {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function getBrandOrThrow(brandId: string): Brand {
  const brand = mockData.brands.find(({ id }) => id === brandId);
  if (!brand) throw new Error('BRAND_NOT_FOUND');
  return brand;
}

function getBrandDependencies(brandId: string) {
  const offerCount = mockData.offers.filter(
    (offer) => offer.brandId === brandId,
  ).length;
  const assignmentCount = mockData.tenantBrandAssignments.filter(
    (assignment) => assignment.brandId === brandId,
  ).length;
  const mappingCount = mockData.brandCategoryMappings.filter(
    (mapping) => mapping.brandId === brandId,
  ).length;
  const transactionCount = mockData.transactions.filter(
    (transaction) => transaction.brandId === brandId,
  ).length;
  return {
    offerCount,
    assignmentCount,
    mappingCount,
    transactionCount,
    canHardDelete:
      offerCount + assignmentCount + mappingCount + transactionCount === 0,
  };
}

function hasExactlyOneActiveDefaultMapping(brandId: string): boolean {
  return (
    mockData.brandCategoryMappings.filter(
      (mapping) =>
        mapping.brandId === brandId &&
        mapping.status === 'ACTIVE' &&
        mapping.isDefault,
    ).length === 1
  );
}

function toContents(
  input: ReturnType<typeof adminBrandSchema.parse>,
): Brand['contents'] {
  const contents: Brand['contents'] = [];
  if (
    input.viDisplayName ||
    input.viTagline ||
    input.viShortDescription ||
    input.viTerms
  ) {
    contents.push({
      locale: 'vi-VN',
      displayName: input.viDisplayName,
      tagline: input.viTagline,
      shortDescription: input.viShortDescription,
      terms: input.viTerms,
    });
  }
  if (
    input.enDisplayName ||
    input.enTagline ||
    input.enShortDescription ||
    input.enTerms
  ) {
    contents.push({
      locale: 'en-US',
      displayName: input.enDisplayName,
      tagline: input.enTagline,
      shortDescription: input.enShortDescription,
      terms: input.enTerms,
    });
  }
  return contents;
}

function audit(action: string, entityId: string, actorId: string): void {
  const sequence = mockData.auditRecords.length + 1;
  mockData.auditRecords.push({
    id: `audit-brand-${sequence}`,
    actorId,
    action,
    entityType: 'BRAND',
    entityId,
    occurredAt: `2026-08-03T${String(sequence).padStart(2, '0')}:30:00.000Z`,
  });
}

export const adminBrandService = {
  async listBrands(
    query: AdminBrandQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ): Promise<AdminBrandListResult> {
    assertPermission(roleCode, 'brands.view');
    const keyword = query.keyword.trim().toLocaleLowerCase(locale);
    const canEdit = hasPermission(roleCode, 'brands.edit');
    const items = mockData.brands.reduce<AdminBrandListItem[]>(
      (result, brand) => {
        const content = resolveBrandContent(brand, locale);
        const mappings = mockData.brandCategoryMappings.filter(
          ({ brandId }) => brandId === brand.id,
        );
        const categories = mappings.reduce<AdminBrandListItem['categories']>(
          (result, mapping) => {
            const category = mockData.categories.find(({ id }) => id === mapping.categoryId);
            if (!category) return result;
            const content =
              category.contents.find(({ locale: value }) => value === locale) ??
              category.contents.find(({ locale: value }) => value === 'vi-VN') ??
              category.contents[0];
            result.push({ id: category.id, name: content?.name ?? category.code });
            return result;
          },
          [],
        );
        const item: AdminBrandListItem = {
          id: brand.id,
          code: brand.code,
          name: content?.displayName || '',
          resolvedLocale: content.locale,
          websiteUrl: brand.websiteUrl,
          logo: brand.logo,
          status: brand.status,
          categories,
          offerCount: mockData.offers.filter(({ brandId }) => brandId === brand.id).length,
          tenantAssignmentCount: mockData.tenantBrandAssignments.filter(
            ({ brandId }) => brandId === brand.id,
          ).length,
          updatedAt: brand.updatedAt,
          canEdit,
          canDeactivate: canEdit && brand.status !== 'INACTIVE',
        };

        const searchable = [
          item.code,
          item.name,
          brand.websiteUrl,
          brand.contactEmail,
        ].some((value) => value.toLocaleLowerCase(locale).includes(keyword));
        if (keyword && !searchable) return result;
        if (query.status !== 'ALL' && brand.status !== query.status) return result;
        if (
          query.categoryId &&
          !mappings.some(({ categoryId }) => categoryId === query.categoryId)
        ) {
          return result;
        }
        if (query.createdFrom && brand.createdAt < `${query.createdFrom}T00:00:00.000Z`) {
          return result;
        }
        if (query.createdTo && brand.createdAt > `${query.createdTo}T23:59:59.999Z`) {
          return result;
        }
        result.push(item);
        return result;
      },
      [],
    );

    const direction = query.sortDirection === 'asc' ? 1 : -1;
    items.sort((left, right) => {
      const leftValue = left[query.sortBy as keyof AdminBrandListItem];
      const rightValue = right[query.sortBy as keyof AdminBrandListItem];
      return String(leftValue).localeCompare(String(rightValue), locale) * direction;
    });
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const start = (page - 1) * query.pageSize;
    return structuredClone({
      items: items.slice(start, start + query.pageSize),
      page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    });
  },

  async getFilterOptions() {
    return structuredClone({
      categories: mockData.categories.reduce<{ id: string; name: string }[]>(
        (result, category) => {
          if (category.status === 'ACTIVE') {
            result.push({
              id: category.id,
              name:
                category.contents.find(({ locale }) => locale === 'vi-VN')?.name ??
                category.code,
            });
          }
          return result;
        },
        [],
      ),
    });
  },

  async getBrand(
    brandId: string,
    roleCode: AdminRoleCode,
  ): Promise<AdminBrandDetailView> {
    assertPermission(roleCode, 'brands.view');
    const brand = getBrandOrThrow(brandId);
    const dependencies = getBrandDependencies(brandId);
    const canEdit = hasPermission(roleCode, 'brands.edit');
    return structuredClone({
      brand,
      dependencies,
      codeLocked: !dependencies.canHardDelete,
      canEdit,
      canDeactivate: canEdit && brand.status !== 'INACTIVE',
    });
  },

  async createBrand(
    input: AdminBrandInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Brand> {
    assertPermission(roleCode, 'brands.create');
    const parsed = adminBrandSchema.parse(input);
    if (
      mockData.brands.some(
        ({ code }) => code.toLowerCase() === parsed.code.toLowerCase(),
      )
    ) {
      throw new Error('BRAND_CODE_DUPLICATE');
    }
    if (parsed.status === 'ACTIVE') {
      throw new Error('BRAND_DEFAULT_CATEGORY_REQUIRED');
    }

    const sequence = mockData.brands.length + 1;
    const brand: Brand = {
      id: `brand-created-${sequence}`,
      code: parsed.code,
      name:
        parsed.defaultLocale === 'vi-VN'
          ? parsed.viDisplayName
          : parsed.enDisplayName,
      legalName: parsed.legalName,
      websiteUrl: parsed.websiteUrl,
      logo: parsed.logo,
      status: parsed.status,
      defaultLocale: parsed.defaultLocale,
      pendingDays: parsed.pendingDays,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone,
      notes: parsed.notes,
      contents: toContents(parsed),
      createdBy: actorId,
      createdAt: '2026-08-03T09:30:00.000Z',
      updatedBy: actorId,
      updatedAt: '2026-08-03T09:30:00.000Z',
      version: 1,
    };
    mockData.brands.push(brand);
    audit('CREATE_BRAND', brand.id, actorId);
    return structuredClone(brand);
  },

  async updateBrand(
    brandId: string,
    input: AdminBrandInput,
    expectedVersion: number,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Brand> {
    assertPermission(roleCode, 'brands.edit');
    const brand = getBrandOrThrow(brandId);
    const parsed = adminBrandSchema.parse(input);
    const dependencies = getBrandDependencies(brandId);
    if (!dependencies.canHardDelete && parsed.code !== brand.code) {
      throw new Error('BRAND_CODE_IMMUTABLE');
    }
    if (expectedVersion !== brand.version) throw new Error('VERSION_CONFLICT');
    if (
      mockData.brands.some(
        (candidate) =>
          candidate.id !== brandId &&
          candidate.code.toLowerCase() === parsed.code.toLowerCase(),
      )
    ) {
      throw new Error('BRAND_CODE_DUPLICATE');
    }
    if (
      parsed.status === 'ACTIVE' &&
      !hasExactlyOneActiveDefaultMapping(brandId)
    ) {
      throw new Error('BRAND_DEFAULT_CATEGORY_REQUIRED');
    }

    Object.assign(brand, {
      code: parsed.code,
      name:
        parsed.defaultLocale === 'vi-VN'
          ? parsed.viDisplayName
          : parsed.enDisplayName,
      legalName: parsed.legalName,
      websiteUrl: parsed.websiteUrl,
      logo: parsed.logo,
      status: parsed.status,
      defaultLocale: parsed.defaultLocale,
      pendingDays: parsed.pendingDays,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone,
      notes: parsed.notes,
      contents: toContents(parsed),
      updatedBy: actorId,
      updatedAt: '2026-08-03T10:30:00.000Z',
      version: brand.version + 1,
    });
    audit('UPDATE_BRAND', brand.id, actorId);
    return structuredClone(brand);
  },

  async deactivateBrand(
    brandId: string,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<{
    brand: Brand;
    dependencies: ReturnType<typeof getBrandDependencies>;
  }> {
    assertPermission(roleCode, 'brands.edit');
    const brand = getBrandOrThrow(brandId);
    const dependencies = getBrandDependencies(brandId);
    brand.status = 'INACTIVE';
    brand.updatedBy = actorId;
    brand.updatedAt = '2026-08-03T11:30:00.000Z';
    brand.version += 1;
    audit('DEACTIVATE_BRAND', brand.id, actorId);
    return structuredClone({ brand, dependencies });
  },

  async uploadLogo(
    input: BrandLogoUploadInput,
    roleCode: AdminRoleCode,
  ): Promise<AssetMetadata> {
    if (
      !hasPermission(roleCode, 'brands.create') &&
      !hasPermission(roleCode, 'brands.edit')
    ) {
      throw new Error('FORBIDDEN');
    }
    if (
      !['image/png', 'image/jpeg', 'image/svg+xml'].includes(input.mimeType) ||
      input.sizeBytes <= 0 ||
      input.sizeBytes > 2 * 1024 * 1024
    ) {
      throw new Error('LOGO_INVALID');
    }
    return {
      id: `asset-brand-upload-${input.fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      fileName: input.fileName,
      mimeType: input.mimeType as AssetMetadata['mimeType'],
      sizeBytes: input.sizeBytes,
      url: '/media/app/mini-logo.svg',
    };
  },
};
