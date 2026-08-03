import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminDashboardService } from '../api/admin-dashboard-service';
import type { AdminDashboardQuery } from '../model/admin-dashboard';

export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
  view: (query: AdminDashboardQuery, roleCode: AdminRoleCode) =>
    [...adminDashboardKeys.all, 'view', query, roleCode] as const,
  filters: () => [...adminDashboardKeys.all, 'filters'] as const,
};

export function useAdminDashboard(
  query: AdminDashboardQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminDashboardKeys.view(query, roleCode),
    queryFn: () => adminDashboardService.getDashboard(query, roleCode),
    retry: false,
  });
}

export function useAdminDashboardFilterOptions() {
  return useQuery({
    queryKey: adminDashboardKeys.filters(),
    queryFn: () => adminDashboardService.getFilterOptions(),
    retry: false,
  });
}

export function useAdminDashboardExport() {
  return useMutation({
    mutationFn: ({
      query,
      roleCode,
    }: {
      query: AdminDashboardQuery;
      roleCode: AdminRoleCode;
    }) => adminDashboardService.exportDashboard(query, roleCode),
  });
}
