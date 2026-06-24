import {
  gameItemApi,
  GameItemCreateDto,
  GameItemSearchParams,
  GameItemUpdateDto,
} from '@/features/game-items/api/gameItemApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const gameItemKeys = {
  all: ['game-items'] as const,
  lists: () => ['game-items', 'list'] as const,
  list: (params: GameItemSearchParams) =>
    ['game-items', 'list', params] as const,
  details: () => ['game-items', 'detail'] as const,
  detail: (id: string) => ['game-items', 'detail', id] as const,
  codes: () => ['game-items', 'codes'] as const,
};

export function useGameItemCodes() {
  return useQuery({
    queryKey: gameItemKeys.codes(),
    queryFn: () => gameItemApi.getItemCodes(),
    retry: false,
  });
}

export function useGameItemList(params: GameItemSearchParams) {
  return useQuery({
    queryKey: gameItemKeys.list(params),
    queryFn: () => gameItemApi.getList(params),
    retry: false,
  });
}

export function useGameItemDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: gameItemKeys.detail(id!),
    queryFn: () => gameItemApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCreateGameItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: GameItemCreateDto }) =>
      gameItemApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameItemKeys.lists() });
      toast.success('Game item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create game item');
    },
  });
}

export function useUpdateGameItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: GameItemUpdateDto;
    }) => gameItemApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gameItemKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: gameItemKeys.detail(variables.id),
      });
      toast.success('Game item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update game item');
    },
  });
}

export function useDeleteGameItem() {
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
    }) => gameItemApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameItemKeys.lists() });
      toast.success('Game item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete game item');
    },
  });
}
