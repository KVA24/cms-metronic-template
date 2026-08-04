import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminBrandMappingService } from '../api/admin-brand-mapping-service';
import type {
  AdminBrandMappingQuery,
  AdminBrandMappingRowInput,
} from '../model/admin-brand-mapping';
import { adminBrandKeys } from './use-admin-brands';

const mappingKeys = {
  all: (brandId: string) =>
    [...adminBrandKeys.detail(brandId), 'mappings'] as const,
  list: (
    brandId: string,
    query: AdminBrandMappingQuery,
    roleCode: AdminRoleCode,
  ) => [...mappingKeys.all(brandId), query, roleCode] as const,
  detail: (brandId: string, mappingId: string, roleCode: AdminRoleCode) =>
    [...mappingKeys.all(brandId), 'detail', mappingId, roleCode] as const,
};

export function useAdminBrandMapping(
  brandId: string | undefined,
  mappingId: string | undefined,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: mappingKeys.detail(brandId ?? '', mappingId ?? '', roleCode),
    queryFn: () =>
      adminBrandMappingService.getMapping(brandId!, mappingId!, roleCode),
    enabled: Boolean(brandId && mappingId),
    retry: false,
  });
}

export function useAdminBrandMappings(
  brandId: string | undefined,
  query: AdminBrandMappingQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: mappingKeys.list(brandId ?? '', query, roleCode),
    queryFn: () =>
      adminBrandMappingService.listMappings(brandId!, query, roleCode),
    enabled: Boolean(brandId),
    retry: false,
  });
}

export function useSaveAdminBrandMappings(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
      roleCode,
      actorId,
    }: {
      rows: AdminBrandMappingRowInput[];
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminBrandMappingService.saveBatch(brandId, rows, roleCode, actorId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: mappingKeys.all(brandId) }),
        queryClient.invalidateQueries({ queryKey: adminBrandKeys.all }),
      ]),
  });
}
