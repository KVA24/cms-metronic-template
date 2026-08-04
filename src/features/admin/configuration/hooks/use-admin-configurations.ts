import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminConfigurationService } from '../api/admin-configuration-service';
import type {
  AdminConfigurationCreateInput,
  AdminConfigurationQuery,
  AdminConfigurationUpdateInput,
} from '../model/admin-configuration';

export const adminConfigurationKeys = {
  all: ['admin-configurations'] as const,
  detail: (id: number, roleCode: AdminRoleCode) =>
    [...adminConfigurationKeys.all, 'detail', id, roleCode] as const,
};

export function useAdminConfigurationDetail(
  id: number | null,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminConfigurationKeys.detail(id ?? 0, roleCode),
    queryFn: () => adminConfigurationService.getDetail(id!, roleCode),
    enabled: id !== null,
    retry: false,
  });
}

export function useAdminConfigurations(
  query: AdminConfigurationQuery,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: [...adminConfigurationKeys.all, query, roleCode],
    queryFn: () => adminConfigurationService.list(query, roleCode),
    retry: false,
  });
}

export function useCreateAdminConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
      actorId,
    }: {
      input: AdminConfigurationCreateInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminConfigurationService.create(input, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminConfigurationKeys.all }),
  });
}

export function useUpdateAdminConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      expectedVersion,
      roleCode,
      actorId,
    }: {
      id: number;
      input: AdminConfigurationUpdateInput;
      expectedVersion: number;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminConfigurationService.update(
        id,
        input,
        expectedVersion,
        roleCode,
        actorId,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminConfigurationKeys.all }),
  });
}

export function useDeleteAdminConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      roleCode,
      actorId,
    }: {
      id: number;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminConfigurationService.remove(id, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminConfigurationKeys.all }),
  });
}
