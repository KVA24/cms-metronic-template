import type { AuthSession } from '@/shared/contracts';
import { useQuery } from '@tanstack/react-query';
import { tenantEarnDisplayService } from '../api/tenant-earn-display-service';
import type { TenantEarnDisplayQuery } from '../model/tenant-earn-display';

export const tenantEarnDisplayKeys = {
  all: ['tenant-earn-display'] as const,
  list: (session: AuthSession | null, query: TenantEarnDisplayQuery) =>
    [...tenantEarnDisplayKeys.all, 'list', session?.user.id, query] as const,
  brand: (session: AuthSession | null, brandId: string) =>
    [...tenantEarnDisplayKeys.all, 'brand', session?.user.id, brandId] as const,
};

export function useTenantEarnDisplayList(
  session: AuthSession | null,
  query: TenantEarnDisplayQuery,
) {
  return useQuery({
    queryKey: tenantEarnDisplayKeys.list(session, query),
    queryFn: () => tenantEarnDisplayService.list(session!, query),
    enabled: Boolean(session),
    retry: false,
  });
}
