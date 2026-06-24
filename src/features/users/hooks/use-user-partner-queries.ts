import { useQuery } from '@tanstack/react-query';
import { userPartnerApi } from '../api/userPartnerApi';

// Query keys
export const userPartnerKeys = {
  all: ['user-partners'] as const,
  allActive: ['user-partners', 'all', 'active'] as const,
  details: () => ['user-partners', 'detail'] as const,
  detail: (id: string) => ['user-partners', 'detail', id] as const,
};

/**
 * Hook to fetch all active partners for user feature
 */
export function useUserAllActivePartners() {
  return useQuery({
    queryKey: userPartnerKeys.allActive,
    queryFn: () => userPartnerApi.getAllActive(),
    retry: false,
  });
}

/**
 * Hook to fetch partner detail by ID for user feature
 */
export function useUserPartnerDetail(
  id?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: userPartnerKeys.detail(id!),
    queryFn: () => userPartnerApi.getDetail(id!),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: false,
  });
}
