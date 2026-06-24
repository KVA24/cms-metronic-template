import React, { ReactElement, ReactNode } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Implement your error logging service here
    // Example: Sentry, LogRocket, etc.
    console.error('Logging error to service:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error }: DefaultErrorFallbackProps) {
  const handleTryAgain = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Oops! Something went wrong
        </h1>
        <p className="mb-6 text-center text-gray-600">
          We encountered an unexpected error. Please try again or contact
          support if the problem persists.
        </p>

        {import.meta.env.DEV && error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="mb-2 text-sm font-semibold text-red-900">
              Error Details:
            </p>
            <p className="break-words text-xs text-red-800">
              {error.toString()}
            </p>
            {error.stack && (
              <pre className="mt-2 overflow-auto text-xs text-red-700">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleTryAgain}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
