import { ReactNode } from 'react';
import { useUserRole } from '@/shared/lib/rbac/hooks';
import { UserRole } from '@/shared/lib/rbac/roles';

const EMPTY_ROLES: UserRole[] = [];

interface RoleGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component to conditionally render children based on user roles
 * Use this to hide UI elements that user doesn't have access to
 */
function RoleGuard({
  children,
  requiredRoles = EMPTY_ROLES,
  fallback = null,
}: RoleGuardProps) {
  const userRole = useUserRole();

  // Check role requirement
  if (requiredRoles.length > 0 && userRole) {
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

export const PermissionGuard = RoleGuard;
