import {
  redemptionTransactionApi,
  RedemptionTransactionSearchParams,
  RedemptionTransactionExportParams,
} from '@/features/redemption-transactions/api/redemptionTransactionApi';
import { useQuery } from '@tanstack/react-query';
import { useExportWithTimestamp } from '@/shared/hooks/use-export';

// Query keys
export const redemptionTransactionKeys = {
  all: ['transactionId'] as const,
  lists: () => ['transactionId', 'list'] as const,
  list: (params: RedemptionTransactionSearchParams) => {
    const key: (string | number)[] = ['transactionId', 'list'];
    if (params.pageSize !== undefined) {
      key.push('pageSize');
      key.push(params.pageSize);
    }
    if (params.userId) {
      key.push('userId');
      key.push(params.userId);
    }
    if (params.rewardCatalogId !== undefined) {
      key.push('rewardCatalogId');
      key.push(params.rewardCatalogId);
    }
    if (params.status) {
      key.push('status');
      key.push(params.status);
    }
    if (params.transactionId) {
      key.push('transactionId');
      key.push(params.transactionId);
    }
    if (params.referenceId) {
      key.push('referenceId');
      key.push(params.referenceId);
    }
    if (params.cardNumber) {
      key.push('cardNumber');
      key.push(params.cardNumber);
    }
    if (params.fromDate) {
      key.push('fromDate');
      key.push(params.fromDate);
    }
    if (params.toDate) {
      key.push('toDate');
      key.push(params.toDate);
    }
    if (params.cursor !== undefined) {
      key.push('cursor');
      key.push(params.cursor);
    }
    if (params.direction) {
      key.push('direction');
      key.push(params.direction);
    }
    return key;
  },
};

/**
 * Hook to fetch redemption transaction list with pagination
 */
export function useRedemptionTransactionList(params: RedemptionTransactionSearchParams) {
  return useQuery({
    queryKey: redemptionTransactionKeys.list(params),
    queryFn: () => redemptionTransactionApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to export redemption transactions to Excel
 */
export function useExportRedemptionTransactions() {
  return useExportWithTimestamp<RedemptionTransactionExportParams>({
    exportFn: (params) => redemptionTransactionApi.exportToExcel(params),
    filenamePrefix: 'reward-transactions',
    extension: 'xlsx',
    successMessage: 'Reward transactions exported successfully',
    errorMessage: 'Failed to export reward transactions',
  });
}
