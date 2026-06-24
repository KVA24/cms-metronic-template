import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export interface Config {
  id: string;
  keyConfig: string;
  valueConfig: string;
  otpCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigListResponse {
  data: Config[];
  pageInfo: {
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
  };
}

export interface ConfigCreateDto {
  keyConfig: string;
  valueConfig: string;
  otpCode: string;
  isActive: boolean;
}

export interface ConfigUpdateDto extends Partial<ConfigCreateDto> {}

export interface ConfigSearchParams {
  page?: number;
  size?: number;
  limit?: number;
  search?: string;
  keyConfig?: string;
  category?: string;
  isActive?: boolean;
}

export interface ConfigDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Config API Service
 */
export const configApi = {
  /**
   * Get list of configs with pagination and search
   */
  getList: async (params?: ConfigSearchParams): Promise<ConfigListResponse> => {
    try {
      const response = await axiosInstance.get<ConfigListResponse>(
        '/api/config/b/configs/search',
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
   * Get config detail by ID
   */
  getDetail: async (id: string): Promise<Config> => {
    try {
      const response = await axiosInstance.get<{ data: Config }>(
        `/api/config/b/configs/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new config
   */
  create: async (data: ConfigCreateDto): Promise<Config> => {
    try {
      logger.log('API create called:', { data });

      const response = await axiosInstance.post<Config>(
        `/api/config/b/configs`,
        data,
      );
      logger.log('API create response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing config
   */
  update: async (id: string, data: ConfigUpdateDto): Promise<Config> => {
    try {
      logger.log('API update called:', { id, data });

      const response = await axiosInstance.put<Config>(
        `/api/config/b/configs/${id}`,
        data,
      );
      logger.log('API update response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete config
   */
  delete: async (id: string, params: ConfigDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/config/b/configs/${id}`, { params });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default configApi;
