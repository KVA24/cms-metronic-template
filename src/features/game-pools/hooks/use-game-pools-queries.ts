import {
  GamePoolCreateDto,
  gamePoolsApi,
  GamePoolSearchParams,
  GamePoolUpdateDto,
} from '@/features/game-pools/api/gamePoolsApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const gamePoolsKeys = {
  all: ['gamePools'] as const,
  lists: () => ['gamePools', 'list'] as const,
  list: (params: GamePoolSearchParams) => {
    const key: (string | number)[] = ['gamePools', 'list'];
    if (params.page !== undefined) key.push('page', params.page);
    if (params.size !== undefined) key.push('size', params.size);
    if (params.code) key.push('code', params.code);
    if (params.state) key.push('state', params.state);
    return key;
  },
  details: () => ['gamePools', 'detail'] as const,
  detail: (id: string) => ['gamePools', 'detail', id] as const,
};

export function useGamePoolsList(params: GamePoolSearchParams) {
  return useQuery({
    queryKey: gamePoolsKeys.list(params),
    queryFn: () => gamePoolsApi.getList(params),
    retry: false,
  });
}

export function useGamePoolDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: gamePoolsKeys.detail(id!),
    queryFn: () => gamePoolsApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCreateGamePool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: GamePoolCreateDto }) =>
      gamePoolsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamePoolsKeys.lists() });
      toast.success('Game pool created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create game pool');
    },
  });
}

export function useUpdateGamePool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: GamePoolUpdateDto;
    }) => gamePoolsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gamePoolsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gamePoolsKeys.detail(variables.id),
      });
      toast.success('Game pool updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update game pool');
    },
  });
}

export function useDeleteGamePool() {
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
    }) => gamePoolsApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamePoolsKeys.lists() });
      toast.success('Game pool deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete game pool');
    },
  });
}
