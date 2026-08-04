import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminTenantService } from '../api/admin-tenant-service';
import type { AdminTenantInput, AdminTenantQuery } from '../model/admin-tenant';

export const adminTenantKeys = {
  all: ['admin-tenants'] as const,
  list: (query: AdminTenantQuery, roleCode: AdminRoleCode) =>
    [...adminTenantKeys.all, 'list', query, roleCode] as const,
  filters: (roleCode: AdminRoleCode) =>
    [...adminTenantKeys.all, 'filters', roleCode] as const,
  detail: (tenantId: string) =>
    [...adminTenantKeys.all, 'detail', tenantId] as const,
};

export function useAdminTenants(
  query: AdminTenantQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminTenantKeys.list(query, roleCode),
    queryFn: () => adminTenantService.listTenants(query, roleCode),
    retry: false,
  });
}

export function useAdminTenant(
  tenantId: string | undefined,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminTenantKeys.detail(tenantId ?? ''),
    queryFn: () => adminTenantService.getTenant(tenantId!, roleCode),
    enabled: Boolean(tenantId),
    retry: false,
  });
}

export function useAdminTenantFilterOptions(roleCode: AdminRoleCode) {
  return useQuery({
    queryKey: adminTenantKeys.filters(roleCode),
    queryFn: () => adminTenantService.getFilterOptions(roleCode),
    retry: false,
  });
}

export function useCreateAdminTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
      actorId,
    }: {
      input: AdminTenantInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminTenantService.createTenant(input, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.all }),
  });
}

export function useUpdateAdminTenant(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      expectedVersion,
      roleCode,
      actorId,
    }: {
      input: AdminTenantInput;
      expectedVersion: number;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminTenantService.updateTenant(
        tenantId,
        input,
        expectedVersion,
        roleCode,
        actorId,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.all }),
  });
}

export function useDeactivateAdminTenant(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleCode,
      actorId,
    }: {
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminTenantService.deactivateTenant(tenantId, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminTenantKeys.all }),
  });
}
