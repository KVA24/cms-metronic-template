import {useAuthUser} from '@/shared/stores/auth-store';
import {UserRole} from './roles';

/**
 * Hook to get current user's role
 */
export function useUserRole(): UserRole | null {
  const user = useAuthUser();
  if (!user?.roles) return null;
  const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
  return (role?.roleCode as UserRole) ?? null;
}
