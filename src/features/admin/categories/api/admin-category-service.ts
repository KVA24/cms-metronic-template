import type {
  AssetMetadata,
  Category,
  CategoryDependencySummary,
  ContentLocale,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import type {
  AdminCategoryDetailView,
  AdminCategoryInput,
  AdminCategoryListItem,
  AdminCategoryListResult,
  AdminCategoryQuery,
  CategoryIconUploadInput,
} from '../model/admin-category';
import { adminCategorySchema } from '../model/admin-category';

function resolveContent(category: Category, locale: ContentLocale) {
  return (
    category.contents.find(
      (content) => content.locale === locale && content.name.trim(),
    ) ?? category.contents.find((content) => content.locale === 'vi-VN')!
  );
}

function isLandingVisible(category: Category): boolean {
  const dependency = mockData.categoryDependencies.find(
    ({ categoryId }) => categoryId === category.id,
  );
  return category.status === 'ACTIVE' && (dependency?.brandMappingCount ?? 0) > 0;
}

function assertPermission(
  roleCode: AdminRoleCode,
  permission: 'categories.view' | 'categories.create' | 'categories.edit',
): void {
  if (!hasPermission(roleCode, permission)) throw new Error('FORBIDDEN');
}

function getCategoryOrThrow(categoryId: string): Category {
  const category = mockData.categories.find(({ id }) => id === categoryId);
  if (!category) throw new Error('CATEGORY_NOT_FOUND');
  return category;
}

function getDependency(categoryId: string): CategoryDependencySummary {
  return (
    mockData.categoryDependencies.find(
      (dependency) => dependency.categoryId === categoryId,
    ) ?? {
      categoryId,
      brandMappingCount: 0,
      tenantConfigCount: 0,
      transactionCount: 0,
      canHardDelete: true,
      canInactive: true,
    }
  );
}

function hasDependency(dependency: CategoryDependencySummary): boolean {
  return (
    dependency.brandMappingCount +
      dependency.tenantConfigCount +
      dependency.transactionCount >
    0
  );
}

function toCategoryContents(
  input: ReturnType<typeof adminCategorySchema.parse>,
): Category['contents'] {
  const contents: Category['contents'] = [
    {
      locale: 'vi-VN',
      name: input.viName,
      description: input.viDescription,
      status: 'ACTIVE',
    },
  ];
  if (input.enName) {
    contents.push({
      locale: 'en-US',
      name: input.enName,
      description: input.enDescription,
      status: 'ACTIVE',
    });
  }
  return contents;
}

function audit(action: string, entityId: string, actorId: string): void {
  const sequence = mockData.auditRecords.length + 1;
  mockData.auditRecords.push({
    id: `audit-category-${sequence}`,
    actorId,
    action,
    entityType: 'CATEGORY',
    entityId,
    occurredAt: `2026-08-03T${String(sequence).padStart(2, '0')}:00:00.000Z`,
  });
}

export const adminCategoryService = {
  async listCategories(
    query: AdminCategoryQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ): Promise<AdminCategoryListResult> {
    if (!hasPermission(roleCode, 'categories.view')) {
      throw new Error('FORBIDDEN');
    }

    const keyword = query.keyword.trim().toLocaleLowerCase(locale);
    const canEdit = hasPermission(roleCode, 'categories.edit');
    const items = mockData.categories.reduce<AdminCategoryListItem[]>(
      (result, category) => {
        const content = resolveContent(category, locale);
        const item: AdminCategoryListItem = {
          id: category.id,
          code: category.code,
          name: content.name,
          resolvedLocale: content.locale,
          icon: category.icon,
          displayOrder: category.displayOrder,
          status: category.status,
          landingVisible: isLandingVisible(category),
          updatedBy: category.updatedBy,
          updatedAt: category.updatedAt,
          canEdit,
          canInactive: canEdit && category.status !== 'INACTIVE',
        };
        if (
          keyword &&
          !item.code.toLocaleLowerCase(locale).includes(keyword) &&
          !item.name.toLocaleLowerCase(locale).includes(keyword)
        ) {
          return result;
        }
        if (query.status !== 'ALL' && item.status !== query.status) {
          return result;
        }
        if (
          query.landing !== 'ALL' &&
          item.landingVisible !== (query.landing === 'VISIBLE')
        ) {
          return result;
        }
        result.push(item);
        return result;
      },
      [],
    );

    const direction = query.sortDirection === 'asc' ? 1 : -1;
    items.sort((left, right) => {
      const leftValue = left[query.sortBy];
      const rightValue = right[query.sortBy];
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }
      return (
        String(leftValue).localeCompare(String(rightValue), locale) * direction
      );
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

  async getCategory(
    categoryId: string,
    roleCode: AdminRoleCode,
  ): Promise<AdminCategoryDetailView> {
    assertPermission(roleCode, 'categories.view');
    const category = getCategoryOrThrow(categoryId);
    const dependency = getDependency(categoryId);
    const canEdit = hasPermission(roleCode, 'categories.edit');
    return structuredClone({
      category,
      dependency,
      codeLocked: hasDependency(dependency),
      canEdit,
      canInactive: canEdit && category.status !== 'INACTIVE',
    });
  },

  async createCategory(
    input: AdminCategoryInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Category> {
    assertPermission(roleCode, 'categories.create');
    const parsed = adminCategorySchema.parse(input);
    if (
      mockData.categories.some(
        ({ code }) => code.toLowerCase() === parsed.code.toLowerCase(),
      )
    ) {
      throw new Error('CATEGORY_CODE_DUPLICATE');
    }

    const sequence = mockData.categories.length + 1;
    const category: Category = {
      id: `category-created-${sequence}`,
      code: parsed.code,
      icon: parsed.icon,
      displayOrder: parsed.displayOrder,
      status: parsed.status,
      contents: toCategoryContents(parsed),
      createdBy: actorId,
      createdAt: '2026-08-03T09:00:00.000Z',
      updatedBy: actorId,
      updatedAt: '2026-08-03T09:00:00.000Z',
    };
    mockData.categories.push(category);
    mockData.categoryDependencies.push({
      categoryId: category.id,
      brandMappingCount: 0,
      tenantConfigCount: 0,
      transactionCount: 0,
      canHardDelete: true,
      canInactive: true,
    });
    audit('CREATE_CATEGORY', category.id, actorId);
    return structuredClone(category);
  },

  async updateCategory(
    categoryId: string,
    input: AdminCategoryInput,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<Category> {
    assertPermission(roleCode, 'categories.edit');
    const category = getCategoryOrThrow(categoryId);
    const parsed = adminCategorySchema.parse(input);
    const dependency = getDependency(categoryId);

    if (hasDependency(dependency) && parsed.code !== category.code) {
      throw new Error('CATEGORY_CODE_IMMUTABLE');
    }
    if (
      mockData.categories.some(
        (candidate) =>
          candidate.id !== categoryId &&
          candidate.code.toLowerCase() === parsed.code.toLowerCase(),
      )
    ) {
      throw new Error('CATEGORY_CODE_DUPLICATE');
    }

    Object.assign(category, {
      code: parsed.code,
      icon: parsed.icon,
      displayOrder: parsed.displayOrder,
      status: parsed.status,
      contents: toCategoryContents(parsed),
      updatedBy: actorId,
      updatedAt: '2026-08-03T10:00:00.000Z',
    });
    audit('UPDATE_CATEGORY', category.id, actorId);
    return structuredClone(category);
  },

  async inactivateCategory(
    categoryId: string,
    roleCode: AdminRoleCode,
    actorId: string,
  ): Promise<{
    category: Category;
    dependency: CategoryDependencySummary;
  }> {
    assertPermission(roleCode, 'categories.edit');
    const category = getCategoryOrThrow(categoryId);
    const dependency = getDependency(categoryId);
    if (!dependency.canInactive) throw new Error('CATEGORY_INACTIVE_BLOCKED');

    category.status = 'INACTIVE';
    category.updatedBy = actorId;
    category.updatedAt = '2026-08-03T11:00:00.000Z';
    audit('INACTIVATE_CATEGORY', category.id, actorId);
    return structuredClone({ category, dependency });
  },

  async uploadIcon(
    input: CategoryIconUploadInput,
    roleCode: AdminRoleCode,
  ): Promise<AssetMetadata> {
    if (
      !hasPermission(roleCode, 'categories.create') &&
      !hasPermission(roleCode, 'categories.edit')
    ) {
      throw new Error('FORBIDDEN');
    }
    const supportedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (
      !supportedTypes.includes(input.mimeType) ||
      input.sizeBytes <= 0 ||
      input.sizeBytes > 2 * 1024 * 1024
    ) {
      throw new Error('ICON_INVALID');
    }

    return {
      id: `asset-upload-${input.fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      fileName: input.fileName,
      mimeType: input.mimeType as AssetMetadata['mimeType'],
      sizeBytes: input.sizeBytes,
      url: '/media/app/mini-logo.svg',
    };
  },
};
