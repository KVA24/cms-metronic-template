import logger from '@/shared/lib/logger';
import { storage } from '@/shared/lib/storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { authApi, LoginCredentials, User } from '@/app/auth/api/authApi';

interface AuthState {
  // Data
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean; // Flag để track đã initialize chưa

  // Actions
  login: (credentials: LoginCredentials, sign?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Internal
  _setUser: (user: User | null) => void;
  _setLoading: (loading: boolean) => void;
  _setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        isInitialized: false,

        // Set user (internal)
        _setUser: (user: User | null) => {
          set({
            user,
            isAuthenticated: !!user && !!storage.getItem('access_token'),
          });
        },

        // Set loading (internal)
        _setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Set initialized (internal)
        _setInitialized: (initialized: boolean) => {
          set({ isInitialized: initialized });
        },

        // Set error
        setError: (error: string | null) => {
          set({ error });
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        /**
         * Verify token by calling profile API
         */
        verify: async () => {
          const token = storage.getItem('access_token');

          if (!token) {
            get()._setUser(null);
            get()._setLoading(false);
            return;
          }

          try {
            logger.log('🔍 Verifying token with API...');
            const response = await authApi.getProfile();

            logger.log('Verifying profile...', response);

            get()._setUser(response);
            storage.setJSON('user', response);
          } catch (error) {
            logger.error('❌ Token verification failed:', error);
            // Don't clear tokens here - let the interceptor handle refresh
            // Only clear if there's no refresh token
            const refreshToken = storage.getItem('refresh_token');
            if (!refreshToken) {
              storage.removeItem('access_token');
              storage.removeItem('user');
              get()._setUser(null);
            }
            // If there's a refresh token, the interceptor will handle it
          } finally {
            get()._setLoading(false);
          }
        },

        /**
         * Login user
         */
        login: async (credentials: LoginCredentials): Promise<void> => {
          set({ isLoading: true, error: null });

          try {
            logger.log('🔐 Logging in with credentials:', credentials);
            const response = await authApi.login(credentials);

            logger.log('📦 Login response:', response);

            // Validate response
            if (!response.user || !response.user.id) {
              throw new Error('Invalid response: missing user data');
            }

            if (!response.accessToken) {
              throw new Error('Invalid response: missing access token');
            }

            // Save token and user to storage
            storage.setItem('access_token', response.accessToken);
            if (response.refreshToken) {
              storage.setItem('refresh_token', response.refreshToken);
            }
            storage.setJSON('user', response.user);

            // Update state
            get()._setUser(response.user);
            get()._setInitialized(true); // Đánh dấu đã initialized sau khi login
            logger.log('✅ Login successful:', response.user);
          } catch (error) {
            logger.error('❌ Login failed:', error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'An unexpected error occurred. Please try again.';
            set({ error: errorMessage });
            throw error;
          } finally {
            get()._setLoading(false);
          }
        },

        /**
         * Logout user
         */
        logout: async (): Promise<void> => {
          try {
            logger.log('👋 Logging out...');
            await authApi.logout();
          } catch (error) {
            logger.error('⚠️ Logout API error:', error);
          } finally {
            // Always clear local data even if API call fails
            get()._setUser(null);
            get()._setInitialized(false); // Reset initialized state
            storage.removeItem('access_token');
            storage.removeItem('refresh_token');
            storage.removeItem('user');

            // Clear saved credentials on logout
            // storage.removeItem('rm_creds');

            logger.log('✅ Logged out successfully');
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          // Only persist user data, not loading/error states
          user: state.user,
        }),
      },
    ),
    {
      name: 'AuthStore',
    },
  ),
);

// Custom selectors for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthStatus = () =>
  useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
    })),
  );

export const useAuthActions = () =>
  useAuthStore(
    useShallow((state) => ({
      login: state.login,
      logout: state.logout,
      verify: state.verify,
      setError: state.setError,
      clearError: state.clearError,
    })),
  );

/**
 * Initialize auth store on app startup
 * Call this in your app root component
 */
// Use WeakMap to track initialization per store instance
const initPromises = new WeakMap<typeof useAuthStore, Promise<void>>();

export const initializeAuth = async () => {
  const store = useAuthStore;

  // Check if already initializing
  const existingPromise = initPromises.get(store);
  if (existingPromise) {
    return existingPromise;
  }

  const storeState = store.getState();

  // Nếu đã initialized rồi thì không làm gì nữa
  if (storeState.isInitialized) {
    logger.log('ℹ️ Auth already initialized, skipping...');
    return;
  }

  const promise = (async () => {
    try {
      logger.log('🚀 Initializing auth...');
      const token = storage.getItem('access_token');
      const savedUser = storage.getJSON('user');

      // Nếu có token và user trong storage
      if (token && savedUser) {
        try {
          // Parse và restore user state ngay lập tức để tránh flash
          storeState._setUser(savedUser as User);
          logger.log('📦 Restored user from storage:', savedUser);

          // Sau đó verify token với API để đảm bảo vẫn còn valid
          await storeState.verify();
        } catch (error) {
          logger.error('💥 Initial auth verification failed:', error);
          // Nếu verify thất bại, clear state
          storeState._setUser(null);
          storage.removeItem('access_token');
          storage.removeItem('refresh_token');
          storage.removeItem('user');
          storeState._setLoading(false);
        }
      } else {
        // Không có token hoặc user, set loading = false
        logger.log('ℹ️ No stored auth found');
        storeState._setLoading(false);
      }

      // Đánh dấu đã initialized
      storeState._setInitialized(true);
    } finally {
      initPromises.delete(store);
    }
  })();

  initPromises.set(store, promise);
  return promise;
};
