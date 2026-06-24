import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

/**
 * Shared API for common resources used across multiple features
 * This centralizes duplicate API calls to avoid code duplication
 */

// ============================================================================
// Currency Types & Interfaces
// ============================================================================

export interface Currency {
  id: string;
  code: string;
  name: string;
  quantity?: number | null;
  sourceType: 'INTERNAL' | 'EXTERNAL';
  isPoint: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Currency[];
}

export interface CurrencySearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  name?: string;
  sourceType?: 'INTERNAL' | 'EXTERNAL';
  isPoint?: boolean;
}

// ============================================================================
// Expiry Policy Types & Interfaces
// ============================================================================

export type ExpiryPolicyType =
  | 'FIXED_DAYS'
  | 'FIXED_MONTH'
  | 'FIXED_YEAR'
  | 'TIER_BASED'
  | 'NO_EXPIRED';
export type ExpiryPolicyStatus = 'ACTIVE' | 'INACTIVE';

export interface ExpiryPolicy {
  id: string;
  code: string;
  name: string;
  type: ExpiryPolicyType;
  currencyId: string;
  status: ExpiryPolicyStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpiryPolicyListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: ExpiryPolicy[];
}

export interface ExpiryPolicySearchParams {
  page?: number;
  size?: number;
  search?: string;
  id?: string;
  code?: string;
  type?: ExpiryPolicyType;
  status?: ExpiryPolicyStatus;
  currencyId?: string;
}

// ============================================================================
// Category Types & Interfaces
// ============================================================================

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  createdAt: number;
}

export interface CategoryListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Category[];
}

export interface CategorySearchParams {
  page?: number;
  size?: number;
  name?: string;
  status?: CategoryStatus;
}

// ============================================================================
// Event Types & Interfaces
// ============================================================================

export interface EventSchemaProperty {
  name: string;
  dataType: string;
  isRequired: boolean;
}

export interface Event {
  id: string;
  name: string;
  properties: EventSchemaProperty[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: Event[];
}

export interface EventSearchParams {
  page?: number;
  size?: number;
  id?: string;
  name?: string;
}

// ============================================================================
// Validation Rule Types & Interfaces
// ============================================================================

export interface ValidationRule {
  id: string;
  name: string;
  rule: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationRuleListResponse {
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
  data: ValidationRule[];
}

// ============================================================================
// Tier Metric Types & Interfaces
// ============================================================================

export interface TierMetric {
  id: string;
  metricName: string;
  metricCode: string;
  eventTypeCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  aggregation: 'COUNT' | 'SUM';
  filterJson?: string;
  formula?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TierMetricListResponse {
  data: TierMetric[];
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
}

// ============================================================================
// Shared API Service
// ============================================================================

export const sharedApi = {
  // --------------------------------------------------------------------------
  // Currency APIs
  // --------------------------------------------------------------------------

  /**
   * Get all currencies without pagination
   */
  getCurrencies: async (
    params?: CurrencySearchParams,
  ): Promise<CurrencyListResponse> => {
    try {
      const response = await axiosInstance.get<CurrencyListResponse>(
        '/api/config/b/currencies',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get all point currencies (isPoint=true)
   */
  getPointCurrencies: async (): Promise<CurrencyListResponse> => {
    try {
      const response = await axiosInstance.get<CurrencyListResponse>(
        '/api/config/b/currencies',
        { params: { isPoint: true } },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // --------------------------------------------------------------------------
  // Expiry Policy APIs
  // --------------------------------------------------------------------------

  /**
   * Get expiry policies by currency ID
   */
  getExpiryPoliciesByCurrency: async (
    currencyId: string,
  ): Promise<ExpiryPolicyListResponse> => {
    try {
      const response = await axiosInstance.get<ExpiryPolicyListResponse>(
        '/api/config/b/expiry-policies',
        { params: { currencyId } },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get all expiry policies without pagination
   */
  getExpiryPolicies: async (
    params?: ExpiryPolicySearchParams,
  ): Promise<ExpiryPolicyListResponse> => {
    try {
      const response = await axiosInstance.get<ExpiryPolicyListResponse>(
        '/api/config/b/expiry-policies',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // --------------------------------------------------------------------------
  // Category APIs
  // --------------------------------------------------------------------------

  /**
   * Get all active categories
   */
  getCategories: async (
    params?: CategorySearchParams,
  ): Promise<CategoryListResponse> => {
    try {
      const response = await axiosInstance.get<CategoryListResponse>(
        '/api/campaign/b/categories?status=ACTIVE',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // --------------------------------------------------------------------------
  // Event APIs
  // --------------------------------------------------------------------------

  /**
   * Get all events
   */
  getEvents: async (params?: EventSearchParams): Promise<EventListResponse> => {
    try {
      const response = await axiosInstance.get<EventListResponse>(
        '/api/config/b/event-schemas',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // --------------------------------------------------------------------------
  // Validation Rule APIs
  // --------------------------------------------------------------------------

  /**
   * Get all validation rules
   */
  getValidationRules: async (): Promise<ValidationRuleListResponse> => {
    try {
      const response = await axiosInstance.get<ValidationRuleListResponse>(
        '/api/config/b/validation-rules',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // --------------------------------------------------------------------------
  // Tier Metric APIs
  // --------------------------------------------------------------------------

  /**
   * Get all tier metrics
   */
  getTierMetrics: async (): Promise<TierMetricListResponse> => {
    try {
      const response = await axiosInstance.get<TierMetricListResponse>(
        '/api/membership/b/metrics',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default sharedApi;
