import type { AdminRoleCode } from '@/shared/permissions';
import { useQuery } from '@tanstack/react-query';
import { adminRbacService } from '../api/admin-rbac-service';

export const adminRbacKeys = {
  all: ['admin-rbac'] as const,
  roles: () => [...adminRbacKeys.all, 'roles'] as const,
  matrix: (roleCode: AdminRoleCode) =>
    [...adminRbacKeys.all, 'matrix', roleCode] as const,
};

export function useAdminSystemRoles(requesterRole: AdminRoleCode) {
  return useQuery({
    queryKey: adminRbacKeys.roles(),
    queryFn: () => adminRbacService.listRoles(requesterRole),
    retry: false,
  });
}

export function useAdminRoleMatrix(
  requesterRole: AdminRoleCode,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminRbacKeys.matrix(roleCode),
    queryFn: () => adminRbacService.getMatrix(requesterRole, roleCode),
    retry: false,
  });
}
