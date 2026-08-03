import {
  getPortalForPath,
  getPortalLoginPath,
} from '@/shared/auth/portal-routing';
import {
  useAuthSession,
  useAuthStatus,
  useAuthUser,
} from '@/shared/stores/auth-store';
import { ScreenLoader } from '@/shared/ui/molecules/screen-loader';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { canAccessPortalRoute } from '../routing/portal-route-permissions';

/**
 * Component to protect routes that require authentication.
 * Checks auth state from Zustand store.
 * If user is not authenticated, redirects to the login page.
 */
export const RequireAuth = () => {
  const user = useAuthUser();
  const session = useAuthSession();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStatus();
  const location = useLocation();

  // Show screen loader only if:
  // 1. Not initialized yet (first load) AND
  // 2. Currently loading AND
  // 3. No user data yet
  if (!isInitialized && isLoading && !user) {
    return <ScreenLoader />;
  }

  // If no in-memory session or user, redirect to login
  if (!isAuthenticated || !user || !session) {
    const requestedPortal = getPortalForPath(location.pathname) ?? 'ADMIN';
    return (
      <Navigate
        to={getPortalLoginPath(
          requestedPortal,
          `${location.pathname}${location.search}`,
        )}
        replace
      />
    );
  }

  const requestedPortal = getPortalForPath(location.pathname);
  if (requestedPortal && session.portalType !== requestedPortal) {
    return (
      <Navigate to={`/${session.portalType.toLowerCase()}/dashboard`} replace />
    );
  }

  if (!canAccessPortalRoute(location.pathname, session.permissions)) {
    return <Navigate to="/error/403" replace />;
  }

  // If authenticated, render child routes
  return <Outlet />;
};
