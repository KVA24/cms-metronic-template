import { generalConfig } from '@/shared/config/general.config';
import logger from '@/shared/lib/logger';
import { getRecaptchaToken } from '@/shared/lib/recaptcha-manager';
import { storage } from '@/shared/lib/storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Get API URL from window object (set by init.js) or fallback to env variable
const API_BASE_URL = generalConfig.API_URL;

logger.log('🌐 API Base URL:', API_BASE_URL);

// Custom error class for better error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Configuration for reCAPTCHA signature injection
 * Can be customized per request using config.skipRecaptchaSign
 */
export interface RecaptchaSignConfig {
  /**
   * Whether to include reCAPTCHA signature in the request
   * Default: true (for non-GET requests)
   * Set to false to skip signature injection for specific requests
   */
  skipRecaptchaSign?: boolean;
}

// Create axios instance with enhanced configuration
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for CORS
  withCredentials: false,
});

// Track refresh token promise to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add token and request tracking
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig & RecaptchaSignConfig) => {
    const token = storage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically add reCAPTCHA token to query params (only for non-GET requests)
    // Can be disabled per request by setting skipRecaptchaSign: true
    const method = config.method?.toUpperCase();
    const shouldSkipRecaptchaSign = config.skipRecaptchaSign === true;

    if (method !== 'GET' && !shouldSkipRecaptchaSign) {
      const recaptchaToken = await getRecaptchaToken();
      if (recaptchaToken) {
        const separator = config.url?.includes('?') ? '&' : '?';
        config.url = `${config.url}${separator}sign=${recaptchaToken}`;
        logger.log(
          `📝 Added reCAPTCHA token to ${method} request: ${config.url}`,
        );
      }
    } else if (shouldSkipRecaptchaSign) {
      logger.log(
        `⏭️ Skipped reCAPTCHA token for ${method} request (skipRecaptchaSign: true)`,
      );
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata?.startTime) {
      const duration =
        new Date().getTime() - response.config.metadata.startTime.getTime();
      logger.log(
        `[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`,
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _refreshed?: boolean;
    };

    // Handle network errors
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          0,
          'NETWORK_ERROR',
          'Network error. Please check your connection.',
        ),
      );
    }

    const { status, data } = error.response;

    // Handle 401 - Unauthorized (token expired or invalid)
    if (status === 401 && originalRequest) {
      // Skip refresh for login/refresh endpoints - redirect immediately
      if (
        originalRequest.url?.includes('/api/auth/p/generate-token') ||
        originalRequest.url?.includes('/api/auth/p/refresh-token')
      ) {
        logger.error('❌ Auth endpoint returned 401, redirecting to login');
        storage.removeItem('access_token');
        storage.removeItem('refresh_token');
        storage.removeItem('user');

        if (!window.location.pathname.includes('/auth/signin')) {
          window.location.href = `/auth/signin?next=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(error);
      }

      // If this request was already refreshed and still got 401, redirect to login
      if (originalRequest._refreshed) {
        logger.error(
          '❌ Request already refreshed but still got 401, session invalid',
        );
        storage.removeItem('access_token');
        storage.removeItem('refresh_token');
        storage.removeItem('user');

        toast.error('Your session has expired. Please sign in again.');
        if (!window.location.pathname.includes('/auth/signin')) {
          window.location.href = `/auth/signin?next=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(error);
      }

      const refreshToken = storage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token, redirect to login immediately
        logger.error('❌ No refresh token found, redirecting to login');
        storage.removeItem('access_token');
        storage.removeItem('user');

        toast.error('Your session has expired. Please sign in again.');
        if (!window.location.pathname.includes('/auth/signin')) {
          window.location.href = `/auth/signin?next=${encodeURIComponent(window.location.pathname)}`;
        }

        return Promise.reject(error);
      }

      // If already refreshing, queue this request and wait
      if (isRefreshing) {
        logger.log(
          '⏳ Token refresh in progress, queueing request:',
          originalRequest.url,
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            logger.log(
              '✅ Queued request will retry with new token:',
              originalRequest.url,
            );
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            // Mark this request as refreshed
            originalRequest._refreshed = true;
            // No need for additional delay here, already waited before processQueue
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            logger.error(
              '❌ Queued request rejected:',
              originalRequest.url,
              err,
            );
            return Promise.reject(err);
          });
      }

      // Start refresh process - block all other requests
      logger.log(
        '🔒 First 401 detected, starting token refresh for:',
        originalRequest.url,
      );
      logger.log('📊 Blocking all requests until refresh completes');
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        logger.log('🔄 Calling refresh token API...');
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/p/refresh-token?refreshToken=${refreshToken}`,
          {
            refreshToken: refreshToken,
          },
        );

        logger.log('📦 Refresh token response:', response);
        logger.log('📦 Response data:', response.data);

        // Handle refresh token response format:
        // API returns: { token: "hash", refreshToken: "JWT", role: "ADMIN" }
        // The JWT (access token) is in response.data.refreshToken
        // The hash (new refresh token) is in response.data.token
        const access_token =
          response.data.data?.accessToken ||
          response.data.data?.access_token ||
          response.data.refreshToken; // JWT used as access token
        const newRefreshToken =
          response.data.data?.refreshToken || response.data.token; // hash used as new refresh token

        if (!access_token) {
          logger.error('❌ No access token in response:', response.data);
          throw new Error('Invalid refresh response: missing access token');
        }

        logger.log('✅ Token refreshed successfully');
        logger.log('💾 Storing new tokens in storage');

        // Store new tokens
        storage.setItem('access_token', access_token);
        if (newRefreshToken) {
          storage.setItem('refresh_token', newRefreshToken);
        }

        // Add a delay BEFORE processing queue to ensure backend has processed the new token
        logger.log('⏱️ Waiting 1000ms for backend to process new token...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        logger.log('📊 Processing', failedQueue.length, 'queued requests');

        // Resolve all queued requests with new token
        processQueue(null, access_token);

        // Reset refresh flag
        isRefreshing = false;

        logger.log('🔁 Retrying original request:', originalRequest.url);

        // Update authorization header for original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        // Mark this request as refreshed to prevent infinite loop
        originalRequest._refreshed = true;

        // Retry original request with new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        logger.error('❌ Token refresh failed:', refreshError);

        // Reject all queued requests
        processQueue(refreshError as Error, null);

        // Reset refresh flag
        isRefreshing = false;

        // Clear all tokens and redirect
        storage.removeItem('access_token');
        storage.removeItem('refresh_token');
        storage.removeItem('user');

        toast.error('Your session has expired. Please sign in again.');
        if (!window.location.pathname.includes('/auth/signin')) {
          window.location.href = `/auth/signin?next=${encodeURIComponent(window.location.pathname)}`;
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other HTTP errors
    const errorData = data as any;
    const errorMessage =
      errorData?.message || errorData?.error || error.message;
    const errorCode = errorData?.code || `HTTP_${status}`;

    return Promise.reject(
      new ApiError(status, errorCode, errorMessage, errorData),
    );
  },
);

// Utility function to create cancellable requests
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Check if error is a cancel error
export const isCancelError = (error: any): boolean => {
  return axios.isCancel(error);
};

// Helper to handle API errors in components
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.message) {
      return error.message;
    }
    return error.data.errorDesc;
  }
  if (error instanceof AxiosError) {
    const data = error.response?.data as any;
    if (data?.errorDesc) {
      return data.errorDesc;
    }
    return data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Type augmentation for request metadata and reCAPTCHA config
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
    /**
     * Skip reCAPTCHA signature injection for this request
     * Default: false (signature will be included for non-GET requests)
     */
    skipRecaptchaSign?: boolean;
  }

  export interface AxiosRequestConfig {
    /**
     * Skip reCAPTCHA signature injection for this request
     * Default: false (signature will be included for non-GET requests)
     */
    skipRecaptchaSign?: boolean;
  }
}

export default axiosInstance;
