import {
  gameItemsApi,
  GameRewardCreateDto,
  gameRewardsApi,
  GameRewardSearchParams,
  GameRewardUpdateDto,
} from '@/features/game-rewards/api/gameRewardsApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const gameRewardsKeys = {
  all: ['gameRewards'] as const,
  lists: () => ['gameRewards', 'list'] as const,
  list: (params: GameRewardSearchParams) => {
    const key: (string | number)[] = ['gameRewards', 'list'];
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
    if (params.rewardName) {
      key.push('rewardName');
      key.push(params.rewardName);
    }
    if (params.type) {
      key.push('type');
      key.push(params.type);
    }
    return key;
  },
  details: () => ['gameRewards', 'detail'] as const,
  detail: (id: string) => ['gameRewards', 'detail', id] as const,
};

/**
 * Hook to fetch game rewards list with search filters (no pagination)
 */
export function useGameRewardsList(params: GameRewardSearchParams) {
  return useQuery({
    queryKey: gameRewardsKeys.list(params),
    queryFn: () => gameRewardsApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch game reward detail by ID
 */
export function useGameRewardDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: gameRewardsKeys.detail(id!),
    queryFn: () => gameRewardsApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Hook to create new game reward
 */
export function useCreateGameReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: GameRewardCreateDto;
    }) => gameRewardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameRewardsKeys.lists() });
      toast.success('Game reward created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create game reward');
    },
  });
}

/**
 * Hook to update existing game reward
 */
export function useUpdateGameReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: GameRewardUpdateDto;
    }) => gameRewardsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gameRewardsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gameRewardsKeys.detail(variables.id),
      });
      toast.success('Game reward updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update game reward');
    },
  });
}

/**
 * Hook to delete game reward
 */
export function useDeleteGameReward() {
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
    }) => gameRewardsApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameRewardsKeys.lists() });
      toast.success('Game reward deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete game reward');
    },
  });
}

/**
 * Hook to fetch all game items
 */
export function useGameItems() {
  return useQuery({
    queryKey: ['gameItems'],
    queryFn: () => gameItemsApi.getAll(),
  });
}

/**
 * Hook to fetch all game rewards (for selector)
 */
export function useAllGameRewards(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['gameRewards', 'all'],
    queryFn: () => gameRewardsApi.getAll(),
    enabled: options?.enabled,
  });
}
