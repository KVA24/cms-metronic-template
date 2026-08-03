import type { ContentLocale } from '@/shared/contracts';
import type { AdminRoleCode } from '@/shared/permissions';
import { useQuery } from '@tanstack/react-query';
import { adminCategoryService } from '../api/admin-category-service';
import type { AdminCategoryQuery } from '../model/admin-category';

export const adminCategoryKeys = {
  all: ['admin-categories'] as const,
  list: (
    query: AdminCategoryQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ) => [...adminCategoryKeys.all, 'list', query, roleCode, locale] as const,
};

export function useAdminCategories(
  query: AdminCategoryQuery,
  roleCode: AdminRoleCode,
  locale: ContentLocale,
) {
  return useQuery({
    queryKey: adminCategoryKeys.list(query, roleCode, locale),
    queryFn: () =>
      adminCategoryService.listCategories(query, roleCode, locale),
    retry: false,
  });
}
