import {
  tierApi,
  TierCreateDto,
  TierListParams,
  TierUpdateDto,
} from '@/features/tiers/api/tierApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const tierKeys = {
  all: ['tiers'] as const,
  lists: () => ['tiers', 'list'] as const,
  list: (params: TierListParams) => {
    const key: (string | number)[] = ['tiers', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.id !== undefined) {
      key.push('id');
      key.push(params.id);
    }
    if (params.name) {
      key.push('name');
      key.push(params.name);
    }
    if (params.code) {
      key.push('code');
      key.push(params.code);
    }
    return key;
  },
  details: () => ['tiers', 'detail'] as const,
  detail: (id: string) => ['tiers', 'detail', id] as const,
};

/**
 * Hook to fetch tier list with pagination and search
 */
export function useTierList(params: TierListParams) {
  return useQuery({
    queryKey: tierKeys.list(params),
    queryFn: () => tierApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch tier detail by ID
 */
export function useTierDetail(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tierKeys.detail(id!),
    queryFn: () => tierApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Hook to create new tier
 */
export function useCreateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TierCreateDto) => tierApi.create(data),
    onSuccess: () => {
      // Invalidate all tier lists to refetch
      queryClient.invalidateQueries({ queryKey: tierKeys.lists() });
      toast.success('Tier created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tier');
    },
  });
}

/**
 * Hook to update existing tier
 */
export function useUpdateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TierUpdateDto }) =>
      tierApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all tier lists and the specific detail
      queryClient.invalidateQueries({ queryKey: tierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tierKeys.detail(variables.id),
      });
      toast.success('Tier updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tier');
    },
  });
}

/**
 * Hook to delete tier
 */
export function useDeleteTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, otpCode }: { id: string; otpCode?: string }) =>
      tierApi.delete(id, { otpCode }),
    onSuccess: () => {
      // Invalidate all tier lists to refetch
      queryClient.invalidateQueries({ queryKey: tierKeys.lists() });
      toast.success('Tier deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tier');
    },
  });
}

/**
 * Hook to fetch all tiers without pagination
 */
export function useTierListAll(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tiers', 'listAll'] as const,
    queryFn: () => tierApi.getListAll(),
    enabled: options?.enabled !== undefined ? options.enabled : true,
    retry: false,
  });
}

// Aliases for backward compatibility
export const useTierListQuery = useTierList;
