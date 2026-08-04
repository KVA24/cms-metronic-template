import type { ContentLocale } from '@/shared/contracts';
import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminCategoryService } from '../api/admin-category-service';
import type {
  AdminCategoryInput,
  AdminCategoryQuery,
  CategoryIconUploadInput,
} from '../model/admin-category';

export const adminCategoryKeys = {
  all: ['admin-categories'] as const,
  list: (
    query: AdminCategoryQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ) => [...adminCategoryKeys.all, 'list', query, roleCode, locale] as const,
  detail: (categoryId: string) =>
    [...adminCategoryKeys.all, 'detail', categoryId] as const,
};

export function useAdminCategories(
  query: AdminCategoryQuery,
  roleCode: AdminRoleCode,
  locale: ContentLocale,
) {
  return useQuery({
    queryKey: adminCategoryKeys.list(query, roleCode, locale),
    queryFn: () => adminCategoryService.listCategories(query, roleCode, locale),
    retry: false,
  });
}

export function useAdminCategory(
  categoryId: string | undefined,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminCategoryKeys.detail(categoryId ?? ''),
    queryFn: () => adminCategoryService.getCategory(categoryId!, roleCode),
    enabled: Boolean(categoryId),
    retry: false,
  });
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
      actorId,
    }: {
      input: AdminCategoryInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminCategoryService.createCategory(input, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      input,
      roleCode,
      actorId,
    }: {
      categoryId: string;
      input: AdminCategoryInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminCategoryService.updateCategory(categoryId, input, roleCode, actorId),
    onSuccess: (_, { categoryId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: adminCategoryKeys.detail(categoryId),
        }),
      ]),
  });
}

export function useInactivateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      roleCode,
      actorId,
    }: {
      categoryId: string;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminCategoryService.inactivateCategory(categoryId, roleCode, actorId),
    onSuccess: (_, { categoryId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: adminCategoryKeys.detail(categoryId),
        }),
      ]),
  });
}

export function useUploadAdminCategoryIcon() {
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
    }: {
      input: CategoryIconUploadInput;
      roleCode: AdminRoleCode;
    }) => adminCategoryService.uploadIcon(input, roleCode),
  });
}
