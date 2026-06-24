import { useEffect } from 'react';
import { useLoadingBar } from 'react-top-loading-bar';
import { axiosInstance } from '@/shared/lib/api';

/**
 * Hook to track all API requests and show loading bar
 * - Starts loading bar when any API request begins
 * - Completes loading bar when all API requests finish
 */
export function useApiLoading() {
  const { start, complete } = useLoadingBar({
    color: 'var(--color-primary)',
    shadow: false,
    waitingTime: 400,
    transitionTime: 200,
    height: 2,
  });

  // Track API requests
  useEffect(() => {
    let activeRequests = 0;

    // Request interceptor - increment counter and start loading
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        activeRequests++;
        
        // Start loading bar on first request
        if (activeRequests === 1) {
          start();
        }
        
        return config;
      },
      (error) => {
        activeRequests--;
        
        // Complete loading bar if no more active requests
        if (activeRequests === 0) {
          complete();
        }
        
        return Promise.reject(error);
      },
    );

    // Response interceptor - decrement counter and complete loading
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => {
        activeRequests--;
        
        // Complete loading bar when all requests finish
        if (activeRequests === 0) {
          complete();
        }
        
        return response;
      },
      (error) => {
        activeRequests--;
        
        // Complete loading bar when all requests finish (even on error)
        if (activeRequests === 0) {
          complete();
        }
        
        return Promise.reject(error);
      },
    );

    // Cleanup interceptors on unmount
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [start, complete]);
}
