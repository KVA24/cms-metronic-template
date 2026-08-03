import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { mockAuthService } from '../auth';
import type { AuthLoginInput, AuthSession, AuthUser } from '../contracts';

interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (input: AuthLoginInput) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      isInitialized: false,

      login: async (input) => {
        set({ isLoading: true, error: null });

        try {
          const session = await mockAuthService.login(input);
          set({
            session,
            user: session.user,
            isAuthenticated: true,
            isInitialized: true,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'AUTH_UNKNOWN_ERROR';
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            error: message,
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      },

      verify: async () => {
        set((state) => ({
          isAuthenticated: Boolean(state.session),
          user: state.session?.user ?? null,
          isInitialized: true,
        }));
      },

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    { name: 'AuthStore' },
  ),
);

export const useAuthSession = () => useAuthStore((state) => state.session);
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

export async function initializeAuth(): Promise<void> {
  const state = useAuthStore.getState();
  if (state.isInitialized) return;

  useAuthStore.setState({
    session: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
  });
}
