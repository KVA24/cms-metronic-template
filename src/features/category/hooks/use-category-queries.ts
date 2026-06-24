import {
  categoryApi,
  CategoryCreateDto,
  CategorySearchParams,
  CategoryUpdateDto,
} from '@/features/category/api/categoryApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => ['categories', 'list'] as const,
  list: (params: CategorySearchParams) => {
    const key: (string | number)[] = ['categories', 'list'];
    if (params.page !== undefined) {
      key.push('page');
      key.push(params.page);
    }
    if (params.size !== undefined) {
      key.push('size');
      key.push(params.size);
    }
    if (params.name) {
      key.push('name');
      key.push(params.name);
    }
    if (params.status) {
      key.push('status');
      key.push(params.status);
    }
    return key;
  },
  details: () => ['categories', 'detail'] as const,
  detail: (id: string) => ['categories', 'detail', id] as const,
};

/**
 * Hook to fetch category list with pagination and filters
 */
export function useCategoryAll() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => categoryApi.getListAll(),
    retry: false,
  });
}

/**
 * Hook to fetch category list with pagination and filters
 */
export function useCategoryList(params: CategorySearchParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoryApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch category detail by ID
 */
export function useCategoryDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: categoryKeys.detail(id!),
    queryFn: () => categoryApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}

/**
 * Hook to create category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: CategoryCreateDto;
    }) => {
      return categoryApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

/**
 * Hook to update category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CategoryUpdateDto;
    }) => {
      return categoryApi.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

/**
 * Hook to delete category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      otpCode
    }: {
      id: string;
      otpCode: string;
    }) => {
      return categoryApi.delete(id, { otpCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}
