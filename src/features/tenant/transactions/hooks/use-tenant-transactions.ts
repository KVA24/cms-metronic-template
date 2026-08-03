import type { AuthSession } from '@/shared/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { tenantTransactionService } from '../api/tenant-transaction-service';
import type { TenantTransactionQuery } from '../model/tenant-transaction';

export const tenantTransactionKeys = {
  all: ['tenant-transactions'] as const,
  list: (session: AuthSession | null, query: TenantTransactionQuery) =>
    [...tenantTransactionKeys.all, 'list', session?.user.id, query] as const,
  detail: (session: AuthSession | null, id: string) =>
    [...tenantTransactionKeys.all, 'detail', session?.user.id, id] as const,
};

export function useTenantTransactions(
  session: AuthSession | null,
  query: TenantTransactionQuery,
) {
  return useQuery({
    queryKey: tenantTransactionKeys.list(session, query),
    queryFn: () => tenantTransactionService.list(session!, query),
    enabled: Boolean(session),
    retry: false,
  });
}

export function useTenantTransactionDetail(
  session: AuthSession | null,
  id: string,
) {
  return useQuery({
    queryKey: tenantTransactionKeys.detail(session, id),
    queryFn: () => tenantTransactionService.getDetail(session!, id),
    enabled: Boolean(session && id),
    retry: false,
  });
}

export function useTenantTransactionExport(session: AuthSession | null) {
  return useMutation({
    mutationFn: async (query: TenantTransactionQuery) => {
      const request = await tenantTransactionService.requestExport(
        session!,
        query,
      );
      return tenantTransactionService.completeExport(session!, request.id);
    },
  });
}
