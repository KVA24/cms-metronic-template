/**
 * Error utility functions for consistent error handling across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

/**
 * Check if error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Get error status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode || 500;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if ('response' in err && err.response) {
      const response = err.response as Record<string, unknown>;
      if ('status' in response && typeof response.status === 'number') {
        return response.status;
      }
    }
    if ('status' in err && typeof err.status === 'number') {
      return err.status;
    }
  }

  return 500;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  const errorMessage = getErrorMessage(error);
  const statusCode = getErrorStatusCode(error);

  return {
    message: errorMessage,
    statusCode,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...(error instanceof Error && { stack: error.stack }),
    ...(isAppError(error) && {
      code: error.code,
      details: error.details,
    }),
  };
}
