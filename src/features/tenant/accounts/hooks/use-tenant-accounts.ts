import type { AuthSession } from '@/shared/contracts';
import { useQuery } from '@tanstack/react-query';
import { tenantAccountService } from '../api/tenant-account-service';
import type { TenantAccountQuery } from '../model/tenant-account';

export const tenantAccountKeys = {
  all: ['tenant-accounts'] as const,
  list: (session: AuthSession | null, query: TenantAccountQuery) =>
    [...tenantAccountKeys.all, 'list', session?.user.id, query] as const,
  detail: (session: AuthSession | null, accountId: string) =>
    [...tenantAccountKeys.all, 'detail', session?.user.id, accountId] as const,
  roles: (session: AuthSession | null) =>
    [...tenantAccountKeys.all, 'roles', session?.user.id] as const,
};

export function useTenantAccounts(
  session: AuthSession | null,
  query: TenantAccountQuery,
) {
  return useQuery({
    queryKey: tenantAccountKeys.list(session, query),
    queryFn: () => tenantAccountService.list(session!, query),
    enabled: Boolean(session),
    retry: false,
  });
}

export function useTenantAccountDetail(
  session: AuthSession | null,
  accountId: string,
) {
  return useQuery({
    queryKey: tenantAccountKeys.detail(session, accountId),
    queryFn: () => tenantAccountService.getDetail(session!, accountId),
    enabled: Boolean(session && accountId),
    retry: false,
  });
}

export function useTenantAccountRoles(session: AuthSession | null) {
  return useQuery({
    queryKey: tenantAccountKeys.roles(session),
    queryFn: () => tenantAccountService.getRoleOptions(session!),
    enabled: Boolean(session),
    retry: false,
  });
}
