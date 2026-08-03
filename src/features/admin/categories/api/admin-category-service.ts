import type {
  Category,
  ContentLocale,
} from '../../../../shared/contracts';
import { mockData } from '../../../../shared/mocks/mock-data';
import {
  hasPermission,
  type AdminRoleCode,
} from '../../../../shared/permissions';
import type {
  AdminCategoryListItem,
  AdminCategoryListResult,
  AdminCategoryQuery,
} from '../model/admin-category';

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
    const items: AdminCategoryListItem[] = mockData.categories
      .map((category) => {
        const content = resolveContent(category, locale);
        return {
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
      })
      .filter((category) => {
        if (
          keyword &&
          !category.code.toLocaleLowerCase(locale).includes(keyword) &&
          !category.name.toLocaleLowerCase(locale).includes(keyword)
        ) {
          return false;
        }
        if (query.status !== 'ALL' && category.status !== query.status) {
          return false;
        }
        if (
          query.landing !== 'ALL' &&
          category.landingVisible !== (query.landing === 'VISIBLE')
        ) {
          return false;
        }
        return true;
      });

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
};
