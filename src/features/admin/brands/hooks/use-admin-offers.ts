import type { ContentLocale } from '@/shared/contracts';
import type { AdminRoleCode } from '@/shared/permissions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminOfferService } from '../api/admin-offer-service';
import type { AdminOfferInput, AdminOfferQuery } from '../model/admin-offer';
import { adminBrandKeys } from './use-admin-brands';

export const adminOfferKeys = {
  all: (brandId: string) =>
    [...adminBrandKeys.detail(brandId), 'offers'] as const,
  list: (
    brandId: string,
    query: AdminOfferQuery,
    roleCode: AdminRoleCode,
    locale: ContentLocale,
  ) =>
    [...adminOfferKeys.all(brandId), 'list', query, roleCode, locale] as const,
  detail: (brandId: string, offerId: string) =>
    [...adminOfferKeys.all(brandId), 'detail', offerId] as const,
};

export function useAdminOffers(
  brandId: string | undefined,
  query: AdminOfferQuery,
  roleCode: AdminRoleCode,
  locale: ContentLocale,
) {
  return useQuery({
    queryKey: adminOfferKeys.list(brandId ?? '', query, roleCode, locale),
    queryFn: () =>
      adminOfferService.listOffers(brandId!, query, roleCode, locale),
    enabled: Boolean(brandId),
    retry: false,
  });
}

export function useAdminOffer(
  brandId: string | undefined,
  offerId: string | undefined,
  roleCode: AdminRoleCode,
) {
  return useQuery({
    queryKey: adminOfferKeys.detail(brandId ?? '', offerId ?? ''),
    queryFn: () => adminOfferService.getOffer(brandId!, offerId!, roleCode),
    enabled: Boolean(brandId && offerId),
    retry: false,
  });
}

export function useCreateAdminOffer(brandId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      roleCode,
      actorId,
    }: {
      input: AdminOfferInput;
      roleCode: AdminRoleCode;
      actorId: string;
    }) => adminOfferService.createOffer(brandId, input, roleCode, actorId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOfferKeys.all(brandId) }),
  });
}

export function useUpdateAdminOffer(brandId: string, offerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      expectedVersion,
      roleCode,
      actorId,
    }: {
      input: AdminOfferInput;
      expectedVersion: number;
      roleCode: AdminRoleCode;
      actorId: string;
    }) =>
      adminOfferService.updateOffer(
        brandId,
        offerId,
        input,
        expectedVersion,
        roleCode,
        actorId,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOfferKeys.all(brandId) }),
  });
}
