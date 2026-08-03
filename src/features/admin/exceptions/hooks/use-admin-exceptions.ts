import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminExceptionService } from '../api/admin-exception-service';
import type { AdminExceptionQuery } from '../model/admin-exception';

export const adminExceptionKeys = { all: ['admin-exceptions'] as const };

export function useAdminExceptions(query: AdminExceptionQuery, roleCode: AdminRoleCode) {
  return useQuery({ queryKey: [...adminExceptionKeys.all, query, roleCode], queryFn: () => adminExceptionService.list(query, roleCode), retry: false });
}

export function useAdminExceptionFilters(roleCode: AdminRoleCode) {
  return useQuery({ queryKey: [...adminExceptionKeys.all, 'filters', roleCode], queryFn: () => adminExceptionService.getFilterOptions(roleCode), retry: false });
}

export function useExportAdminExceptions() {
  return useMutation({
    mutationFn: async ({ query, roleCode, actorId }: { query: AdminExceptionQuery; roleCode: AdminRoleCode; actorId: string }) => {
      const request = await adminExceptionService.requestExport(query, roleCode, actorId);
      return adminExceptionService.completeExport(request.id, roleCode);
    },
  });
}
