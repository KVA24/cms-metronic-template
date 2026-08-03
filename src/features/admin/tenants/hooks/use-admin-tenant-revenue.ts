import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminTenantRevenueService } from '../api/admin-tenant-revenue-service';
import type {
  AdminTenantRevenueInput,
  AdminTenantRevenueQuery,
} from '../model/admin-tenant-revenue';
import { adminTenantKeys } from './use-admin-tenants';

export function useAdminTenantRevenueList(
  tenantId: string,
  query: AdminTenantRevenueQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: [...adminTenantKeys.detail(tenantId), 'revenue-list', query, roleCode],
    queryFn: () => adminTenantRevenueService.listRevenueShares(tenantId, query, roleCode),
    retry: false,
  });
}

export function useAdminTenantRevenue(
  tenantId: string,
  brandId: string,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: [...adminTenantKeys.detail(tenantId), 'revenue', brandId, roleCode],
    queryFn: () => adminTenantRevenueService.getRevenueShare(tenantId, brandId, roleCode),
    enabled: Boolean(tenantId && brandId),
    retry: false,
  });
}

export function useSaveAdminTenantRevenue(tenantId: string, brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, expectedVersion, roleCode, actorId }: {
      input: AdminTenantRevenueInput;
      expectedVersion: number | null;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminTenantRevenueService.saveRevenueShare(
      tenantId,
      brandId,
      input,
      expectedVersion,
      roleCode,
      actorId,
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTenantKeys.all }),
  });
}
