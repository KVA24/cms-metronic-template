import { ReactNode } from 'react';
import { useHasAnyPermission, useUserRole } from '@/shared/lib/rbac/hooks';
import { Permission, UserRole } from '@/shared/lib/rbac/roles';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component to conditionally render children based on permissions or roles
 * Use this to hide UI elements that user doesn't have access to
 */
export function PermissionGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
}: PermissionGuardProps) {
  const userRole = useUserRole();
  const hasPermission = useHasAnyPermission(requiredPermissions);

  // Check role requirement
  if (requiredRoles.length > 0 && userRole) {
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement
  if (requiredPermissions.length > 0 && !hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
