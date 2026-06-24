import {
  expiryPolicyApi,
  ExpiryPolicyCreateDto,
  ExpiryPolicySearchParams,
  ExpiryPolicyUpdateDto,
} from '@/features/expiry-policy/api/expiryPolicyApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const expiryPolicyKeys = {
  all: ['expiryPolicies'] as const,
  lists: () => ['expiryPolicies', 'list'] as const,
  list: (params: ExpiryPolicySearchParams) => {
    const key: (string | number)[] = ['expiryPolicies', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.id) {
      key.push('id');
      key.push(params.id);
    }
    if (params.code) {
      key.push('code');
      key.push(params.code);
    }
    if (params.type) {
      key.push('type');
      key.push(params.type);
    }
    if (params.status) {
      key.push('status');
      key.push(params.status);
    }
    return key;
  },
  details: () => ['expiryPolicies', 'detail'] as const,
  detail: (id: string) => ['expiryPolicies', 'detail', id] as const,
};

/**
 * Hook to fetch expiry policy list with search filters (with pagination)
 */
export function useExpiryPolicyList(params: ExpiryPolicySearchParams) {
  return useQuery({
    queryKey: expiryPolicyKeys.list(params),
    queryFn: () => expiryPolicyApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch all expiry policies without pagination
 */
export function useExpiryPolicyListAll(params?: ExpiryPolicySearchParams) {
  return useQuery({
    queryKey: expiryPolicyKeys.all,
    queryFn: () => expiryPolicyApi.getListAll(params),
    retry: false,
  });
}

/**
 * Hook to fetch expiry policies by currency ID
 */
export function useExpiryPolicyListByCurrency(
  currencyId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['expiryPolicies', 'byCurrency', currencyId],
    queryFn: () => expiryPolicyApi.getListByCurrency(currencyId!),
    enabled: options?.enabled !== undefined ? options.enabled : !!currencyId,
    retry: false,
  });
}

/**
 * Hook to fetch expiry policy detail by ID
 */
export function useExpiryPolicyDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: expiryPolicyKeys.detail(id!),
    queryFn: () => expiryPolicyApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Hook to create new expiry policy
 */
export function useCreateExpiryPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: ExpiryPolicyCreateDto;
    }) => expiryPolicyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expiryPolicyKeys.lists() });
      toast.success('Expiry policy created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create expiry policy');
    },
  });
}

/**
 * Hook to update existing expiry policy
 */
export function useUpdateExpiryPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ExpiryPolicyUpdateDto;
    }) => expiryPolicyApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: expiryPolicyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: expiryPolicyKeys.detail(variables.id),
      });
      toast.success('Expiry policy updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update expiry policy');
    },
  });
}

/**
 * Hook to delete expiry policy
 */
export function useDeleteExpiryPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      otpCode,
      sign,
    }: {
      id: string;
      otpCode: string;
      sign?: string;
    }) => expiryPolicyApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expiryPolicyKeys.lists() });
      toast.success('Expiry policy deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete expiry policy');
    },
  });
}
