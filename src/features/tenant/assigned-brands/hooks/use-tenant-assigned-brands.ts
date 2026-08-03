import type { AuthSession } from '@/shared/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantAssignedBrandService } from '../api/tenant-assigned-brand-service';
import type { TenantAssignedBrandQuery } from '../model/tenant-assigned-brand';

export const tenantAssignedBrandKeys = {
  all: ['tenant-assigned-brands'] as const,
  list: (session: AuthSession | null, query: TenantAssignedBrandQuery) =>
    [...tenantAssignedBrandKeys.all, 'list', session?.user.id, query] as const,
  scope: (session: AuthSession | null, brandId: string) =>
    [
      ...tenantAssignedBrandKeys.all,
      'scope',
      session?.user.id,
      brandId,
    ] as const,
};

export function useTenantAssignedBrands(
  session: AuthSession | null,
  query: TenantAssignedBrandQuery,
) {
  return useQuery({
    queryKey: tenantAssignedBrandKeys.list(session, query),
    queryFn: () => tenantAssignedBrandService.list(session!, query),
    enabled: Boolean(session),
    retry: false,
  });
}

export function useTenantAssignedBrandScope(
  session: AuthSession | null,
  brandId: string,
) {
  return useQuery({
    queryKey: tenantAssignedBrandKeys.scope(session, brandId),
    queryFn: () => tenantAssignedBrandService.getScope(session!, brandId),
    enabled: Boolean(session && brandId),
    retry: false,
  });
}

export function useTenantAssignedBrandMutations(session: AuthSession | null) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: tenantAssignedBrandKeys.all });
  return {
    visibility: useMutation({
      mutationFn: (input: {
        brandId: string;
        value: boolean;
        expectedVersion: number;
      }) =>
        tenantAssignedBrandService.setBrandVisibility(
          session!,
          input.brandId,
          input.value,
          input.expectedVersion,
        ),
      onSuccess: refresh,
    }),
    hot: useMutation({
      mutationFn: (input: {
        brandId: string;
        value: boolean;
        expectedVersion: number;
      }) =>
        tenantAssignedBrandService.setHot(
          session!,
          input.brandId,
          input.value,
          input.expectedVersion,
        ),
      onSuccess: refresh,
    }),
    offerVisibility: useMutation({
      mutationFn: (input: {
        brandId: string;
        offerId: string;
        value: boolean;
        expectedVersion: number;
      }) =>
        tenantAssignedBrandService.setOfferVisibility(
          session!,
          input.brandId,
          input.offerId,
          input.value,
          input.expectedVersion,
        ),
      onSuccess: refresh,
    }),
  };
}
