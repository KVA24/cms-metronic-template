import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectTo?: string;
  logError?: boolean;
}

export function useErrorHandler() {
  const navigate = useNavigate();

  const handleError = useCallback(
    (error: Error | unknown, options: ErrorHandlerOptions = {}) => {
      const { showToast = true, redirectTo, logError = true } = options;

      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      // Log error
      if (logError) {
        console.error('Error:', error);
      }

      // Show toast notification
      if (showToast) {
        toast.error(errorMessage);
      }

      // Redirect if specified
      if (redirectTo) {
        navigate(redirectTo);
      }
    },
    [navigate],
  );

  const handleApiError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        if ('response' in err && err.response) {
          const response = err.response as Record<string, unknown>;
          if ('data' in response && response.data) {
            const data = response.data as Record<string, unknown>;
            errorMessage = (data.message as string) || errorMessage;
          }
        } else if ('message' in err) {
          errorMessage = err.message as string;
        }
      }

      handleError(new Error(errorMessage), options);
    },
    [handleError],
  );

  return { handleError, handleApiError };
}
