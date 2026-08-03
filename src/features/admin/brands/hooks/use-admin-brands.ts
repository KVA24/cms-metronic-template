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
  detail: (brandId: string) => [...adminBrandKeys.all, 'detail', brandId] as const,
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

export function useAdminBrand(
  brandId: string | undefined,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminBrandKeys.detail(brandId ?? ''),
    queryFn: () => adminBrandService.getBrand(brandId!, roleCode),
    enabled: Boolean(brandId),
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

export function useUpdateAdminBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      brandId,
      input,
      expectedVersion,
      roleCode,
      actorId,
    }: {
      brandId: string;
      input: AdminBrandInput;
      expectedVersion: number;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminBrandService.updateBrand(
        brandId,
        input,
        expectedVersion,
        roleCode,
        actorId,
      ),
    onSuccess: (_, { brandId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBrandKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminBrandKeys.detail(brandId) }),
      ]),
  });
}

export function useDeactivateAdminBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      brandId,
      roleCode,
      actorId,
    }: {
      brandId: string;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminBrandService.deactivateBrand(brandId, roleCode, actorId),
    onSuccess: (_, { brandId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBrandKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminBrandKeys.detail(brandId) }),
      ]),
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
