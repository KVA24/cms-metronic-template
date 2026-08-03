import type { ContentLocale } from '@/shared/contracts';
import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminBrandService } from '../api/admin-brand-service';
import type {
  AdminBrandInput,
  AdminBrandQuery,
  BrandLogoUploadInput,
} from '../model/admin-brand';

export const adminBrandKeys = {
  all: ['admin-brands'] as const,
  list: (
    query: AdminBrandQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ) => [...adminBrandKeys.all, 'list', query, roleCode, locale] as const,
  filters: () => [...adminBrandKeys.all, 'filters'] as const,
};

export function useAdminBrands(
  query: AdminBrandQuery,
  roleCode: AdminRoleCode,
  locale: ContentLocale,
) {
  return useQuery({
    queryKey: adminBrandKeys.list(query, roleCode, locale),
    queryFn: () => adminBrandService.listBrands(query, roleCode, locale),
    retry: false,
  });
}

export function useAdminBrandFilterOptions() {
  return useQuery({
    queryKey: adminBrandKeys.filters(),
    queryFn: () => adminBrandService.getFilterOptions(),
    retry: false,
  });
}

export function useCreateAdminBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
      actorId,
    }: {
      input: AdminBrandInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminBrandService.createBrand(input, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminBrandKeys.all }),
  });
}

export function useUploadAdminBrandLogo() {
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
    }: {
      input: BrandLogoUploadInput;
      roleCode: AdminRoleCode;
    }) => adminBrandService.uploadLogo(input, roleCode),
  });
}
