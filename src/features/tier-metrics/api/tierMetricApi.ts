import axiosInstance, { getErrorMessage } from '@/shared/lib/api';

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

export interface TierMetricListParams {
  page?: number;
  size?: number;
  keySearch?: string;
  eventTypeCode?: string;
  status?: string;
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

export interface TierMetricCreateDto {
  metricName: string;
  metricCode: string;
  eventTypeCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  aggregation: 'COUNT' | 'SUM';
  filterJson?: string;
  formula?: string;
  otpCode?: string;
}

export interface TierMetricUpdateDto extends Partial<
  Omit<TierMetricCreateDto, 'otpCode'>
> {
  otpCode?: string;
}

export interface TierMetricDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Tier Metric Management API Service
 */
export const tierMetricApi = {
  /**
   * Get tier metric list
   */
  getList: async (
    params?: TierMetricListParams,
  ): Promise<TierMetricListResponse> => {
    try {
      const response = await axiosInstance.get<TierMetricListResponse>(
        '/api/membership/b/metrics/search',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get tier metric detail by ID
   */
  getDetail: async (id: string): Promise<TierMetric> => {
    try {
      const response = await axiosInstance.get<{ data: TierMetric }>(
        `/api/membership/b/metrics/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new tier metric
   */
  create: async (
    data: TierMetricCreateDto,
  ): Promise<TierMetric> => {
    try {
      const response = await axiosInstance.post<TierMetric>(
        `/api/membership/b/metrics`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing tier metric
   */
  update: async (
    id: string,
    data: TierMetricUpdateDto,
  ): Promise<TierMetric> => {
    try {
      const response = await axiosInstance.put<TierMetric>(
        `/api/membership/b/metrics/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete tier metric
   */
  delete: async (id: string, params: TierMetricDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/membership/b/metrics/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
