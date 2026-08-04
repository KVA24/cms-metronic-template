import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminTenantAccountService } from '../api/admin-tenant-account-service';
import type {
  AdminTenantAccountCreateInput,
  AdminTenantAccountEditInput,
  AdminTenantAccountQuery,
} from '../model/admin-tenant-account';
import { adminTenantKeys } from './use-admin-tenants';

const accountKeys = {
  all: (tenantId: string) =>
    [...adminTenantKeys.detail(tenantId), 'accounts'] as const,
  list: (
    tenantId: string,
    query: AdminTenantAccountQuery,
    roleCode: AdminRoleCode,
  ) => [...accountKeys.all(tenantId), 'list', query, roleCode] as const,
};

export function useAdminTenantAccounts(
  tenantId: string,
  query: AdminTenantAccountQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: accountKeys.list(tenantId, query, roleCode),
    queryFn: () =>
      adminTenantAccountService.listAccounts(tenantId, query, roleCode),
    retry: false,
  });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminTenantKeys.all });
}

export function useCreateAdminTenantAccount(tenantId: string) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
      actorId,
    }: {
      input: AdminTenantAccountCreateInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminTenantAccountService.createAccount(
        tenantId,
        input,
        roleCode,
        actorId,
      ),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminTenantAccount(tenantId: string) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({
      accountId,
      input,
      expectedVersion,
      roleCode,
      actorId,
    }: {
      accountId: string;
      input: AdminTenantAccountEditInput;
      expectedVersion: number;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminTenantAccountService.updateAccount(
        tenantId,
        accountId,
        input,
        expectedVersion,
        roleCode,
        actorId,
      ),
    onSuccess: invalidate,
  });
}

export function useDisableAdminTenantAccount(tenantId: string) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({
      accountId,
      roleCode,
      actorId,
    }: {
      accountId: string;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminTenantAccountService.disableAccount(
        tenantId,
        accountId,
        roleCode,
        actorId,
      ),
    onSuccess: invalidate,
  });
}
