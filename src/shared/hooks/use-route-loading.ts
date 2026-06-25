import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoadingBar } from 'react-top-loading-bar';

/**
 * Hook to show loading bar on route changes
 * Must be used inside a Router component
 */
export function useRouteLoading() {
  const { start, complete } = useLoadingBar();
  const location = useLocation();

  useEffect(() => {
    start();

    const timer = setTimeout(() => {
      complete();
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-doctor/exhaustive-deps
  }, [location.pathname]);
}
