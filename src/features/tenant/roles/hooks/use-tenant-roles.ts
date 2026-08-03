import type { AuthSession } from '@/shared/contracts';
import { useQuery } from '@tanstack/react-query';
import { tenantRoleService } from '../api/tenant-role-service';
import type { TenantRoleQuery } from '../model/tenant-role';

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
