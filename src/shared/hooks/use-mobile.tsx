import * as React from 'react';

const MOBILE_BREAKPOINT = 992;

const getIsMobile = () =>
  typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;

export function useIsMobile() {
  return React.useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    getIsMobile,
    () => false,
  );
}
