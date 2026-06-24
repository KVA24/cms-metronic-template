import { useUserRole } from '@/shared/lib/rbac/hooks';
import { UserRole } from '@/shared/lib/rbac/roles';
import { useAuthStatus } from '@/shared/stores/auth-store';
import { SuspenseLoading } from '@/shared/ui/molecules/suspense-loading';
import { Navigate, Outlet } from 'react-router-dom';

const EMPTY_ROLES: UserRole[] = [];

interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * Component to protect routes based on roles
 * If user doesn't have required roles, redirects to 403 Forbidden page
 */
export function ProtectedRoute({
  requiredRoles = EMPTY_ROLES,
  redirectTo = '/error/403',
}: ProtectedRouteProps) {
  const userRole = useUserRole();
  const { isLoading, isInitialized } = useAuthStatus();

  // Wait until auth is fully initialized before evaluating roles
  if (isLoading || !isInitialized) {
    return <SuspenseLoading />;
  }

  // Check role requirement
  if (requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      // Redirect to 403 Forbidden - route exists but user lacks required role
      return <Navigate to={redirectTo} replace />;
    }
  }

  // If all checks pass, render child routes
  return <Outlet />;
}
