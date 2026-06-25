import { useCallback } from 'react';
import { useSearchParams as useRouterSearchParams } from 'react-router-dom';

/**
 * Type for param updates
 */
export type ParamUpdates = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Options for updateParams
 */
export interface UpdateParamsOptions {
  /**
   * Values that should be considered as "default" and removed from URL
   * Example: { page: 0, limit: 10 }
   */
  defaults?: Record<string, any>;

  /**
   * Whether to replace current history entry (default: true)
   */
  replace?: boolean;
}

/**
 * Hook to manage URL search params with utilities
 */
export function useUrlParams(options: UpdateParamsOptions = {}) {
  const [searchParams, setSearchParams] = useRouterSearchParams();
  const { defaults = {}, replace = true } = options;

  /**
   * Get a param value with default
   */
  const getParam = useCallback(
    (key: string, defaultValue: string = ''): string => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams],
  );

  /**
   * Get a param as number
   */
  const getNumberParam = useCallback(
    (key: string, defaultValue: number = 0): number => {
      const value = searchParams.get(key);
      if (!value) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    [searchParams],
  );

  /**
   * Get a param as boolean
   */
  const getBooleanParam = useCallback(
    (key: string, defaultValue: boolean = false): boolean => {
      const value = searchParams.get(key);
      if (!value) return defaultValue;
      return value === 'true' || value === '1';
    },
    [searchParams],
  );

  /**
   * Update multiple params at once
   * Automatically removes default values to keep URL clean
   */
  const updateParams = useCallback(
    (updates: ParamUpdates) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        // Remove if null, undefined, empty string, or matches default
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (defaults[key] !== undefined && value === defaults[key])
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      setSearchParams(params, { replace });
    },
    [searchParams, setSearchParams, defaults, replace],
  );

  /**
   * Set a single param
   */
  const setParam = useCallback(
    (key: string, value: string | number | boolean | null) => {
      updateParams({ [key]: value });
    },
    [updateParams],
  );

  /**
   * Remove a param
   */
  const removeParam = useCallback(
    (key: string) => {
      updateParams({ [key]: null });
    },
    [updateParams],
  );

  /**
   * Clear all params
   */
  const clearParams = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace });
  }, [setSearchParams, replace]);

  /**
   * Get all params as object
   */
  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  return {
    // Getters
    getParam,
    getNumberParam,
    getBooleanParam,
    getAllParams,

    // Setters
    updateParams,
    setParam,
    removeParam,
    clearParams,

    // Raw
    searchParams,
  };
}

/**
 * Hook for pagination params
 */
export function usePaginationParams(
  options: {
    defaultPage?: number;
    defaultLimit?: number;
  } = {},
) {
  const { defaultPage = 0, defaultLimit = 10 } = options;

  const { getNumberParam, updateParams } = useUrlParams({
    defaults: {
      page: defaultPage,
      limit: defaultLimit,
    },
  });

  const page = getNumberParam('page', defaultPage);
  const limit = getNumberParam('limit', defaultLimit);

  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage });
    },
    [updateParams],
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      // Reset to first page when changing limit
      updateParams({ limit: newLimit, page: defaultPage });
    },
    [updateParams, defaultPage],
  );

  const setPageAndLimit = useCallback(
    (newPage: number, newLimit: number) => {
      updateParams({ page: newPage, limit: newLimit });
    },
    [updateParams],
  );

  return {
    page,
    limit,
    setPage,
    setLimit,
    setPageAndLimit,
  };
}

