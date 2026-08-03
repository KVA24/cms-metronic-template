import type { AuthSession } from '@/shared/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantProfileService } from '../api/tenant-profile-service';
import type {
  TenantProfilePasswordInput,
  TenantProfileUpdateInput,
} from '../model/tenant-profile';

export const tenantProfileKeys = {
  all: ['tenant-profile'] as const,
  current: (session: AuthSession | null) =>
    [...tenantProfileKeys.all, session?.user.id] as const,
};

export function useTenantProfile(session: AuthSession | null) {
  return useQuery({
    queryKey: tenantProfileKeys.current(session),
    queryFn: () => tenantProfileService.get(session!),
    enabled: Boolean(session),
    retry: false,
  });
}

export function useTenantProfileMutations(session: AuthSession | null) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: tenantProfileKeys.all });
  const update = useMutation({
    mutationFn: (input: TenantProfileUpdateInput) =>
      tenantProfileService.update(session!, input),
    onSuccess: refresh,
  });
  const changePassword = useMutation({
    mutationFn: (input: TenantProfilePasswordInput) =>
      tenantProfileService.changePassword(session!, input),
    onSuccess: refresh,
  });
  return { update, changePassword };
}
