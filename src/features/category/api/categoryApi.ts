import axiosInstance, { getErrorMessage } from '@/shared/lib/api';
import logger from '@/shared/lib/logger';

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  createdAt: number;
}

export interface PageInfo {
  pageNo: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
}

export interface CategoryListResponse {
  pageInfo: PageInfo;
  data: Category[];
}

export interface CategoryCreateDto {
  name: string;
  description: string;
  status: CategoryStatus;
}

export interface CategoryUpdateDto extends CategoryCreateDto {}

export interface CategorySearchParams {
  page?: number;
  size?: number;
  name?: string;
  status?: CategoryStatus;
}

export interface CategoryDeleteParams {
  sign?: string;
  otpCode?: string;
}

/**
 * Category API Service
 */
export const categoryApi = {
  /**
   * Get list of categories with pagination and search
   */
  getListAll: async (
    params?: CategorySearchParams,
  ): Promise<CategoryListResponse> => {
    try {
      const response = await axiosInstance.get<CategoryListResponse>(
        '/api/campaign/b/categories',
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
   * Get list of categories with pagination and search
   */
  getList: async (
    params?: CategorySearchParams,
  ): Promise<CategoryListResponse> => {
    try {
      const response = await axiosInstance.get<CategoryListResponse>(
        '/api/campaign/b/categories/search',
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
   * Get category detail by ID
   */
  getDetail: async (id: string): Promise<Category> => {
    try {
      const response = await axiosInstance.get<{ data: Category }>(
        `/api/campaign/b/categories/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create new category
   */
  create: async (data: CategoryCreateDto): Promise<Category> => {
    try {
      logger.log('API create category called:', { data });

      const response = await axiosInstance.post<Category>(
        `/api/campaign/b/categories`,
        data,
      );
      logger.log('API create category response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API create category error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update existing category
   */
  update: async (
    id: string,
    data: CategoryUpdateDto,
  ): Promise<Category> => {
    try {
      logger.log('API update category called:', { id, data });

      const response = await axiosInstance.put<Category>(
        `/api/campaign/b/categories/${id}`,
        data,
      );
      logger.log('API update category response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('API update category error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete category
   */
  delete: async (id: string, params: CategoryDeleteParams): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/campaign/b/categories/${id}`, {
        params,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default categoryApi;
