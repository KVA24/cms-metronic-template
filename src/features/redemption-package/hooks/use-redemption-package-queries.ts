import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  redemptionPackageApi,
  RedemptionPackageCreateDto,
  RedemptionPackageUpdateDto,
  RedemptionPackageSearchParams,
  ItemDeleteParams,
} from '@/features/redemption-package/api/redemptionPackageApi';

// Query keys
export const redemptionPackageKeys = {
  all: ['redemption-packages'] as const,
  lists: () => ['redemption-packages', 'list'] as const,
  list: (params: RedemptionPackageSearchParams) => {
    const key: (string | number)[] = ['redemption-packages', 'list'];
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
    if (params.status) {
      key.push('status');
      key.push(params.status);
    }
    return key;
  },
  allCatalogs: () => ['redemption-packages', 'all-catalogs'] as const,
  details: () => ['redemption-packages', 'detail'] as const,
  detail: (id: string) => ['redemption-packages', 'detail', id] as const,
  inventory: (rewardCatalogId: string, page?: number, size?: number) => {
    const key: (string | number)[] = ['redemption-packages', 'inventory', rewardCatalogId];
    if (page !== undefined) {
      key.push('page');
      key.push(page);
    }
    if (size !== undefined) {
      key.push('size');
      key.push(size);
    }
    return key;
  },
};

/**
 * Hook to fetch redemption package list with search filters
 */
export function useRedemptionPackageList(params: RedemptionPackageSearchParams) {
  return useQuery({
    queryKey: redemptionPackageKeys.list(params),
    queryFn: () => redemptionPackageApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch all reward catalogs (for dropdowns)
 */
export function useAllRewardCatalogs() {
  return useQuery({
    queryKey: redemptionPackageKeys.allCatalogs(),
    queryFn: () => redemptionPackageApi.getAll(),
    retry: false,
  });
}

/**
 * Hook to fetch redemption package detail by ID
 */
export function useRedemptionPackageDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: redemptionPackageKeys.detail(id),
    queryFn: () => redemptionPackageApi.getDetail(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}

/**
 * Hook to create a new redemption package
 */
export function useCreateRedemptionPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RedemptionPackageCreateDto) =>
      redemptionPackageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: redemptionPackageKeys.lists() });
      toast.success('Redemption package created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Create failed');
    }
  });
}

/**
 * Hook to update an existing redemption package
 */
export function useUpdateRedemptionPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RedemptionPackageUpdateDto }) =>
      redemptionPackageApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: redemptionPackageKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: redemptionPackageKeys.detail(variables.id),
      });
      toast.success('Redemption package updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Edit failed');
    }
  });
}

/**
 * Hook to delete a redemption package
 */
export function useDeleteRedemptionPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: ItemDeleteParams }) =>
      redemptionPackageApi.delete(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: redemptionPackageKeys.lists() });
      toast.success('Redemption package deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Delete failed');
    }
  });
}

/**
 * Hook to fetch reward code inventory
 */
export function useRewardCodeInventory(
  rewardCatalogId: string,
  params?: { page?: number; size?: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: redemptionPackageKeys.inventory(
      rewardCatalogId,
      params?.page,
      params?.size,
    ),
    queryFn: () => redemptionPackageApi.getInventory(rewardCatalogId, params),
    enabled: options?.enabled !== undefined ? options.enabled : !!rewardCatalogId,
    retry: false,
  });
}

/**
 * Hook to import reward codes
 * Handles error file download on validation failures
 */
export function useImportRewardCodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rewardCatalogId, file }: { rewardCatalogId: string; file: File }) =>
      redemptionPackageApi.importCodes(rewardCatalogId, file),
    onSuccess: (result, variables) => {
      // If there's an error file, download it and show error toast
      if (result.errorFile) {
        // Download error file
        const url = window.URL.createObjectURL(result.errorFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = `import-errors-${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show error toast with message
        toast.error(result.errorMessage || 'Import completed with errors. Check the downloaded file.');
      } else {
        // Success case
        toast.success('Codes imported successfully');
      }
      queryClient.invalidateQueries({
        queryKey: redemptionPackageKeys.inventory(variables.rewardCatalogId),
      });
    },
    onError: (error, variables) => {
      queryClient.invalidateQueries({
        queryKey: redemptionPackageKeys.inventory(variables.rewardCatalogId),
      });
      toast.error(error.message || 'Import failed');
    }
  });
}

export default redemptionPackageKeys;
