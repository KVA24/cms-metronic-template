import type { AuthSession } from '@/shared/contracts';
import { useQuery } from '@tanstack/react-query';
import { tenantDashboardService } from '../api/tenant-dashboard-service';
import type { TenantDashboardQuery } from '../model/tenant-dashboard';

export const tenantDashboardKeys = {
  view: (session: AuthSession | null, query: TenantDashboardQuery) =>
    ['tenant-dashboard', session?.user.id, query] as const,
};

export function useTenantDashboard(
  session: AuthSession | null,
  query: TenantDashboardQuery,
) {
  return useQuery({
    queryKey: tenantDashboardKeys.view(session, query),
    queryFn: () => tenantDashboardService.getDashboard(session!, query),
    enabled: Boolean(session),
    retry: false,
  });
}
