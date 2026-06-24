import {
  GameTransactionParams,
  gameTransactionsApi,
} from '@/features/game-transactions/api/gameTransactionsApi';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const gameTransactionsKeys = {
  all: ['game-transactions'] as const,
  list: (params?: GameTransactionParams) =>
    ['game-transactions', 'list', params] as const,
};

export function useGameTransactionsList(params?: GameTransactionParams) {
  return useQuery({
    queryKey: gameTransactionsKeys.list(params),
    queryFn: () => gameTransactionsApi.getList(params),
    placeholderData: keepPreviousData,
  });
}
