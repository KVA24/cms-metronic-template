import {
  metadataApi,
  MetadataCreateDto,
  MetadataSearchParams,
  MetadataUpdateDto,
} from '@/features/metadata/api/metadataApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Query keys
export const metadataKeys = {
  all: ['metadata'] as const,
  lists: () => ['metadata', 'list'] as const,
  list: (params: MetadataSearchParams) => {
    const key: (string | number | boolean)[] = ['metadata', 'list'];
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
    if (params.level !== undefined) {
      key.push('level');
      key.push(params.level);
    }
    return key;
  },
  listLevelTwo: (params: MetadataSearchParams) => {
    const key: (string | number | boolean)[] = ['metadata', 'listLevelTwo'];
    if (params.level !== undefined) {
      key.push('level');
      key.push(params.level);
    }
    return key;
  },
  details: () => ['metadata', 'detail'] as const,
  detail: (id: string) => ['metadata', 'detail', id] as const,
};

/**
 * Hook to fetch metadata list with pagination and filters
 */
export function useMetadataList(params: MetadataSearchParams) {
  return useQuery({
    queryKey: metadataKeys.list(params),
    queryFn: () => metadataApi.getList(params),
    retry: false,
  });
}

/**
 * Hook to fetch metadata level two (nested schemas) for OBJECT constraint
 */
export function useMetadataListLevelTwo() {
  return useQuery({
    queryKey: metadataKeys.listLevelTwo({ level: 2 }),
    queryFn: () => metadataApi.getListLevelTwo({ level: 2 }),
    retry: false,
  });
}

/**
 * Hook to fetch metadata detail by ID
 */
export function useMetadataDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: metadataKeys.detail(id!),
    queryFn: () => metadataApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}

/**
 * Hook to create new metadata schema
 */
export function useCreateMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: { data: MetadataCreateDto }) =>
      metadataApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metadataKeys.lists() });
      toast.success('Metadata created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create metadata');
    },
  });
}

/**
 * Hook to update existing metadata schema
 */
export function useUpdateMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: MetadataUpdateDto;
    }) => metadataApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: metadataKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: metadataKeys.detail(variables.id),
      });
      toast.success('Metadata updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update metadata');
    },
  });
}

/**
 * Hook to delete metadata schema
 */
export function useDeleteMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      otpCode,
      sign,
    }: {
      id: string;
      otpCode?: string;
      sign?: string;
    }) => metadataApi.delete(id, { otpCode, sign }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metadataKeys.lists() });
      toast.success('Metadata deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete metadata');
    },
  });
}
