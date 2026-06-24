import {
  partnerApi,
  PartnerCreateDto,
  PartnerListParams,
  PartnerUpdateDto,
} from '@/features/partners/api/partnerApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const partnerKeys = {
  all: ['partners'] as const,
  lists: () => ['partners', 'list'] as const,
  list: (params: PartnerListParams) => {
    const key: (string | number)[] = ['partners', 'list'];
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
    if (params.code) {
      key.push('code');
      key.push(params.code);
    }
    if (params.status) {
      key.push('status');
      key.push(params.status);
    }
    return key;
  },
  details: () => ['partners', 'detail'] as const,
  detail: (id: string) => ['partners', 'detail', id] as const,
  allActive: ['partners', 'all', 'active'] as const,
};

/**
 * Hook to fetch partner list with pagination and filters
 */
export function usePartnerList(params: PartnerListParams) {
  return useQuery({
    queryKey: partnerKeys.list(params),
    queryFn: () => partnerApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch partner detail by ID
 */
export function usePartnerDetail(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: partnerKeys.detail(id!),
    queryFn: () => partnerApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}

/**
 * Hook to create new partner
 */
export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: PartnerCreateDto }) =>
      partnerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: partnerKeys.allActive });
      toast.success('Partner created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create partner');
    },
  });
}

/**
 * Hook to update existing partner
 */
export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PartnerUpdateDto;
    }) => partnerApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: partnerKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: partnerKeys.allActive });
      toast.success('Partner updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update partner');
    },
  });
}

/**
 * Hook to delete partner
 */
export function useDeletePartner() {
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
    }) => partnerApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: partnerKeys.allActive });
      toast.success('Partner deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete partner');
    },
  });
}
