import { useQuery } from '@tanstack/react-query';
import { activityLogApi, ActivityLogListParams } from '../api/activityLogApi';

// Query keys
export const activityLogKeys = {
  all: ['activityLogs'] as const,
  lists: () => ['activityLogs', 'list'] as const,
  list: (params: ActivityLogListParams) => {
    const key: (string | number)[] = ['activityLogs', 'list'];
    if (params.limit !== undefined) {
      key.push('limit');
      key.push(params.limit);
    }
    if (params.next !== undefined) {
      key.push('next');
      key.push(params.next);
    }
    if (params.pre !== undefined) {
      key.push('pre');
      key.push(params.pre);
    }
    if (params.username) {
      key.push('username');
      key.push(params.username);
    }
    if (params.accountRole) {
      key.push('accountRole');
      key.push(params.accountRole);
    }
    if (params.actionType) {
      key.push('actionType');
      key.push(params.actionType);
    }
    if (params.gte) {
      key.push('gte');
      key.push(params.gte);
    }
    if (params.lte) {
      key.push('lte');
      key.push(params.lte);
    }
    return key;
  },
};

/**
 * Hook to fetch activity log list with cursor-based pagination
 */
export function useActivityLogList(params: ActivityLogListParams) {
  return useQuery({
    queryKey: activityLogKeys.list(params),
    queryFn: () => activityLogApi.getList(params),
    retry: false,
  });
}
