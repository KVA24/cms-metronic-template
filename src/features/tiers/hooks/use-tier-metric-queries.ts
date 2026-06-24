import { useSharedTierMetrics } from '@/features/shared';

export const useTierMetricListQuery = () => {
  return useSharedTierMetrics();
};

// Note: Detail query is not needed in tiers feature, only list
export const useTierMetricDetailQuery = () => {
  throw new Error('useTierMetricDetailQuery is not available in tiers feature');
};
