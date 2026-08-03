import type { AuthSession } from '@/shared/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantRoleService } from '../api/tenant-role-service';
import type {
  TenantRoleCreateInput,
  TenantRoleQuery,
  TenantRoleUpdateInput,
} from '../model/tenant-role';

export const tenantRoleKeys = {
  all: ['tenant-roles'] as const,
  list: (session: AuthSession | null, query: TenantRoleQuery) =>
    [...tenantRoleKeys.all, 'list', session?.user.id, query] as const,
  detail: (session: AuthSession | null, roleId: string) =>
    [...tenantRoleKeys.all, 'detail', session?.user.id, roleId] as const,
};

export function useTenantRoles(
  session: AuthSession | null,
  query: TenantRoleQuery,
) {
  return useQuery({
    queryKey: tenantRoleKeys.list(session, query),
    queryFn: () => tenantRoleService.list(session!, query),
    enabled: Boolean(session),
    retry: false,
  });
}

export function useTenantRoleDetail(
  session: AuthSession | null,
  roleId: string,
) {
  return useQuery({
    queryKey: tenantRoleKeys.detail(session, roleId),
    queryFn: () => tenantRoleService.getDetail(session!, roleId),
    enabled: Boolean(session && roleId),
    retry: false,
  });
}

export function useTenantRoleMutations(session: AuthSession | null) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: tenantRoleKeys.all });
  const create = useMutation({
    mutationFn: (input: TenantRoleCreateInput) =>
      tenantRoleService.create(session!, input),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({
      roleId,
      input,
    }: {
      roleId: string;
      input: TenantRoleUpdateInput;
    }) => tenantRoleService.update(session!, roleId, input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (roleId: string) => tenantRoleService.delete(session!, roleId),
    onSuccess: refresh,
  });
  return { create, update, remove };
}
