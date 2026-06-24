import { useMemo } from 'react';
import { useAuthUser } from '@/shared/stores/auth-store';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  Permission,
  UserRole,
} from './roles';

/**
 * Hook to get current user's role
 */
export function useUserRole(): UserRole | null {
  const user = useAuthUser();
  if (!user?.roles) return null;
  const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
  return (role?.roleCode as UserRole) ?? null;
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const role = useUserRole();
  return useMemo(() => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role, permission]);
}

/**
 * Hook to check if user has any of the permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const role = useUserRole();
  return useMemo(() => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  }, [role, permissions]);
}

/**
 * Hook to check if user has all of the permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const role = useUserRole();
  return useMemo(() => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  }, [role, permissions]);
}
