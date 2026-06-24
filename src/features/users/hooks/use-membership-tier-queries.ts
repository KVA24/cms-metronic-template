import { membershipTierApi } from '@/features/users/api/membershipTierApi';
import { useQuery } from '@tanstack/react-query';

export const membershipTierKeys = {
  userTier: (customerId: string) =>
    ['membership', 'tier', 'user', customerId] as const,
  tierList: ['membership', 'tier', 'list'] as const,
};

export function useUserMembershipTier(customerId: string | undefined) {
  return useQuery({
    queryKey: membershipTierKeys.userTier(customerId!),
    queryFn: () => membershipTierApi.getUserTier(customerId!),
    enabled: !!customerId,
    retry: false,
  });
}

export function useTierList() {
  return useQuery({
    queryKey: membershipTierKeys.tierList,
    queryFn: () => membershipTierApi.getTierList(),
    retry: false,
  });
}
