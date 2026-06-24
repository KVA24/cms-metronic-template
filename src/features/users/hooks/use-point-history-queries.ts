import { useQuery } from '@tanstack/react-query';
import { pointHistoryApi, PointHistoryParams } from '../api/pointHistoryApi';

/**
 * Point History hooks for users feature
 * Isolated copy to avoid cross-feature dependencies
 */

export const pointHistoryKeys = {
  all: ['users', 'pointHistory'] as const,
  lists: () => ['users', 'pointHistory', 'list'] as const,
  list: (params: PointHistoryParams) =>
    ['users', 'pointHistory', 'list', params] as const,
};

export function usePointHistoryList(params: PointHistoryParams) {
  return useQuery({
    queryKey: pointHistoryKeys.list(params),
    queryFn: () => pointHistoryApi.getList(params),
    retry: false,
  });
}
