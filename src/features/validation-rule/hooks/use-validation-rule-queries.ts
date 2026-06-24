import {
  validationRuleApi,
  ValidationRuleCreateDto,
  ValidationRuleSearchParams,
  ValidationRuleUpdateDto,
} from '@/features/validation-rule/api/validationRuleApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const validationRuleKeys = {
  all: ['validationRules'] as const,
  lists: () => ['validationRules', 'list'] as const,
  list: (params: ValidationRuleSearchParams) => {
    const key: (string | number)[] = ['validationRules', 'list'];
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
    return key;
  },
  details: () => ['validationRules', 'detail'] as const,
  detail: (id: string) => ['validationRules', 'detail', id] as const,
};

/**
 * Hook to fetch validation rule list with pagination and filters
 */
export function useValidationRuleList(params: ValidationRuleSearchParams) {
  return useQuery({
    queryKey: validationRuleKeys.list(params),
    queryFn: () => validationRuleApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch all validation rules without pagination
 */
export function useValidationRuleListAll() {
  return useQuery({
    queryKey: validationRuleKeys.all,
    queryFn: () => validationRuleApi.getListAll(),
    retry: false,
  });
}

/**
 * Hook to fetch validation rule detail by ID
 */
export function useValidationRuleDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: validationRuleKeys.detail(id!),
    queryFn: () => validationRuleApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

/**
 * Hook to create new validation rule
 */
export function useCreateValidationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: ValidationRuleCreateDto;
    }) => validationRuleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: validationRuleKeys.lists() });
      toast.success('Validation rule created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create validation rule');
    },
  });
}

/**
 * Hook to update existing validation rule
 */
export function useUpdateValidationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ValidationRuleUpdateDto;
    }) => validationRuleApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: validationRuleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: validationRuleKeys.detail(variables.id),
      });
      toast.success('Validation rule updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update validation rule');
    },
  });
}

/**
 * Hook to delete validation rule
 */
export function useDeleteValidationRule() {
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
    }) => validationRuleApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: validationRuleKeys.lists() });
      toast.success('Validation rule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete validation rule');
    },
  });
}
