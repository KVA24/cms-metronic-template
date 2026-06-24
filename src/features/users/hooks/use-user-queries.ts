import {
  AdjustPointPayload,
  CustomerStatusUpdateParams,
  PointHistoryParams,
  userApi,
  UserListParams,
} from '@/features/users/api/userApi';
import { useExportWithTimestamp } from '@/shared/hooks/use-export';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => {
    const key: (string | number)[] = [...userKeys.lists()];
    if (params.pageSize !== undefined) {
      key.push('pageSize');
      key.push(params.pageSize);
    }
    if (params.next !== undefined) {
      key.push('next');
      key.push(params.next);
    }
    if (params.pre !== undefined) {
      key.push('pre');
      key.push(params.pre);
    }
    if (params.id) {
      key.push('id');
      key.push(params.id);
    }
    if (params.fullName) {
      key.push('fullName');
      key.push(params.fullName);
    }
    if (params.cardNumber) {
      key.push('cardNumber');
      key.push(params.cardNumber);
    }
    if (params.tierId !== undefined) {
      key.push('tierId');
      key.push(params.tierId);
    }
    return key;
  },
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (customerId: string) => [...userKeys.details(), customerId] as const,
  customer: (customerId: string) =>
    [...userKeys.all, 'customer', customerId] as const,
  pointHistory: (params: PointHistoryParams) =>
    [...userKeys.all, 'pointHistory', params] as const,
};

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getList(params),
  });
}

/** Fetch account balances for a customer */
export function useUserBalanceDetail(customerId: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(customerId!),
    queryFn: () => userApi.getDetailBalance(customerId!),
    enabled: !!customerId,
  });
}

/** Fetch basic customer info */
export function useCustomerById(customerId: string | undefined) {
  return useQuery({
    queryKey: userKeys.customer(customerId!),
    queryFn: () => userApi.getCustomerById(customerId!),
    enabled: !!customerId,
    retry: false,
  });
}

/** Fetch point history for a customer */
export function usePointHistory(params: PointHistoryParams | null) {
  return useQuery({
    queryKey: userKeys.pointHistory(params!),
    queryFn: () => userApi.getPointHistory(params!),
    enabled: !!params?.customerId,
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      params,
    }: {
      params: CustomerStatusUpdateParams;
    }) => userApi.updateStatus(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('Customer status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer status');
    },
  });
}

/**
 * Hook to export users to Excel
 */
export function useExportUsers() {
  return useExportWithTimestamp<UserListParams>({
    exportFn: (params) => userApi.exportToExcel(params),
    filenamePrefix: 'customers',
    extension: 'xlsx',
    successMessage: 'Customers exported successfully',
    errorMessage: 'Failed to export customers',
  });
}

export function useAdjustUserPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
    }: {
      customerId: string;
      payload: AdjustPointPayload;
    }) => userApi.adjustPoint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Point adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust point');
    },
  });
}

// Aliases for backward compatibility
export const useUserLoyaltyHistory = usePointHistory;
