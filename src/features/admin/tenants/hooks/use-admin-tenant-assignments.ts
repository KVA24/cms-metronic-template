import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminTenantAssignmentService } from '../api/admin-tenant-assignment-service';
import type {
  AdminTenantAssignmentDraft,
  AdminTenantAssignmentQuery,
} from '../model/admin-tenant-assignment';
import { adminTenantKeys } from './use-admin-tenants';

export function useAdminTenantAssignments(
  tenantId: string,
  query: AdminTenantAssignmentQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: [...adminTenantKeys.detail(tenantId), 'assignments', query, roleCode],
    queryFn: () => adminTenantAssignmentService.listAssignments(tenantId, query, roleCode),
    retry: false,
  });
}

export function useSaveAdminTenantAssignments(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ drafts, roleCode, actorId }: {
      drafts: AdminTenantAssignmentDraft[];
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminTenantAssignmentService.saveAssignments(
      tenantId,
      drafts,
      roleCode,
      actorId,
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTenantKeys.all }),
  });
}
