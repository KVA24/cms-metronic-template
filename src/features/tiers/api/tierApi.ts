import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

/**
 * Condition for tier upgrade based on metrics - Recursive Tree Structure
 */
export interface TierCondition {
  nodeType: 'OPERATOR' | 'CONDITION';
  logicalOperator?: 'AND' | 'OR' | 'NOT';
  children?: TierCondition[];
  metricCode?: string;
  comparisonOperator?: 'GTE' | 'LTE' | 'GT' | 'LT' | 'EQ' | 'NEQ';
  thresholdValue?: number;
}

/**
 * Benefit item for a tier
 */
export interface TierBenefit {
  id?: string;
  iconUrl?: string;
  content: string;
  sortOrder?: number;
}

/**
 * Tier entity
 */
export interface Tier {
  id: string;
  name: string;
  code: string;
  iconUrl?: string;
  conditions: TierCondition[];
  rank: number;
  benefits: TierBenefit[];
  titleUpgradeLevel?: string;
  messageUpgradeLevel?: string;
  titleDowngradeLevel?: string;
  messageDowngradeLevel?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface TierListParams {
  id?: string;
  name?: string;
  code?: string;
  page?: number;
  size?: number;
}

export interface TierListResponse {
  data: Tier[];
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
}

/**
 * DTO for creating a new tier
 */
export interface TierCreateDto {
  name: string;
  code: string;
  iconUrl?: string;
  conditions: TierCondition[];
  rank: number;
  benefits: TierBenefit[];
  titleUpgradeLevel?: string;
  messageUpgradeLevel?: string;
  titleDowngradeLevel?: string;
  messageDowngradeLevel?: string;
  otpCode: string;
}

/**
 * DTO for updating an existing tier
 */
export interface TierUpdateDto extends Partial<Omit<TierCreateDto, 'otpCode'>> {
  id?: string;
  otpCode: string;
}

export interface TierDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Membership Tier Management API Service
 */
export const tierApi = {
  /**
   * Get tier list
   */
  getListAll: async (): Promise<TierListResponse> => {
    try {
      const response = await axiosInstance.get<TierListResponse>(
        '/api/membership/b/tiers',
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get tier list
   */
  getList: async (params?: TierListParams): Promise<TierListResponse> => {
    try {
      const response = await axiosInstance.get<TierListResponse>(
        '/api/membership/b/tiers/search',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get tier detail by ID
   */
  getDetail: async (id: string): Promise<Tier> => {
    try {
      const response = await axiosInstance.get<{ data: Tier }>(
        `/api/membership/b/tiers/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new tier
   */
  create: async (data: TierCreateDto): Promise<Tier> => {
    try {
      const response = await axiosInstance.post<{ data: Tier }>(
        `/api/membership/b/tiers`,
        data,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing tier
   */
  update: async (id: string, data: TierUpdateDto): Promise<Tier> => {
    try {
      const response = await axiosInstance.put<{ data: Tier }>(
        `/api/membership/b/tiers/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete tier
   */
  delete: async (id: string, params?: TierDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/membership/b/tiers/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
