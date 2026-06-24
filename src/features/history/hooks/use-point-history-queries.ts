import {
  pointHistoryApi,
  PointTransactionExportParams,
  PointTransactionParams,
} from '@/features/history/api/pointHistoryApi';
import { useExportWithTimestamp } from '@/shared/hooks/use-export';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const pointHistoryKeys = {
  all: ['point-history'] as const,
  list: (params?: PointTransactionParams) =>
    ['point-history', 'list', params] as const,
};

export function usePointHistoryList(params?: PointTransactionParams) {
  return useQuery({
    queryKey: pointHistoryKeys.list(params),
    queryFn: () => pointHistoryApi.getList(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to export point history to Excel
 */
export function useExportPointHistory() {
  return useExportWithTimestamp<PointTransactionExportParams>({
    exportFn: (params) => pointHistoryApi.exportToExcel(params),
    filenamePrefix: 'point-transactions',
    extension: 'xlsx',
    successMessage: 'Point transactions exported successfully',
    errorMessage: 'Failed to export point transactions',
  });
}
