import {
  currencyRateApi,
  CurrencyRateCreateDto,
  CurrencyRateSearchParams,
  CurrencyRateUpdateDto,
} from '@/features/currency-rate/api/currencyRateApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const currencyRateKeys = {
  all: ['currencyRates'] as const,
  lists: () => ['currencyRates', 'list'] as const,
  list: (params: CurrencyRateSearchParams) => {
    const key: (string | number)[] = ['currencyRates', 'list'];
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
    if (params.baseCurrencyId) {
      key.push('baseCurrencyId');
      key.push(params.baseCurrencyId);
    }
    if (params.targetCurrencyId) {
      key.push('targetCurrencyId');
      key.push(params.targetCurrencyId);
    }
    if (params.roundingRule) {
      key.push('roundingRule');
      key.push(params.roundingRule);
    }
    return key;
  },
  details: () => ['currencyRates', 'detail'] as const,
  detail: (id: string) => ['currencyRates', 'detail', id] as const,
  allActive: ['partners', 'all', 'active'] as const,
};

/**
 * Hook to fetch currency rate list with search filters (no pagination)
 */
export function useCurrencyRateList(params: CurrencyRateSearchParams) {
  return useQuery({
    queryKey: currencyRateKeys.list(params),
    queryFn: () => currencyRateApi.getList(params),
    retry: false,
  });
}

export function useAllActiveCurrencyRate() {
  return useQuery({
    queryKey: currencyRateKeys.allActive,
    queryFn: async () => currencyRateApi.getAllActive(),
    retry: false,
  });
}

/**
 * Hook to fetch currency rate detail by ID
 */
export function useCurrencyRateDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: currencyRateKeys.detail(id!),
    queryFn: () => currencyRateApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Hook to create new currency rate
 */
export function useCreateCurrencyRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: CurrencyRateCreateDto;
    }) => currencyRateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyRateKeys.lists() });
      toast.success('Currency rate has been successfully saved.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create currency rate');
    },
  });
}

/**
 * Hook to update existing currency rate
 */
export function useUpdateCurrencyRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CurrencyRateUpdateDto;
    }) => currencyRateApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: currencyRateKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: currencyRateKeys.detail(variables.id),
      });
      toast.success('Currency rate updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update currency rate');
    },
  });
}

/**
 * Hook to delete currency rate
 */
export function useDeleteCurrencyRate() {
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
    }) => currencyRateApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyRateKeys.lists() });
      toast.success('Currency rate deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete currency rate');
    },
  });
}
