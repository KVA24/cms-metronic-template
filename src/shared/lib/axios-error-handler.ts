import axios, { AxiosError, AxiosInstance } from 'axios';
import { toast } from 'sonner';
import { getErrorMessage, getErrorStatusCode } from './error-utils';

/**
 * Setup global error handler for axios instance
 */
export function setupAxiosErrorHandler(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const statusCode = getErrorStatusCode(error);
      const errorMessage = getErrorMessage(error);

      // Handle specific status codes
      switch (statusCode) {
        case 401:
          // Unauthorized - redirect to login
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/auth/signin';
          break;

        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action.');
          break;

        case 404:
          // Not found
          toast.error('The requested resource was not found.');
          break;

        case 422:
          // Validation error
          if (error.response?.data) {
            const data = error.response.data as Record<string, unknown>;
            if ('errors' in data) {
              const errors = data.errors as Record<string, unknown>;
              Object.entries(errors).forEach(([field, messages]) => {
                const msg = Array.isArray(messages) ? messages[0] : messages;
                toast.error(`${field}: ${msg}`);
              });
            } else {
              toast.error(errorMessage);
            }
          }
          break;

        case 429:
          // Too many requests
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          toast.error('Server error. Please try again later.');
          break;

        default:
          if (statusCode >= 400) {
            toast.error(errorMessage);
          }
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error('API Error:', {
          status: statusCode,
          message: errorMessage,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data,
        });
      }

      return Promise.reject(error);
    },
  );
}

/**
 * Create axios instance with error handling
 */
export function createAxiosInstance(baseURL?: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
  });

  setupAxiosErrorHandler(instance);

  return instance;
}
