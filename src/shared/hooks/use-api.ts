import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  axiosInstance,
  createCancelToken,
  getErrorMessage,
  isCancelError,
} from '@/shared/lib/api';
import { AxiosRequestConfig, CancelTokenSource } from 'axios';

export interface UseApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseApiOptions<T> extends AxiosRequestConfig {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError | Error) => void;
  cancelOnUnmount?: boolean;
}

/**
 * Custom hook for making API requests with loading and error states
 *
 * @example
 * const { data, loading, error, execute } = useApi<User[]>();
 *
 * useEffect(() => {
 *   execute({ url: '/users', method: 'GET' });
 * }, []);
 */
export function useApi<T = any>(options: UseApiOptions<T> = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
    isSuccess: false,
    isError: false,
  });

  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const {
    onSuccess,
    onError,
    cancelOnUnmount = true,
    ...axiosConfig
  } = options;

  // Cancel request on unmount
  useEffect(() => {
    return () => {
      if (cancelOnUnmount && cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, [cancelOnUnmount]);

  const execute = useCallback(
    async (config?: AxiosRequestConfig) => {
      // Cancel previous request if exists
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('New request initiated');
      }

      // Create new cancel token
      cancelTokenRef.current = createCancelToken();

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        isError: false,
        isSuccess: false,
      }));

      try {
        const response = await axiosInstance.request<T>({
          ...axiosConfig,
          ...config,
          cancelToken: cancelTokenRef.current.token,
        });

        setState({
          data: response.data,
          error: null,
          loading: false,
          isSuccess: true,
          isError: false,
        });

        onSuccess?.(response.data);
        return response.data;
      } catch (err: any) {
        // Don't update state if request was cancelled
        if (isCancelError(err)) {
          return;
        }

        const errorMessage = getErrorMessage(err);

        setState({
          data: null,
          error: errorMessage,
          loading: false,
          isSuccess: false,
          isError: true,
        });

        onError?.(err);
        throw err;
      }
    },
    [axiosConfig, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      loading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for GET requests with automatic execution
 */
export function useApiGet<T = any>(
  url: string,
  options: UseApiOptions<T> = {},
) {
  const api = useApi<T>({ ...options, url, method: 'GET' });

  useEffect(() => {
    api.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, api.execute]);

  return api;
}

/**
 * Hook for mutations (POST, PUT, PATCH, DELETE)
 */
export function useApiMutation<TData = any, TVariables = any>(
  options: UseApiOptions<TData> = {},
) {
  const api = useApi<TData>(options);

  const mutate = useCallback(
    async (variables: TVariables, config?: AxiosRequestConfig) => {
      return api.execute({
        ...config,
        data: variables,
      });
    },
    [api],
  );

  return {
    ...api,
    mutate,
  };
}
