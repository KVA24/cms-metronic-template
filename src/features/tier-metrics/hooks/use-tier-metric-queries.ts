import {
  tierMetricApi,
  TierMetricCreateDto,
  TierMetricDeleteParams,
  TierMetricListParams,
  TierMetricUpdateDto,
} from '@/features/tier-metrics/api/tierMetricApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TIER_METRIC_QUERY_KEY = 'tier-metrics';

/**
 * Query hook to fetch tier metric list
 */
export const useTierMetricListQuery = (params?: TierMetricListParams) => {
  return useQuery({
    queryKey: [TIER_METRIC_QUERY_KEY, 'list', params],
    queryFn: () => tierMetricApi.getList(params),
  });
};

/**
 * Query hook to fetch tier metric detail
 */
export const useTierMetricDetailQuery = (
  id?: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [TIER_METRIC_QUERY_KEY, 'detail', id],
    queryFn: () => tierMetricApi.getDetail(id!),
    enabled: !!id && options?.enabled !== false,
  });
};

/**
 * Mutation hook to create tier metric
 */
export const useCreateTierMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: TierMetricCreateDto;
    }) => {
      return tierMetricApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [TIER_METRIC_QUERY_KEY],
      });
      toast.success('Tier metric created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tier metric');
    },
  });
};

/**
 * Mutation hook to update tier metric
 */
export const useUpdateTierMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TierMetricUpdateDto;
    }) => {
      return tierMetricApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [TIER_METRIC_QUERY_KEY],
      });
      toast.success('Tier metric updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tier metric');
    },
  });
};

/**
 * Mutation hook to delete tier metric
 */
export const useDeleteTierMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      params,
    }: {
      id: string;
      params: TierMetricDeleteParams;
    }) => {
      return tierMetricApi.delete(id, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [TIER_METRIC_QUERY_KEY],
      });
      toast.success('Tier metric deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tier metric');
    },
  });
};
