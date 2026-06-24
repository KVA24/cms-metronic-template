import {
  configApi,
  ConfigCreateDto,
  ConfigSearchParams,
  ConfigUpdateDto,
} from '@/features/config/api/configApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys - Simplified to avoid serialization issues
export const configKeys = {
  all: ['configs'] as const,
  lists: () => ['configs', 'list'] as const,
  list: (params: ConfigSearchParams) => {
    // Only include defined params to avoid unnecessary refetches
    const key: (string | number)[] = ['configs', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.keyConfig) {
      key.push('keyConfig');
      key.push(params.keyConfig);
    }
    if (params.category) {
      key.push('category');
      key.push(params.category);
    }
    return key;
  },
  details: () => ['configs', 'detail'] as const,
  detail: (id: string) => ['configs', 'detail', id] as const,
};

/**
 * Hook to fetch config list with pagination and search
 */
export function useConfigList(params: ConfigSearchParams) {
  return useQuery({
    queryKey: configKeys.list(params),
    queryFn: () => configApi.getList(params),
    retry: false, // Disable retry to prevent infinite loop
  });
}

/**
 * Hook to fetch config detail by ID
 */
export function useConfigDetail(id: string | null) {
  return useQuery({
    queryKey: configKeys.detail(id!),
    queryFn: () => configApi.getDetail(id!),
    enabled: !!id, // Only fetch when id is provided
  });
}

/**
 * Hook to create new config
 */
export function useCreateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: ConfigCreateDto }) =>
      configApi.create(data),
    onSuccess: () => {
      // Invalidate all config lists to refetch
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
      toast.success('Config created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create config');
    },
  });
}

/**
 * Hook to update existing config
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ConfigUpdateDto;
    }) => configApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all config lists and the specific detail
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: configKeys.detail(variables.id),
      });
      toast.success('Config updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update config');
    },
  });
}

/**
 * Hook to delete config
 */
export function useDeleteConfig() {
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
    }) => configApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      // Invalidate all config lists to refetch
      queryClient.invalidateQueries({ queryKey: configKeys.lists() });
      toast.success('Config deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete config');
    },
  });
}
