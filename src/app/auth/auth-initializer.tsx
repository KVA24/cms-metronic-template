import { useEffect, useRef } from 'react';
import { initializeAuth } from '@/shared/stores/auth-store';

/**
 * Component để initialize auth store khi app khởi động
 * Thay thế cho AuthProvider
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    // Initialize auth state
    initializeAuth().then();
  }, []);

  return <>{children}</>;
}
