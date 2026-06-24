import { storage } from '@/shared/lib/storage';
import { useAuthStatus, useAuthUser } from '@/shared/stores/auth-store';
import { ScreenLoader } from '@/shared/ui/molecules/screen-loader';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Component to protect routes that require authentication.
 * Checks auth state from Zustand store.
 * If user is not authenticated, redirects to the login page.
 */
export const RequireAuth = () => {
  const user = useAuthUser();
  const { isLoading, isInitialized } = useAuthStatus();
  const location = useLocation();

  // Show screen loader only if:
  // 1. Not initialized yet (first load) AND
  // 2. Currently loading AND
  // 3. No user data yet
  if (!isInitialized && isLoading && !user) {
    return <ScreenLoader />;
  }

  const token = storage.getItem('access_token');

  // If no token or no user, redirect to login
  if (!token || !user) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // If authenticated, render child routes
  return <Outlet />;
};
