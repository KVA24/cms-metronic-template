import type { AuthSession } from '@/shared/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantAccountService } from '../api/tenant-account-service';
import type {
  TenantAccountCreateInput,
  TenantAccountQuery,
  TenantAccountUpdateInput,
} from '../model/tenant-account';

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

export function useTenantAccountMutations(session: AuthSession | null) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: tenantAccountKeys.all });
  const create = useMutation({
    mutationFn: (input: TenantAccountCreateInput) =>
      tenantAccountService.create(session!, input),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: TenantAccountUpdateInput;
    }) => tenantAccountService.update(session!, accountId, input),
    onSuccess: refresh,
  });
  const disable = useMutation({
    mutationFn: (accountId: string) =>
      tenantAccountService.disable(session!, accountId),
    onSuccess: refresh,
  });
  const unlock = useMutation({
    mutationFn: (accountId: string) =>
      tenantAccountService.unlock(session!, accountId),
    onSuccess: refresh,
  });
  return { create, update, disable, unlock };
}
