import { useEffect, useState } from 'react';
import logger from '@/shared/lib/logger';
import { useAuthActions } from '@/shared/stores/auth-store';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Callback page for OAuth authentication redirects.
 * This component handles the authentication flow after a user signs in with a third-party provider.
 */
export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { verify } = useAuthActions();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    // Get error parameters
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'Authentication failed');
      // After a delay, redirect to signin page with error params
      timeoutId = setTimeout(() => {
        navigate(
          `/auth/signin?error=${errorParam}&error_description=${encodeURIComponent(errorDescription || 'Authentication failed')}`,
        );
      }, 1500);
      return () => {
        cancelled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }

    // Handle OAuth callback
    const handleCallback = async () => {
      try {
        logger.log('Processing OAuth callback');

        // Verify the session/token
        await verify();

        logger.log('Session verified successfully');

        // Get the next URL - either from query param or default to root
        const nextPath = searchParams.get('next') || '/';

        // Navigate to the target page
        logger.log('Redirecting to:', nextPath);
        navigate(nextPath);
      } catch (err) {
        logger.error('Error processing OAuth callback:', err);
        setError('An unexpected error occurred during authentication');

        // Redirect to login page after showing error
        if (cancelled) {
          return;
        }
        timeoutId = setTimeout(() => {
          navigate(
            '/auth/signin?error=auth_callback_error&error_description=Failed to complete authentication',
          );
        }, 1500);
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate, searchParams, verify]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {error ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-destructive">
            Authentication Error
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm">Redirecting to sign-in page...</p>
        </div>
      ) : null}
    </div>
  );
}
