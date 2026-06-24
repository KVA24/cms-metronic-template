import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export type ExpiryPolicyType =
  | 'FIXED_DAYS'
  | 'FIXED_MONTH'
  | 'FIXED_YEAR'
  | 'TIER_BASED'
  | 'NO_EXPIRED';
export type ExpiryPolicyStatus = 'ACTIVE' | 'INACTIVE';

export interface ExpiryPolicyConfig {
  configMap?: Record<string, number> | null;
}

export interface ExpiryPolicy {
  id: string;
  code: string;
  name: string;
  type: ExpiryPolicyType;
  currencyId: string;
  status: ExpiryPolicyStatus;
  expiryValue?: number | null;
  config?: ExpiryPolicyConfig | null;
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

export interface ExpiryPolicyCreateDto {
  code: string;
  name: string;
  type: ExpiryPolicyType;
  currencyId: string;
  status: ExpiryPolicyStatus;
  expiryValue?: number | null;
  config?: ExpiryPolicyConfig | null;
}

export interface ExpiryPolicyUpdateDto extends Partial<ExpiryPolicyCreateDto> {}

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

export interface ExpiryPolicyDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Expiry Policy API Service
 */
export const expiryPolicyApi = {
  /**
   * Get all expiry policies without pagination
   */
  getListAll: async (
    params?: ExpiryPolicySearchParams,
  ): Promise<ExpiryPolicyListResponse> => {
    try {
      const response = await axiosInstance.get<ExpiryPolicyListResponse>(
        '/api/config/b/expiry-policies',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get expiry policies by currency ID
   */
  getListByCurrency: async (
    currencyId: string,
  ): Promise<ExpiryPolicyListResponse> => {
    try {
      const response = await axiosInstance.get<ExpiryPolicyListResponse>(
        '/api/config/b/expiry-policies',
        {
          params: { currencyId },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get list of expiry policies with search filters (with pagination)
   */
  getList: async (
    params?: ExpiryPolicySearchParams,
  ): Promise<ExpiryPolicyListResponse> => {
    try {
      const response = await axiosInstance.get<ExpiryPolicyListResponse>(
        '/api/config/b/expiry-policies/search',
        {
          params,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get expiry policy detail by ID
   */
  getDetail: async (id: string): Promise<ExpiryPolicy> => {
    try {
      const response = await axiosInstance.get<{ data: ExpiryPolicy }>(
        `/api/config/b/expiry-policies/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new expiry policy
   */
  create: async (
    data: ExpiryPolicyCreateDto,
  ): Promise<ExpiryPolicy> => {
    try {
      logger.log('API create expiry policy called:', { data });

      const response = await axiosInstance.post<ExpiryPolicy>(
        `/api/config/b/expiry-policies`,
        data,
      );
      logger.log('API create expiry policy response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create expiry policy error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing expiry policy
   */
  update: async (
    id: string,
    data: ExpiryPolicyUpdateDto,
  ): Promise<ExpiryPolicy> => {
    try {
      logger.log('API update expiry policy called:', { id, data });

      const response = await axiosInstance.put<ExpiryPolicy>(
        `/api/config/b/expiry-policies/${id}`,
        data,
      );
      logger.log('API update expiry policy response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update expiry policy error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete expiry policy
   */
  delete: async (
    id: string,
    params: ExpiryPolicyDeleteParams,
  ): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/expiry-policies/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default expiryPolicyApi;
