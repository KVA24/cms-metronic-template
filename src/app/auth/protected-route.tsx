import { useHasAnyPermission, useUserRole } from '@/shared/lib/rbac/hooks';
import { Permission, UserRole } from '@/shared/lib/rbac/roles';
import { useAuthStatus } from '@/shared/stores/auth-store';
import { SuspenseLoading } from '@/shared/ui/molecules/suspense-loading';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * Component to protect routes based on permissions or roles
 * If user doesn't have required permissions/roles, redirects to 403 Forbidden page
 */
export function ProtectedRoute({
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/error/403',
}: ProtectedRouteProps) {
  const userRole = useUserRole();
  const hasPermission = useHasAnyPermission(requiredPermissions);
  const { isLoading, isInitialized } = useAuthStatus();

  // Wait until auth is fully initialized before evaluating roles/permissions
  if (isLoading || !isInitialized) {
    return <SuspenseLoading />;
  }

  // Check role requirement
  if (requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      // Redirect to 403 Forbidden - route exists but user lacks permission
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check permission requirement
  if (requiredPermissions.length > 0 && !hasPermission) {
    // Redirect to 403 Forbidden - route exists but user lacks permission
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, render child routes
  return <Outlet />;
}
