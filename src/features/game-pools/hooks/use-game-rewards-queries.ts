import { useQuery } from '@tanstack/react-query';
import { gameRewardsApi } from '../api/gameRewardsApi';

/**
 * Game Rewards hooks for game-pools feature
 * Isolated copy to avoid cross-feature dependencies
 */

export function useAllGameRewards(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['gamePools', 'rewards', 'all'],
    queryFn: () => gameRewardsApi.getAll(),
    enabled: options?.enabled,
  });
}
