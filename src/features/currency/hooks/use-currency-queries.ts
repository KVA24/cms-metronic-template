import {
  currencyApi,
  CurrencyCreateDto,
  CurrencySearchParams,
  CurrencyUpdateDto,
} from '@/features/currency/api/currencyApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const currencyKeys = {
  all: ['currencies'] as const,
  lists: () => ['currencies', 'list'] as const,
  list: (params: CurrencySearchParams) => {
    const key: (string | number)[] = ['currencies', 'list'];
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
    if (params.name) {
      key.push('name');
      key.push(params.name);
    }
    if (params.sourceType) {
      key.push('sourceType');
      key.push(params.sourceType);
    }
    return key;
  },
  listAllPoints: () => ['currencies', 'listAllPoints'] as const,
  details: () => ['currencies', 'detail'] as const,
  detail: (id: string) => ['currencies', 'detail', id] as const,
};

/**
 * Hook to fetch currency list with search filters (no pagination)
 */
export function useCurrencyList(params: CurrencySearchParams) {
  return useQuery({
    queryKey: currencyKeys.list(params),
    queryFn: () => currencyApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch all currencies without pagination
 */
export function useCurrencyListAll(params?: CurrencySearchParams) {
  return useQuery({
    queryKey: currencyKeys.all,
    queryFn: () => currencyApi.getListAll(params),
    retry: false,
  });
}

/**
 * Hook to fetch all point currencies (isPoint=true)
 */
export function useCurrencyListAllPoints() {
  return useQuery({
    queryKey: currencyKeys.listAllPoints(),
    queryFn: () => currencyApi.getListAll({ isPoint: true }),
    retry: false,
  });
}

/**
 * Hook to fetch currency detail by ID
 */
export function useCurrencyDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: currencyKeys.detail(id!),
    queryFn: () => currencyApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Hook to create new currency
 */
export function useCreateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: CurrencyCreateDto }) =>
      currencyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      toast.success('Currency created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create currency');
    },
  });
}

/**
 * Hook to update existing currency
 */
export function useUpdateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CurrencyUpdateDto;
    }) => currencyApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: currencyKeys.detail(variables.id),
      });
      toast.success('Currency updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update currency');
    },
  });
}

/**
 * Hook to delete currency
 */
export function useDeleteCurrency() {
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
    }) => currencyApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      toast.success('Currency deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete currency');
    },
  });
}
