import { useMemo } from 'react';
import { useAuthUser } from '@/shared/stores/auth-store';
import { getUserRoles, UserRole } from './roles';

/**
 * Hook to get all recognized roles assigned to the current user.
 */
export function useUserRoles(): UserRole[] {
  const user = useAuthUser();

  return useMemo(() => getUserRoles(user?.roles), [user?.roles]);
}
