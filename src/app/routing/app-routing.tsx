import { useEffect, useState } from 'react';
import { useRouteLoading } from '@/shared/hooks/use-route-loading';
import { useLocation } from 'react-router-dom';
import { AppRoutingSetup } from './app-routing-setup';

export function AppRouting() {
  // Track route loading
  useRouteLoading();

  const [previousLocation, setPreviousLocation] = useState('');
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    // Track route changes for scroll behavior
    const timer = setTimeout(() => {
      setPreviousLocation(path);
      if (path === previousLocation) {
        setPreviousLocation('');
      }
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [previousLocation]);

  return <AppRoutingSetup />;
}
