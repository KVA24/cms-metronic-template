import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminTransactionService } from '../api/admin-transaction-service';
import type { AdminTransactionQuery } from '../model/admin-transaction';

export const adminTransactionKeys = { all: ['admin-transactions'] as const };

export function useAdminTransactions(
  query: AdminTransactionQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: [...adminTransactionKeys.all, query, roleCode],
    queryFn: () => adminTransactionService.list(query, roleCode),
    retry: false,
  });
}

export function useAdminTransactionFilters(roleCode: AdminRoleCode) {
  return useQuery({
    queryKey: [...adminTransactionKeys.all, 'filters', roleCode],
    queryFn: () => adminTransactionService.getFilterOptions(roleCode),
    retry: false,
  });
}

export function useAdminTransactionDetail(
  transactionId: string,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: [...adminTransactionKeys.all, 'detail', transactionId, roleCode],
    queryFn: () => adminTransactionService.getDetail(transactionId, roleCode),
    enabled: Boolean(transactionId),
    retry: false,
  });
}

export function useExportAdminTransactions() {
  return useMutation({
    mutationFn: async ({
      query,
      roleCode,
      actorId,
    }: {
      query: AdminTransactionQuery;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => {
      const request = await adminTransactionService.requestExport(
        query,
        roleCode,
        actorId,
      );
      return adminTransactionService.completeExport(request.id, roleCode);
    },
  });
}
