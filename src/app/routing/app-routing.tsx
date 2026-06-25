import { useEffect, useRef } from 'react';
import { useRouteLoading } from '@/shared/hooks/use-route-loading';
import { useLocation } from 'react-router-dom';
import { AppRoutingSetup } from './app-routing-setup';

export function AppRouting() {
  useRouteLoading();

  const previousLocationRef = useRef('');
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    const timer = setTimeout(() => {
      const prev = previousLocationRef.current;
      previousLocationRef.current = path;
      if (path !== prev && !CSS.escape(window.location.hash)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [location, path]);

  return <AppRoutingSetup />;
}
